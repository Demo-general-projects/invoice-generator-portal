import { Prisma } from "./generated/prisma/client";
import { db } from "./db";
import type { InvoiceSummary } from "./domain/api-types";
import type { InvoiceInput } from "./domain/invoice-schema";
import { calculateTotals } from "./domain/totals";

// Data access for the API server. Routes go through these functions so the
// Prisma shape never leaks into responses.

const withChildren = {
  lineItems: { orderBy: { position: "asc" } },
  customFields: { orderBy: { position: "asc" } },
} satisfies Prisma.InvoiceInclude;

type InvoiceRecord = Prisma.InvoiceGetPayload<{ include: typeof withChildren }>;

export type StoredInvoice = InvoiceInput & { id: string; lastSentAt: Date | null; createdAt: Date; updatedAt: Date };

export class DuplicateInvoiceNumberError extends Error {
  constructor(number: string) {
    super(`Invoice number ${number} is already used by another invoice`);
  }
}

function toStored(record: InvoiceRecord): StoredInvoice {
  const { lineItems, customFields, ...invoice } = record;
  return {
    ...invoice,
    lineItems: lineItems.map(({ description, quantityHundredths, unitPriceCents }) => ({
      description,
      quantityHundredths,
      unitPriceCents,
    })),
    customFields: customFields.map(({ label, value, visible }) => ({ label, value, visible })),
  };
}

function toData(input: InvoiceInput) {
  const { lineItems, customFields, ...scalars } = input;
  return {
    scalars,
    lineItems: lineItems.map((line, position) => ({ ...line, position })),
    customFields: customFields.map((field, position) => ({ ...field, position })),
  };
}

async function rethrowDuplicate<T>(number: string, write: Promise<T>): Promise<T> {
  try {
    return await write;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new DuplicateInvoiceNumberError(number);
    }
    throw error;
  }
}

export async function getInvoice(id: string): Promise<StoredInvoice | null> {
  const record = await db.invoice.findUnique({ where: { id }, include: withChildren });
  return record ? toStored(record) : null;
}

export async function listInvoices(): Promise<InvoiceSummary[]> {
  const records = await db.invoice.findMany({ include: withChildren, orderBy: { updatedAt: "desc" } });
  return records.map((record) => {
    const invoice = toStored(record);
    return {
      id: invoice.id,
      number: invoice.number,
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      totalCents: calculateTotals(invoice).totalCents,
      itemCount: invoice.lineItems.length,
      lastSentAt: invoice.lastSentAt?.toISOString() ?? null,
      updatedAt: invoice.updatedAt.toISOString(),
    };
  });
}

export async function createInvoice(input: InvoiceInput): Promise<StoredInvoice> {
  const { scalars, lineItems, customFields } = toData(input);
  const record = await rethrowDuplicate(
    input.number,
    db.invoice.create({
      data: { ...scalars, lineItems: { create: lineItems }, customFields: { create: customFields } },
      include: withChildren,
    }),
  );
  return toStored(record);
}

/** Replaces the invoice and its children in a single atomic update. Returns null if not found. */
export async function updateInvoice(id: string, input: InvoiceInput): Promise<StoredInvoice | null> {
  const exists = await db.invoice.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return null;
  const { scalars, lineItems, customFields } = toData(input);
  const record = await rethrowDuplicate(
    input.number,
    db.invoice.update({
      where: { id },
      data: {
        ...scalars,
        lineItems: { deleteMany: {}, create: lineItems },
        customFields: { deleteMany: {}, create: customFields },
      },
      include: withChildren,
    }),
  );
  return toStored(record);
}

export async function markInvoiceSent(id: string): Promise<Date> {
  const { lastSentAt } = await db.invoice.update({ where: { id }, data: { lastSentAt: new Date() } });
  return lastSentAt!;
}

/** Suggests the next number by incrementing the most recent one: INV-0007 -> INV-0008. */
export async function suggestInvoiceNumber(): Promise<string> {
  const latest = await db.invoice.findFirst({ orderBy: { createdAt: "desc" }, select: { number: true } });
  const match = latest?.number.match(/^(.*?)(\d+)$/);
  if (!match) return "INV-0001";
  const [, prefix, digits] = match;
  for (let n = Number(digits) + 1; ; n++) {
    const candidate = `${prefix}${String(n).padStart(digits.length, "0")}`;
    const taken = await db.invoice.findUnique({ where: { number: candidate }, select: { id: true } });
    if (!taken) return candidate;
  }
}

/** New invoices reuse the sender details from the most recent invoice. */
export async function latestBusinessDetails() {
  return db.invoice.findFirst({
    orderBy: { createdAt: "desc" },
    select: { businessName: true, businessEmail: true, businessAddress: true },
  });
}

