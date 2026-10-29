import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { validHttpUrl } from "../../workbench-model";
import { Button } from "../../ProductUI";
export default function RichTextEditor({
  body,
  save,
}: {
  body: string;
  save: (body: string, checkpoint: boolean) => void;
}) {
  const last = useRef(body),
    saveRef = useRef(save);
  saveRef.current = save;
  const checkpointNeeded = useRef(true);
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [, refresh] = useState(0);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        underline: false,
        link: {
          openOnClick: false,
          autolink: false,
          linkOnPaste: false,
          isAllowedUri: (uri) => validHttpUrl(uri),
        },
      }),
      Markdown,
    ],
    content: body,
    contentType: "markdown",
    immediatelyRender: false,
    injectCSS: false,
    editorProps: {
      attributes: {
        class: "rich-document",
        role: "textbox",
        "aria-label": "Rich document content",
        "aria-multiline": "true",
      },
      // Paste plain text only: foreign HTML and embedded active content never enter the document.
      handlePaste(view, event) {
        const text = event.clipboardData?.getData("text/plain");
        if (text === undefined) return false;
        event.preventDefault();
        if (text.length + view.state.doc.textContent.length > 150000) {
          setMessage(
            "Keep rich documents under 150,000 characters. Use source mode for larger documents.",
          );
          return true;
        }
        view.dispatch(view.state.tr.insertText(text));
        return true;
      },
      handleDrop(_view, event) {
        event.preventDefault();
        return true;
      },
    },
    onUpdate({ editor }) {
      const next = editor.getMarkdown();
      if (next.length > 200000) {
        setMessage(
          "Document exceeds the storage limit. Undo or shorten the content before saving.",
        );
        return;
      }
      last.current = next;
      saveRef.current(next, checkpointNeeded.current);
      checkpointNeeded.current = false;
      setMessage("");
    },
    onTransaction() {
      refresh((n) => n + 1);
    },
  });
  useEffect(() => {
    if (editor && body !== last.current) {
      editor.commands.setContent(body, {
        contentType: "markdown",
        emitUpdate: false,
      });
      last.current = body;
      checkpointNeeded.current = true;
    }
  }, [body, editor]);
  if (!editor) return <p role="status">Opening rich text editor…</p>;
  return (
    <section aria-label="Rich text authoring">
      <p>
        Format visually. Content is saved as Markdown; use Write for exact
        source editing and selection-based suggestions. Pasted content is plain
        text. A version of the original source is saved before your first edit;
        unsupported Markdown formatting may be normalized.
      </p>
      <div className="document-tools" role="group" aria-label="Text formatting">
        <Button
          aria-pressed={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          Bold
        </Button>
        <Button
          aria-pressed={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          Italic
        </Button>
        <Button
          aria-pressed={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          Strikethrough
        </Button>
        <Button
          aria-pressed={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          Heading
        </Button>
        <Button
          aria-pressed={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          Bullet list
        </Button>
        <Button
          aria-pressed={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          Numbered list
        </Button>
        <Button
          aria-pressed={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          Quote
        </Button>
        <Button
          aria-pressed={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          Code block
        </Button>
        <Button
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          Undo text edit
        </Button>
        <Button
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          Redo text edit
        </Button>
      </div>
      <div className="wb-actions">
        <label>
          Link URL
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://…"
          />
        </label>
        <Button
          disabled={!validHttpUrl(link)}
          onClick={() =>
            editor
              .chain()
              .focus()
              .extendMarkRange("link")
              .setLink({ href: link })
              .run()
          }
        >
          Link selected text
        </Button>
        <Button onClick={() => editor.chain().focus().unsetLink().run()}>
          Remove link
        </Button>
      </div>
      <EditorContent editor={editor} />
      {message && <p role="alert">{message}</p>}
    </section>
  );
}
