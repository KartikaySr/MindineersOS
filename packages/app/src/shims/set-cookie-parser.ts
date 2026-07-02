type ParseOptions = {
  decodeValues?: boolean;
  map?: boolean;
  silent?: boolean;
};

type ParsedSetCookie = Record<string, unknown> & {
  name: string;
  value: string;
};

const defaultParseOptions = {
  decodeValues: true,
  map: false,
  silent: false,
};

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseNameValuePair(value: string): { name: string; value: string } {
  const parts = value.split("=");
  const name = parts.length > 1 ? (parts.shift() ?? "") : "";
  return { name, value: parts.join("=") || value };
}

export function parseString(
  setCookieValue: string,
  options?: ParseOptions,
): ParsedSetCookie | null {
  const opts = { ...defaultParseOptions, ...options };
  const parts = setCookieValue.split(";").filter(hasText);
  const nameValue = parts.shift();
  if (!nameValue) return null;

  const parsed = parseNameValuePair(nameValue);
  const cookie: ParsedSetCookie = {
    name: parsed.name,
    value: parsed.value,
  };

  if (opts.decodeValues) {
    try {
      cookie.value = decodeURIComponent(cookie.value);
    } catch {
      if (!opts.silent) {
        console.warn("set-cookie-parser: failed to decode cookie value.");
      }
    }
  }

  for (const part of parts) {
    const sides = part.split("=");
    const key = (sides.shift() ?? "").trimStart().toLowerCase();
    const value = sides.join("=");

    if (key === "expires") cookie.expires = new Date(value);
    else if (key === "max-age") {
      const maxAge = Number.parseInt(value, 10);
      if (!Number.isNaN(maxAge)) cookie.maxAge = maxAge;
    } else if (key === "secure") cookie.secure = true;
    else if (key === "httponly") cookie.httpOnly = true;
    else if (key === "samesite") cookie.sameSite = value;
    else if (key === "partitioned") cookie.partitioned = true;
    else if (key) cookie[key] = value;
  }

  return cookie;
}

export function splitCookiesString(cookiesString: unknown): string[] {
  if (Array.isArray(cookiesString)) return cookiesString;
  if (typeof cookiesString !== "string") return [];

  const cookies: string[] = [];
  let pos = 0;
  let start = 0;

  const skipWhitespace = () => {
    while (pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))) pos += 1;
    return pos < cookiesString.length;
  };

  const notSpecialChar = () => {
    const char = cookiesString.charAt(pos);
    return char !== "=" && char !== ";" && char !== ",";
  };

  while (pos < cookiesString.length) {
    start = pos;
    let separatorFound = false;

    while (skipWhitespace()) {
      if (cookiesString.charAt(pos) !== ",") {
        pos += 1;
        continue;
      }

      const lastComma = pos;
      pos += 1;
      skipWhitespace();
      const nextStart = pos;

      while (pos < cookiesString.length && notSpecialChar()) pos += 1;

      if (pos < cookiesString.length && cookiesString.charAt(pos) === "=") {
        separatorFound = true;
        pos = nextStart;
        cookies.push(cookiesString.substring(start, lastComma));
        start = pos;
      } else {
        pos = lastComma + 1;
      }
    }

    if (!separatorFound || pos >= cookiesString.length) {
      cookies.push(cookiesString.substring(start));
    }
  }

  return cookies;
}

export function parse(input: unknown, options?: ParseOptions) {
  const opts = { ...defaultParseOptions, ...options };
  const values = Array.isArray(input) ? input : [input];
  const parsed = values.filter(hasText).map((value) => parseString(value, opts)).filter(Boolean);

  if (!opts.map) return parsed;

  return parsed.reduce<Record<string, ParsedSetCookie>>((byName, cookie) => {
    if (cookie) byName[cookie.name] = cookie;
    return byName;
  }, Object.create(null));
}

export default parse;

