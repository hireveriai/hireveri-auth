export async function onRequestError(
  error: unknown,
  request: { method?: string },
  context: { routePath?: string; routeType?: string },
) {
  const { reportServerError } = await import("@/lib/error-reporting");
  await reportServerError("auth", error, request, context);
}
