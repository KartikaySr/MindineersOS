type ParseOptions = {
  decode?: (value: string) => string;
};

type SerializeOptions = {
  encode?: (value: string) => string;
  maxAge?: number;
  domain?: string;
  path?: string;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
  partitioned?: boolean;
  priority?: "low" | "medium" | "high" | "Low" | "Medium" | "High";
  sameSite?: boolean | "lax" | "strict" | "none" | "Lax" | "Strict" | "None";
};

function tryDecode(value: string, decode: (value: string) => string): string {
  try {
    return decode(value);
  } catch {
    return value;
  }
}

export function parse(str: string, options: ParseOptions = {}): Record<string, string> {
  const result: Record<string, string> = Object.create(null);
  const decode = options.decode ?? decodeURIComponent;

  for (const pair of str.split(";")) {
    const index = pair.indexOf("=");
    if (index < 0) continue;

    const key = pair.slice(0, index).trim();
    if (!key || result[key] !== undefined) continue;

    const rawValue = pair.slice(index + 1).trim();
    const value =
      rawValue.startsWith('"') && rawValue.endsWith('"')
        ? rawValue.slice(1, -1)
        : rawValue;
    result[key] = tryDecode(value, decode);
  }

  return result;
}

export function serialize(
  name: string,
  value: string,
  options: SerializeOptions = {},
): string {
  const encode = options.encode ?? encodeURIComponent;
  const segments = [`${name}=${encode(value)}`];

  if (typeof options.maxAge === "number") segments.push(`Max-Age=${Math.floor(options.maxAge)}`);
  if (options.domain) segments.push(`Domain=${options.domain}`);
  if (options.path) segments.push(`Path=${options.path}`);
  if (options.expires) segments.push(`Expires=${options.expires.toUTCString()}`);
  if (options.httpOnly) segments.push("HttpOnly");
  if (options.secure) segments.push("Secure");
  if (options.partitioned) segments.push("Partitioned");
  if (options.priority) segments.push(`Priority=${options.priority}`);
  if (options.sameSite) {
    const sameSite = options.sameSite === true ? "Strict" : options.sameSite;
    segments.push(`SameSite=${sameSite}`);
  }

  return segments.join("; ");
}

export const parseCookie = parse;
export const stringifyCookie = (cookie: Record<string, string>, options?: SerializeOptions) =>
  Object.entries(cookie)
    .map(([name, value]) => serialize(name, value, options))
    .join("; ");
export const stringifySetCookie = serialize;
export const parseSetCookie = parse;

