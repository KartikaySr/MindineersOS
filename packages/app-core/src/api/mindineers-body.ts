import type http from "node:http";
import { WORKSPACE_BODY_LIMIT } from "../services/mindineers-workspace-input";
import { sendJson } from "./response";

/** The host may already have parsed a plugin request. Both paths enforce the same bound. */
export async function readWorkspaceBody(
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<Record<string, unknown> | null> {
  if (
    !/^application\/json(?:\s*;|$)/i.test(
      String(req.headers["content-type"] ?? ""),
    )
  ) {
    sendJson(res, 415, { error: "json_required" });
    return null;
  }
  try {
    let value = (req as http.IncomingMessage & { body?: unknown }).body;
    if (value === undefined) {
      const chunks: Buffer[] = [];
      let bytes = 0;
      for await (const chunk of req) {
        const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        bytes += part.length;
        if (bytes > WORKSPACE_BODY_LIMIT) {
          sendJson(res, 413, { error: "checkpoint_too_large" });
          return null;
        }
        chunks.push(part);
      }
      value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } else if (
      Buffer.byteLength(JSON.stringify(value)) > WORKSPACE_BODY_LIMIT
    ) {
      sendJson(res, 413, { error: "checkpoint_too_large" });
      return null;
    }
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw Error();
    return value as Record<string, unknown>;
  } catch {
    sendJson(res, 400, { error: "invalid_json" });
    return null;
  }
}
