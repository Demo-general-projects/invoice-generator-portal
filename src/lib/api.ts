import type { z } from "zod";

/** Consistent error shape for every API route: { error: { message, fieldErrors? } }. */
export function apiError(status: number, message: string, fieldErrors?: Record<string, string>) {
  return Response.json({ error: { message, fieldErrors } }, { status });
}

/** Parses a JSON body against a schema, returning either data or a ready 400 response. */
export async function parseBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<{ data: z.output<T> } | { response: Response }> {
  const json = await request.json().catch(() => undefined);
  if (json === undefined) return { response: apiError(400, "Request body must be valid JSON") };
  const result = schema.safeParse(json);
  if (result.success) return { data: result.data };
  const fieldErrors = Object.fromEntries(result.error.issues.map((i) => [i.path.join("."), i.message]));
  const first = result.error.issues[0]?.message ?? "Invalid request";
  return { response: apiError(400, first, fieldErrors) };
}
