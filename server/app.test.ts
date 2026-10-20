import { execSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Express } from "express";

// Runs the real Express app against a throwaway SQLite database. No email is
// sent: SMTP settings are cleared, so the email route must answer 503.

let app: Express;
let dir: string;

const validInvoice = {
  number: "INV-0001",
  issueDate: "2026-10-20",
  dueDate: "2026-11-19",
  businessName: "Acme Studio",
  businessEmail: "hello@acme.test",
  businessAddress: "",
  customerName: "Bright Solutions",
  customerEmail: "billing@bright.test",
  customerAddress: "",
  notes: "",
  discountCents: 1000,
  taxRateBps: 1000,
  lineItems: [{ description: "Design", quantityHundredths: 200, unitPriceCents: 5000 }],
  customFields: [{ label: "PO", value: "123", visible: false }],
};

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), "ledgerline-api-"));
  process.env.DATABASE_URL = `file:${join(dir, "test.db")}`;
  for (const key of ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "EMAIL_FROM"]) delete process.env[key];
  execSync("npx prisma migrate deploy", { env: process.env, stdio: "ignore" });
  const { createApp } = await import("./app");
  app = createApp();
}, 60_000);

afterAll(async () => {
  const { db } = await import("./db");
  await db.$disconnect();
  rmSync(dir, { recursive: true, force: true });
});

describe("Express invoice API", () => {
  let id: string;

  it("reports health", async () => {
    await request(app).get("/api/health").expect(200, { ok: true });
  });

  it("creates an invoice and returns server-calculated totals ($99.00)", async () => {
    const res = await request(app).post("/api/invoices").send(validInvoice).expect(201);
    id = res.body.invoice.id;
    expect(res.body.totals.totalCents).toBe(9900);
    expect(res.body.invoice.customFields[0]).toMatchObject({ label: "PO", visible: false });
  });

  it("lists invoices with JSON-friendly dates", async () => {
    const res = await request(app).get("/api/invoices").expect(200);
    expect(res.body.invoices).toHaveLength(1);
    expect(res.body.invoices[0]).toMatchObject({ number: "INV-0001", totalCents: 9900, itemCount: 1, lastSentAt: null });
    expect(typeof res.body.invoices[0].updatedAt).toBe("string");
  });

  it("gets one invoice, and 404s for unknown ids", async () => {
    await request(app).get(`/api/invoices/${id}`).expect(200);
    const res = await request(app).get("/api/invoices/missing").expect(404);
    expect(res.body.error.message).toBe("Invoice not found");
  });

  it("updates an invoice", async () => {
    const res = await request(app)
      .put(`/api/invoices/${id}`)
      .send({ ...validInvoice, taxRateBps: 0 })
      .expect(200);
    expect(res.body.totals.totalCents).toBe(9000);
  });

  it("suggests the next invoice number", async () => {
    const res = await request(app).get("/api/invoices/defaults").expect(200);
    expect(res.body.number).toBe("INV-0002");
    expect(res.body.business).toMatchObject({ businessName: "Acme Studio" });
  });

  it("rejects a duplicate invoice number with 409", async () => {
    await request(app).post("/api/invoices").send(validInvoice).expect(409);
  });

  it("rejects negative tax and a discount above the subtotal with field errors", async () => {
    const res = await request(app)
      .post("/api/invoices")
      .send({ ...validInvoice, number: "INV-0099", taxRateBps: -1, discountCents: 20000 })
      .expect(400);
    expect(res.body.error.fieldErrors).toMatchObject({
      taxRateBps: "Tax can't be negative",
      discountCents: "Discount can't exceed the subtotal ($100.00)",
    });
  });

  it("rejects malformed JSON", async () => {
    const res = await request(app).post("/api/invoices").set("Content-Type", "application/json").send("{bad").expect(400);
    expect(res.body.error.message).toBe("Request body must be valid JSON");
  });

  it("validates the email request, then reports missing SMTP settings", async () => {
    await request(app).post(`/api/invoices/${id}/email`).send({ to: "nope", subject: "Hi", message: "" }).expect(400);
    const res = await request(app)
      .post(`/api/invoices/${id}/email`)
      .send({ to: "me@example.com", subject: "Hi", message: "" })
      .expect(503);
    expect(res.body.error.message).toMatch(/isn't configured/);
  });
});
