/**
 * OTP attempt and issue limits against a small in-memory user_otps table.
 * The SQL itself was exercised against a real Postgres engine separately;
 * these tests pin the decisions the code makes on what the queries return.
 * No database or network is used.
 */
import assert from "node:assert/strict"
import test from "node:test"

import {
  OTP_ISSUE_WINDOW_MINUTES,
  OTP_MAX_FAILED_ATTEMPTS,
  OTP_MAX_ISSUES_PER_WINDOW,
  checkOtpAttempt,
  generateOtp,
  isOtpRateLimitError,
  reserveOtpIssue,
  type OtpQueryable,
} from "@/lib/otp/otp-limits"

type OtpRow = {
  otp_id: string
  identity_id: string
  otp_code: string
  created_at: number
  expires_at: number
  used_at: number | null
  failed_attempts: number
}

const IDENTITY = "11111111-1111-4111-8111-111111111111"
const MINUTE = 60_000

class FakeOtpTable implements OtpQueryable {
  rows: OtpRow[] = []
  locks: string[] = []
  /** Runs between checkOtpAttempt's SELECT and UPDATE, to simulate a race. */
  beforeAttemptUpdate: (() => void) | null = null
  private nextId = 1

  issue(code: string, { ageMinutes = 0, identityId = IDENTITY } = {}) {
    const createdAt = Date.now() - ageMinutes * MINUTE
    const row: OtpRow = {
      otp_id: `00000000-0000-4000-8000-${String(this.nextId++).padStart(12, "0")}`,
      identity_id: identityId,
      otp_code: code,
      created_at: createdAt,
      expires_at: createdAt + 5 * MINUTE,
      used_at: null,
      failed_attempts: 0,
    }
    this.rows.push(row)
    return row
  }

  private live(identityId: string) {
    const now = Date.now()
    return this.rows.filter((row) => row.identity_id === identityId && row.used_at === null && row.expires_at > now)
  }

  async query(text: string, params: unknown[] = []) {
    const sql = text.replace(/\s+/g, " ").trim()
    const now = Date.now()

    if (sql.startsWith("SELECT pg_advisory_xact_lock")) {
      this.locks.push(String(params[0]))
      return { rows: [] }
    }

    if (sql.startsWith("SELECT count(*)::int AS issued")) {
      const windowStart = now - Number(params[1]) * MINUTE
      const issued = this.rows.filter((row) => row.identity_id === params[0] && row.created_at > windowStart).length
      return { rows: [{ issued }] }
    }

    if (sql.startsWith("UPDATE public.user_otps SET used_at = now() WHERE identity_id")) {
      for (const row of this.live(String(params[0]))) row.used_at = now
      return { rows: [] }
    }

    if (sql.startsWith("SELECT otp_id::text AS otp_id, otp_code")) {
      const newest = this.live(String(params[0])).sort((a, b) => b.created_at - a.created_at)[0]
      return { rows: newest ? [{ otp_id: newest.otp_id, otp_code: newest.otp_code }] : [] }
    }

    if (sql.startsWith("UPDATE public.user_otps SET failed_attempts")) {
      this.beforeAttemptUpdate?.()
      const row = this.rows.find((candidate) => candidate.otp_id === params[0] && candidate.used_at === null)
      if (!row) return { rows: [] }
      row.failed_attempts += 1
      if (row.failed_attempts >= Number(params[1])) row.used_at = now
      return { rows: [{ failed_attempts: row.failed_attempts }] }
    }

    throw new Error(`Unexpected SQL in test: ${sql.slice(0, 80)}`)
  }
}

test("generated codes are 6 digits", () => {
  for (let i = 0; i < 2000; i += 1) {
    assert.match(generateOtp(), /^[1-9]\d{5}$/)
  }
})

test("the correct code is valid and is not consumed by the check", async () => {
  const db = new FakeOtpTable()
  const row = db.issue("482913")

  assert.deepEqual(await checkOtpAttempt(db, IDENTITY, "482913"), { status: "valid" })
  assert.equal(row.used_at, null)
  assert.equal(row.failed_attempts, 0)
})

test("wrong guesses count down and the code is voided on the last allowed attempt", async () => {
  const db = new FakeOtpTable()
  const row = db.issue("482913")

  for (let remaining = OTP_MAX_FAILED_ATTEMPTS - 1; remaining >= 1; remaining -= 1) {
    assert.deepEqual(await checkOtpAttempt(db, IDENTITY, "000000"), { status: "invalid", attemptsRemaining: remaining })
  }

  assert.deepEqual(await checkOtpAttempt(db, IDENTITY, "000000"), { status: "locked" })
  assert.notEqual(row.used_at, null)
  // Once voided, even the right code no longer works.
  assert.deepEqual(await checkOtpAttempt(db, IDENTITY, "482913"), { status: "missing" })
})

test("only the newest live code is accepted", async () => {
  const db = new FakeOtpTable()
  db.issue("111111", { ageMinutes: 2 })
  db.issue("222222")

  assert.equal((await checkOtpAttempt(db, IDENTITY, "111111")).status, "invalid")
  assert.equal((await checkOtpAttempt(db, IDENTITY, "222222")).status, "valid")
})

test("expired or absent codes report missing without counting an attempt", async () => {
  const db = new FakeOtpTable()
  const expired = db.issue("482913", { ageMinutes: 6 })

  assert.deepEqual(await checkOtpAttempt(db, IDENTITY, "482913"), { status: "missing" })
  assert.equal(expired.failed_attempts, 0)
})

test("a code consumed between the check and the count reports missing", async () => {
  const db = new FakeOtpTable()
  const row = db.issue("482913")
  db.beforeAttemptUpdate = () => {
    row.used_at = Date.now()
  }

  assert.deepEqual(await checkOtpAttempt(db, IDENTITY, "000000"), { status: "missing" })
})

test("issuing a code takes the per-identity lock and voids every live code", async () => {
  const db = new FakeOtpTable()
  const first = db.issue("111111", { ageMinutes: 1 })
  const second = db.issue("222222")
  const otherIdentity = db.issue("333333", { identityId: "99999999-9999-4999-8999-999999999999" })

  await reserveOtpIssue(db, IDENTITY)

  assert.deepEqual(db.locks, [`otp-issue:${IDENTITY}`])
  assert.notEqual(first.used_at, null)
  assert.notEqual(second.used_at, null)
  assert.equal(otherIdentity.used_at, null)
})

test("issuing is refused once the window's cap is reached", async () => {
  const db = new FakeOtpTable()
  for (let i = 0; i < OTP_MAX_ISSUES_PER_WINDOW; i += 1) db.issue(`10000${i}`, { ageMinutes: i })

  await assert.rejects(reserveOtpIssue(db, IDENTITY), (error: unknown) => {
    assert.ok(isOtpRateLimitError(error))
    assert.match(error.publicMessage, new RegExp(`${OTP_ISSUE_WINDOW_MINUTES} minutes`))
    return true
  })
})

test("codes issued before the window do not count toward the cap", async () => {
  const db = new FakeOtpTable()
  for (let i = 0; i < OTP_MAX_ISSUES_PER_WINDOW; i += 1) {
    db.issue(`10000${i}`, { ageMinutes: OTP_ISSUE_WINDOW_MINUTES + 1 + i })
  }

  await reserveOtpIssue(db, IDENTITY)
})
