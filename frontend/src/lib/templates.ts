// Invoice layouts. The backend accepts the same ids (BusinessSettings::TEMPLATES).
export const TEMPLATE_IDS = ["classic", "modern", "minimal"] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const TEMPLATES: { id: TemplateId; name: string; description: string }[] = [
  { id: "classic", name: "Classic", description: "Serif headings, a teal accent rule and a highlighted amount-due card." },
  { id: "modern", name: "Modern", description: "A full-width coloured header band with bold typography." },
  { id: "minimal", name: "Minimal", description: "Monochrome, lots of white space and thin rules. Quiet and formal." },
];

export const isTemplateId = (value: unknown): value is TemplateId => TEMPLATE_IDS.includes(value as TemplateId);
