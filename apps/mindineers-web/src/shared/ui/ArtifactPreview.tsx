import MarkdownPreview from "../../domains/product/MarkdownPreview";
import { parseCSV } from "../../customer-import";
import { useEffect, useState } from "react";
import { getFile } from "../services/files";
import { useResource } from "../services/useResource";
import { LoadingState, ErrorState } from "./AsyncState";
type Preview =
  | { kind: "image"; file: Blob }
  | { kind: "audio" | "video"; file: Blob }
  | { kind: "text"; text: string; format: string; truncated: boolean }
  | { kind: "download" };
function MediaPreview({ file, name, kind }: { file: Blob; name: string; kind: "image" | "audio" | "video" }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url ? (
    kind === "image" ? <img src={url} alt={name} /> : kind === "audio" ? <audio src={url} controls preload="metadata" aria-label={name} /> : <video src={url} controls preload="metadata" aria-label={name} />
  ) : (
    <LoadingState label="Preparing image…" />
  );
}
export default function ArtifactPreview({
  item,
}: {
  item: { id: string; name: string };
}) {
  const { state, retry } = useResource<Preview>(item.id, async (signal) => {
    const file = await getFile(item.id);
    if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
    if (
      [
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/gif",
        "image/avif",
      ].includes(file.type)
    )
      return { kind: "image", file };
    if (file.size <= 50 * 1024 * 1024 && ["audio/mpeg", "audio/ogg", "audio/wav", "audio/mp4", "video/mp4", "video/webm", "video/ogg"].includes(file.type))
      return {kind: file.type.startsWith("audio/") ? "audio" : "video", file};
    if (
      (/^text\/(plain|markdown|csv)$/.test(file.type) ||
        file.type === "application/json") &&
      file.size < 1024 * 1024
    )
      {const content = await file.text(); return { kind: "text", text: content.slice(0, 100000), format: file.type, truncated: content.length > 100000 };}
    return { kind: "download" };
  });
  return (
    <div className="artifact-preview">
      {state.status === "loading" ? (
        <LoadingState label="Loading preview…" />
      ) : state.status === "error" ? (
        <ErrorState error={state.error} retry={retry}>
          <p>
            Original files are stored only on the device where they were
            uploaded. Restore the original file if it is missing.
          </p>
        </ErrorState>
      ) : ["image", "audio", "video"].includes(state.data.kind) && "file" in state.data ? (
        <MediaPreview file={state.data.file} kind={state.data.kind} name={item.name} />
      ) : state.data.kind === "text" ? (
        <TextPreview text={state.data.text} format={state.data.format} truncated={state.data.truncated} />
      ) : (
        <p>
          Download the original to view this file type. Embedded active
          documents are not executed.
        </p>
      )}
    </div>
  );
}

function TextPreview({text, format, truncated}: {text: string; format: string; truncated: boolean}) {
  let content = <pre>{text}</pre>;
  if (format === "text/markdown") content = <MarkdownPreview body={text} />;
  if (format === "application/json" && !truncated) {
    try {content = <pre>{JSON.stringify(JSON.parse(text), null, 2)}</pre>;} catch {content = <><p>Invalid JSON. Showing original text.</p><pre>{text}</pre></>;}
  }
  if (format === "text/csv" && !truncated) {
    try {
      const csv = parseCSV(text);
      content = <><p>{csv.rows.length} rows. Preview shows the first 100; cell content is never executed.</p><div className="table-wrap" tabIndex={0} role="region" aria-label="CSV preview"><table><thead><tr>{csv.headers.map(h => <th scope="col" key={h}>{h}</th>)}</tr></thead><tbody>{csv.rows.slice(0,100).map((row,i) => <tr key={i}>{row.map((cell,j) => <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div></>;
    } catch {content = <><p>Structured preview is unavailable for this CSV. Original text follows.</p><pre>{text}</pre></>;}
  }
  return <>{truncated && <p>Preview truncated at 100,000 characters. Download the original for all content.</p>}{content}</>;
}
