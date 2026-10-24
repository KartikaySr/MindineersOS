export function applyProposal(doc, proposal, at = new Date().toISOString()) {
  if (proposal.state !== "Pending")
    throw new Error("This suggestion has already been reviewed.");
  if (doc.body !== proposal.baseBody)
    throw new Error(
      "The document has changed. Create a new suggestion against the current text.",
    );
  if (
    !Number.isInteger(proposal.start) ||
    !Number.isInteger(proposal.end) ||
    proposal.start < 0 ||
    proposal.end <= proposal.start ||
    proposal.end > doc.body.length
  )
    throw new Error("Invalid selection range.");
  return {
    ...doc,
    body:
      doc.body.slice(0, proposal.start) +
      proposal.replacement +
      doc.body.slice(proposal.end),
    updatedAt: at,
    versions: [
      {
        id: crypto.randomUUID(),
        at,
        body: doc.body,
        rows: structuredClone(doc.rows),
        slides: structuredClone(doc.slides),
      },
      ...doc.versions,
    ].slice(0, 50),
    proposals: (doc.proposals || []).map((p) =>
      p.id === proposal.id ? { ...p, state: "Applied" } : p,
    ),
  };
}
