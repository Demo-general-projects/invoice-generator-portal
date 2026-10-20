import express, { type ErrorRequestHandler } from "express";
import { sendError } from "./http";
import { invoicesRouter } from "./routes/invoices";

/** Builds the Express API. Kept separate from `listen` so tests can use it directly. */
export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "200kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });
  app.use("/api/invoices", invoicesRouter);

  app.use("/api", (_req, res) => {
    sendError(res, 404, "Not found");
  });

  // Express 5 forwards rejected async handlers here. Express recognises error
  // handlers by their four parameters, so `_next` must stay even though unused.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onError: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error?.type === "entity.parse.failed") return sendError(res, 400, "Request body must be valid JSON");
    if (error?.type === "entity.too.large") return sendError(res, 413, "Request body is too large");
    console.error(error);
    sendError(res, 500, "Something went wrong on the server");
  };
  app.use(onError);

  return app;
}
