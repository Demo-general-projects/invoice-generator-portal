import { formatDate } from "../domain/dates";
import type { StoredInvoice } from "../invoices";
import { formatDecimal, formatUSD } from "../domain/money";
import { calculateTotals } from "../domain/totals";

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const multiline = (value: string) => escape(value).replace(/\n/g, "<br>");

const TEAL = "#1b4d48";
const MUTED = "#5b6765";
const BORDER = "#e3e3dd";

/**
 * Builds an email-client-safe invoice (tables + inline styles) and a plain-text
 * alternative. Every user-provided string is HTML-escaped.
 */
export function renderInvoiceEmail(invoice: StoredInvoice, options: { message: string; viewUrl: string }) {
  const totals = calculateTotals(invoice);
  const fields = invoice.customFields.filter((f) => f.visible);
  const meta: [string, string][] = [
    ["Invoice no.", invoice.number],
    ["Issue date", formatDate(invoice.issueDate)],
    ["Due date", formatDate(invoice.dueDate)],
    ...fields.map((f): [string, string] => [f.label, f.value]),
  ];
  const summary: [string, string][] = [
    ["Subtotal", formatUSD(totals.subtotalCents)],
    ...(totals.discountCents ? [["Discount", `−${formatUSD(totals.discountCents)}`] as [string, string]] : []),
    [`Tax (${formatDecimal(invoice.taxRateBps, 2)}%)`, formatUSD(totals.taxCents)],
  ];

  const td = `padding:10px 8px;border-bottom:1px solid ${BORDER};font-size:14px;`;
  const rows = invoice.lineItems
    .map(
      (line, i) => `<tr>
        <td style="${td}color:${MUTED}">${i + 1}</td>
        <td style="${td}">${escape(line.description)}</td>
        <td style="${td}text-align:right">${formatDecimal(line.quantityHundredths, 2)}</td>
        <td style="${td}text-align:right">${formatUSD(line.unitPriceCents)}</td>
        <td style="${td}text-align:right">${formatUSD(totals.lineTotalsCents[i])}</td>
      </tr>`,
    )
    .join("");

  const html = `<!doctype html><html><body style="margin:0;background:#f4f6f8;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#16201f">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
  <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#fff;border:1px solid ${BORDER};border-radius:12px">
    <tr><td style="padding:32px 32px 8px">
      ${options.message.trim() ? `<p style="margin:0 0 24px;font-size:15px;line-height:1.6">${multiline(options.message)}</p>` : ""}
      <table role="presentation" width="100%"><tr>
        <td style="vertical-align:top">
          <div style="font-family:Georgia,serif;font-size:24px">${escape(invoice.businessName)}</div>
          <div style="margin-top:6px;font-size:13px;color:${MUTED};line-height:1.5">${multiline(invoice.businessAddress)}${invoice.businessEmail ? `<br>${escape(invoice.businessEmail)}` : ""}</div>
        </td>
        <td style="vertical-align:top;text-align:right">
          <div style="font-family:Georgia,serif;font-size:30px;letter-spacing:2px;color:${TEAL}">INVOICE</div>
          <table role="presentation" align="right" style="margin-top:8px;font-size:13px">
            ${meta.map(([k, v]) => `<tr><td style="color:${MUTED};padding:1px 12px 1px 0;text-align:right">${escape(k)}</td><td style="text-align:right;font-weight:600">${escape(v)}</td></tr>`).join("")}
          </table>
        </td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:16px 32px">
      <div style="font-size:11px;letter-spacing:1.5px;font-weight:700;color:${TEAL}">BILL TO</div>
      <div style="margin-top:6px;font-weight:600">${escape(invoice.customerName)}</div>
      <div style="font-size:13px;color:${MUTED};line-height:1.5">${multiline(invoice.customerAddress)}</div>
    </td></tr>
    <tr><td style="padding:8px 32px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr style="background:#eef4f2;color:${TEAL};font-size:11px;letter-spacing:1px">
          <th align="left" style="padding:8px">#</th><th align="left" style="padding:8px">DESCRIPTION</th>
          <th align="right" style="padding:8px">QTY</th><th align="right" style="padding:8px">UNIT PRICE</th><th align="right" style="padding:8px">AMOUNT</th>
        </tr>
        ${rows}
      </table>
    </td></tr>
    <tr><td style="padding:8px 32px 24px">
      <table role="presentation" align="right" cellpadding="0" cellspacing="0" style="width:260px;font-size:14px">
        ${summary.map(([k, v]) => `<tr><td style="color:${MUTED};padding:4px 8px">${escape(k)}</td><td align="right" style="padding:4px 8px">${v}</td></tr>`).join("")}
        <tr><td style="background:#eef4f2;color:${TEAL};font-weight:700;padding:12px 8px;border-radius:8px 0 0 8px">TOTAL DUE</td>
            <td align="right" style="background:#eef4f2;color:${TEAL};font-weight:700;font-size:20px;padding:12px 8px;border-radius:0 8px 8px 0">${formatUSD(totals.totalCents)}</td></tr>
      </table>
    </td></tr>
    ${invoice.notes.trim() ? `<tr><td style="padding:0 32px 24px;font-size:13px;color:${MUTED};line-height:1.6"><strong style="color:${TEAL}">Notes</strong><br>${multiline(invoice.notes)}</td></tr>` : ""}
    <tr><td style="padding:0 32px 32px"><a href="${escape(options.viewUrl)}" style="display:inline-block;background:${TEAL};color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;font-size:14px">View invoice online</a></td></tr>
  </table>
  </td></tr></table></body></html>`;

  const text = [
    options.message.trim(),
    `Invoice ${invoice.number} from ${invoice.businessName}`,
    ...meta.map(([k, v]) => `${k}: ${v}`),
    `Bill to: ${invoice.customerName}`,
    "",
    ...invoice.lineItems.map(
      (l, i) => `${i + 1}. ${l.description} — ${formatDecimal(l.quantityHundredths, 2)} × ${formatUSD(l.unitPriceCents)} = ${formatUSD(totals.lineTotalsCents[i])}`,
    ),
    "",
    ...summary.map(([k, v]) => `${k}: ${v}`),
    `Total due: ${formatUSD(totals.totalCents)}`,
    invoice.notes.trim() ? `\nNotes: ${invoice.notes}` : "",
    `\nView online: ${options.viewUrl}`,
  ]
    .filter((line, i) => i !== 0 || line)
    .join("\n");

  return { html, text };
}
