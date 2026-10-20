import type { Response } from "express";
import type { z } from "zod";
import type { ApiErrorBody } from "../src/lib/api-types";

/** Consistent error shape for every API route: { error: { message, fieldErrors? } }. */
export function sendError(res: Response, status: number, message: string, fieldErrors?: Record<string, string>) {
  const body: ApiErrorBody = { error: { message, fieldErrors } };
  return res.status(status).json(body);
}

/** Validates a parsed JSON body; on failure sends a 400 with per-field messages and returns null. */
export function validate<T extends z.ZodType>(res: Response, schema: T, body: unknown): z.output<T> | null {
  const result = schema.safeParse(body);
  if (result.success) return result.data;
  const fieldErrors = Object.fromEntries(result.error.issues.map((i) => [i.path.join("."), i.message]));
  sendError(res, 400, result.error.issues[0]?.message ?? "Invalid request", fieldErrors);
  return null;
}
