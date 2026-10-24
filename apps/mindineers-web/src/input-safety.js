// Imported workspaces are untrusted structured data. Reject unsafe object keys
// before any domain editor reads, spreads, or merges them into application state.
export function validateDataTree(root) {
  let count = 0;
  const visit = (value, depth) => {
    if (++count > 250000 || depth > 64)
      throw new Error("Workspace exceeds supported complexity.");
    if (value === null || typeof value !== "object") return;
    for (const key of Object.keys(value)) {
      if (["__proto__", "prototype", "constructor"].includes(key))
        throw new Error("Workspace contains an unsafe object key.");
      visit(value[key], depth + 1);
    }
  };
  visit(root, 0);
  return root;
}
