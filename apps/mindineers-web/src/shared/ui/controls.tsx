import { useEffect, useRef } from "react";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";
import type {
  ProductCollections,
  Workspace,
  WorkspaceUpdate,
} from "../contracts/workspace";
export function Button({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className="button" {...props}>
      {children}
    </button>
  );
}
type FieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value" | "type" | "size"
> & {
  label: ReactNode;
  value?: string | number | null;
  onChange: (value: string) => void;
  type?: string;
  options?: readonly string[];
};
export function Field({
  label,
  value,
  onChange,
  type = "text",
  options,
  ...rest
}: FieldProps) {
  const {
    name,
    id,
    disabled,
    required,
    autoFocus,
    placeholder,
    maxLength,
    minLength,
    autoComplete,
  } = rest;
  const shared = {
    name,
    id,
    disabled,
    required,
    autoFocus,
    ...Object.fromEntries(
      Object.entries(rest).filter(
        ([key]) => key.startsWith("aria-") || key.startsWith("data-"),
      ),
    ),
  };
  return (
    <label className="product-field">
      <span>{label}</span>
      {options ? (
        <select
          {...shared}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          {...shared}
          {...(placeholder === undefined ? {} : { placeholder })}
          {...(maxLength === undefined ? {} : { maxLength })}
          {...(minLength === undefined ? {} : { minLength })}
          {...(autoComplete === undefined ? {} : { autoComplete })}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
        />
      ) : (
        <input
          {...rest}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          type={type}
        />
      )}
    </label>
  );
}
export function Dialog({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const before = document.activeElement;
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
      if (before instanceof HTMLElement && before.isConnected) before.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="dialog product-dialog"
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <header className="dialog-heading">
        <h2>{title}</h2>
        <button
          type="button"
          className="icon-button"
          aria-label="Close"
          onClick={close}
        >
          ×
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function Tabs({
  values,
  value,
  onChange,
}: {
  values: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      className="tabs product-tabs"
      role="group"
      aria-label="Workspace views"
    >
      {values.map((v) => (
        <button
          type="button"
          key={v}
          aria-pressed={value === v}
          className={value === v ? "active" : ""}
          onClick={() => onChange(v)}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="chat-mark" aria-hidden="true">
        ✳
      </span>
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}
export function useCollection<K extends keyof ProductCollections>(
  data: Workspace,
  update: WorkspaceUpdate,
  key: K,
): [
  ProductCollections[K],
  (
    change:
      | ProductCollections[K]
      | ((rows: ProductCollections[K]) => ProductCollections[K]),
  ) => void,
] {
  const rows = (data.product?.[key] ?? []) as ProductCollections[K];
  const set = (
    change:
      | ProductCollections[K]
      | ((rows: ProductCollections[K]) => ProductCollections[K]),
  ) =>
    update((current) => ({
      ...current,
      product: {
        ...current.product,
        [key]:
          typeof change === "function"
            ? change((current.product?.[key] ?? []) as ProductCollections[K])
            : change,
      },
    }));
  return [rows, set];
}
