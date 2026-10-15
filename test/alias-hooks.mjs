import { existsSync } from "node:fs"
import { fileURLToPath, pathToFileURL } from "node:url"
import path from "node:path"

// Resolves the "@/..." path alias from tsconfig.json for `node --test`.
// Node strips TypeScript types natively but does not read tsconfig paths, and
// `next/server` has no package exports map, so plain Node ESM cannot find it.

const projectRoot = path.resolve(fileURLToPath(import.meta.url), "..", "..")
const CANDIDATE_SUFFIXES = ["", ".ts", ".tsx", ".mts", ".js", ".mjs", "/index.ts", "/index.js"]

function firstExisting(base) {
  for (const suffix of CANDIDATE_SUFFIXES) {
    const candidate = `${base}${suffix}`
    if (suffix !== "" && existsSync(candidate)) {
      return pathToFileURL(candidate).href
    }
  }
  return null
}

export async function resolve(specifier, context, next) {
  if (specifier === "next/server" || specifier === "next/headers") {
    return next(`${specifier}.js`, context)
  }

  if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    !path.extname(specifier) &&
    context.parentURL?.startsWith("file:") &&
    !context.parentURL.includes("/node_modules/")
  ) {
    const url = firstExisting(path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier))
    if (url) {
      return { url, shortCircuit: true }
    }
  }

  if (!specifier.startsWith("@/")) {
    return next(specifier, context)
  }

  const url = firstExisting(path.join(projectRoot, specifier.slice(2)))
  if (url) {
    return { url, shortCircuit: true }
  }

  throw new Error(`Cannot resolve path alias "${specifier}" from ${projectRoot}`)
}
