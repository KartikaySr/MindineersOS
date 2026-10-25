import type { ReactNode } from "react";
// A deliberately small renderer: source is never inserted as HTML.
function inline(text: string): ReactNode[] {
  return text
    .split(/(\*\*[^*\n]+\*\*|`[^`\n]+`|\[[^\]\n]+\]\([^\s)]+\))/g)
    .map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      if (part.startsWith("`") && part.endsWith("`"))
        return <code key={i}>{part.slice(1, -1)}</code>;
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
      if (link) {
        try {
          const url = new URL(link[2] ?? "");
          if (
            ["https:", "http:"].includes(url.protocol) &&
            !url.username &&
            !url.password
          )
            return (
              <a
                key={i}
                href={url.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link[1]}
              </a>
            );
        } catch {
          /* Unsafe or relative links stay literal text. */
        }
      }
      return part;
    });
}
export default function MarkdownPreview({ body }: { body: string }) {
  const lines = body.split("\n"),
    blocks: ReactNode[] = [];
  let code: string[] | null = null;
  for (const [i, line] of lines.entries()) {
    if (line.startsWith("```")) {
      if (code) {
        blocks.push(
          <pre key={i}>
            <code>{code.join("\n")}</code>
          </pre>,
        );
        code = null;
      } else code = [];
      continue;
    }
    if (code) {
      code.push(line);
      continue;
    }
    const content = inline(line.replace(/^(#{1,3} |[-*] |> )/, ""));
    blocks.push(
      line.startsWith("# ") ? (
        <h1 key={i}>{content}</h1>
      ) : line.startsWith("## ") ? (
        <h2 key={i}>{content}</h2>
      ) : line.startsWith("### ") ? (
        <h3 key={i}>{content}</h3>
      ) : line.startsWith("> ") ? (
        <blockquote key={i}>{content}</blockquote>
      ) : /^[-*] /.test(line) ? (
        <ul key={i}>
          <li>{content}</li>
        </ul>
      ) : (
        <p key={i}>{line ? content : "\u00a0"}</p>
      ),
    );
  }
  if (code)
    blocks.push(
      <pre key="unfinished-code">
        <code>{code.join("\n")}</code>
      </pre>,
    );
  return <article className="document-paper">{blocks}</article>;
}
