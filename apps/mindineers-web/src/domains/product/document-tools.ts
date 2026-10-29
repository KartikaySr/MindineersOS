import { cellValue } from "../../product-model";
export const documentTemplates = [
  {
    name: "Project brief",
    body: "# Project brief\n\n## Problem\nDescribe the problem and who experiences it.\n\n## Outcome\nDefine measurable success.\n\n## Scope\nList deliverables and exclusions.\n\n## Acceptance criteria\n- Add a verifiable criterion.\n\n## Risks and dependencies\n\n## Decisions and sources\n",
  },
  {
    name: "Research report",
    body: "# Research report\n\n## Question\n\n## Method and limitations\n\n## Findings\nSeparate observations from interpretations.\n\n## Evidence and citations\nRecord source URLs, dates and supporting excerpts.\n\n## Conflicting evidence\n\n## Uncertainty\n\n## Recommended next steps\n",
  },
  {
    name: "Meeting notes",
    body: "# Meeting notes\n\n## Date and participants\n\n## Agenda\n\n## Discussion\n\n## Decisions\n\n## Follow-up actions\n- Owner / action / deadline\n\n## Open questions\n",
  },
] as const;
export function documentOutline(body: string) {
  let offset = 0;
  let fence: string | null = null;
  const headings: { title: string; level: number; offset: number }[] = [];
  for (const line of body.split("\n")) {
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (marker) {
      const token = marker[1]!;
      if (!fence) fence = token;
      else if (token[0] === fence[0] && token.length >= fence.length)
        fence = null;
    } else if (!fence) {
      const match = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
      if (match)
        headings.push({ title: match[2]!, level: match[1]!.length, offset });
    }
    offset += line.length + 1;
  }
  return headings;
}
export function sheetSeries(
  rows: string[][],
  labelColumn: number,
  valueColumn: number,
  header: boolean,
) {
  const points: { label: string; value: number; row: number }[] = [];
  let omitted = 0;
  rows.forEach((row, index) => {
    if (header && index === 0) return;
    if (!row.some((cell) => cell.trim())) return;
    try {
      const raw = cellValue(
        rows,
        `${String.fromCharCode(65 + valueColumn)}${index + 1}`,
      ).trim();
      const value = Number(raw);
      if (!raw || !Number.isFinite(value)) {
        omitted++;
        return;
      }
      points.push({
        label: row[labelColumn] || `Row ${index + 1}`,
        value,
        row: index + 1,
      });
    } catch {
      omitted++;
    }
  });
  return { points, omitted };
}
