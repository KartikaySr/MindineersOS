import React, { useRef, useEffect } from "react";
export function Button({ children, ...props }) {
  return (
    <button type="button" className="button" {...props}>
      {children}
    </button>
  );
}
export function Field({
  label,
  value,
  onChange,
  type = "text",
  options,
  ...rest
}) {
  return (
    <label className="product-field">
      <span>{label}</span>
      {options ? (
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          {...rest}
        >
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          {...rest}
        />
      ) : (
        <input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          type={type}
          {...rest}
        />
      )}
    </label>
  );
}
export function Dialog({ title, children, close }) {
  const ref = useRef();
  useEffect(() => {
    const before = document.activeElement;
    ref.current.showModal();
    return () => before?.focus();
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
        <button className="icon-button" aria-label="Close" onClick={close}>
          ×
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function Tabs({ values, value, onChange }) {
  return (
    <div className="tabs product-tabs">
      {values.map((v) => (
        <button
          key={v}
          className={value === v ? "active" : ""}
          onClick={() => onChange(v)}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
export function Empty({ title, children }) {
  return (
    <div className="empty">
      <span className="chat-mark">✳</span>
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}
export function useCollection(data, update, key) {
  const rows = data.product?.[key] || [];
  const set = (fn) =>
    update((d) => ({
      ...d,
      product: {
        ...d.product,
        [key]: typeof fn === "function" ? fn(d.product?.[key] || []) : fn,
      },
    }));
  return [rows, set];
}
