// Structured "Product Details:" block inside a product description.
//
// Descriptions are stored as plain text:
//
//   <intro paragraph(s)>
//
//   Product Details:
//   Fabric: Glass Organza Silk
//   Work: Handcrafted zardozi work
//   Blouse: Modal satin, unstitched
//   Saree Length: 5.75 m
//   Blouse Length: 1 m
//
// The admin editor edits these lines as separate fields, and the product page
// shows them as a details list. Older imported descriptions use the same
// heading (with literal "\n" sequences and tabs), so they parse too.

export const DETAIL_FIELDS = [
  { key: "fabricDetail", label: "Fabric", placeholder: "e.g. Glass Organza Silk" },
  { key: "work", label: "Work", placeholder: "e.g. Handcrafted zardozi work" },
  { key: "colour", label: "Colour", placeholder: "e.g. Ivory with gold" },
  { key: "blouse", label: "Blouse", placeholder: "e.g. Modal satin, unstitched" },
  { key: "sareeLength", label: "Saree Length", placeholder: "e.g. 5.75 m" },
  { key: "blouseLength", label: "Blouse Length", placeholder: "e.g. 1 m" },
];

// Labels used by older descriptions, mapped to the fields above.
const LABEL_ALIASES = {
  fabric: "fabricDetail",
  work: "work",
  embellishment: "work",
  embellishments: "work",
  craft: "work",
  colour: "colour",
  color: "colour",
  blouse: "blouse",
  "blouse fabric": "blouse",
  "blouse piece": "blouse",
  length: "sareeLength",
  "saree length": "sareeLength",
  "blouse length": "blouseLength",
};

const HEADING = /^\s*product details\s*:?\s*$/i;

export const emptyDetails = () =>
  Object.fromEntries(DETAIL_FIELDS.map((f) => [f.key, ""]));

/** Turns stored text (which may contain literal "\n" sequences) into real lines. */
export const normalizeDescription = (raw = "") =>
  String(raw)
    .replace(/\r?\\n/g, "\n")
    .replace(/\r\n?/g, "\n")
    .replace(/\t/g, " ");

/**
 * Splits a description into { intro, details, extra }.
 * Returns null for HTML descriptions, which are left for raw editing.
 */
export function parseDescription(raw = "") {
  const text = normalizeDescription(raw);
  if (/<\/?[a-z][^>]*>/i.test(text)) return null;

  const lines = text.split("\n");
  const headingIdx = lines.findIndex((l) => HEADING.test(l));
  const details = emptyDetails();
  const extra = [];

  if (headingIdx === -1) {
    return { intro: text.trim(), details, extra };
  }

  const intro = lines.slice(0, headingIdx).join("\n").trim();
  for (const line of lines.slice(headingIdx + 1)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const m = trimmed.match(/^([^:]{2,30}):\s*(.+)$/);
    const key = m && LABEL_ALIASES[m[1].trim().toLowerCase()];
    if (key && !details[key]) details[key] = m[2].trim();
    else extra.push(trimmed);
  }
  return { intro, details, extra };
}

/** Builds the stored description from the editor fields. */
export function composeDescription(intro = "", details = {}, extra = []) {
  const lines = DETAIL_FIELDS.filter((f) => (details[f.key] || "").trim()).map(
    (f) => `${f.label}: ${details[f.key].trim()}`
  );
  const extraLines = (Array.isArray(extra) ? extra : String(extra).split("\n"))
    .map((l) => l.trim())
    .filter(Boolean);
  const block = [...lines, ...extraLines];
  const head = intro.trim();
  if (block.length === 0) return head;
  return `${head}${head ? "\n\n" : ""}Product Details:\n${block.join("\n")}`;
}

/** [label, value] rows for the product page, or [] if none are present. */
export function getDetailRows(raw = "") {
  const parsed = parseDescription(raw);
  if (!parsed) return [];
  return DETAIL_FIELDS.filter((f) => parsed.details[f.key]).map((f) => [f.label, parsed.details[f.key]]);
}
