import { useEffect, useState } from "react";
import { getFile } from "../services/files";
import { useResource } from "../services/useResource";
import { LoadingState, ErrorState } from "./AsyncState";
type Preview =
  | { kind: "image"; file: Blob }
  | { kind: "text"; text: string }
  | { kind: "download" };
function ImagePreview({ file, name }: { file: Blob; name: string }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url ? (
    <img src={url} alt={name} />
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
    if (
      (/^text\/(plain|markdown|csv)$/.test(file.type) ||
        file.type === "application/json") &&
      file.size < 1024 * 1024
    )
      return { kind: "text", text: (await file.text()).slice(0, 30000) };
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
      ) : state.data.kind === "image" ? (
        <ImagePreview file={state.data.file} name={item.name} />
      ) : state.data.kind === "text" ? (
        <pre>{state.data.text}</pre>
      ) : (
        <p>
          Download the original to view this file type. Embedded active
          documents are not executed.
        </p>
      )}
    </div>
  );
}
