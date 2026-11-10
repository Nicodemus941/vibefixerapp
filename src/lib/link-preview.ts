import "server-only";
import { lookup as dnsLookup } from "node:dns";
import http from "node:http";
import https from "node:https";
import type { LookupFunction } from "node:net";
import { checkFetchableUrl, isPrivateAddress } from "./net-guard";
import { parseOpenGraph, type LinkPreview } from "./og-parse";

export type { LinkPreview } from "./og-parse";

const TOTAL_TIMEOUT_MS = 3000;
const MAX_BYTES = 512 * 1024;
const MAX_REDIRECTS = 3;

// DNS lookup that refuses private, loopback, link local and other
// non public addresses. It runs at connect time, so the address that is
// checked is the address that is dialed (no DNS rebinding window).
const guardedLookup: LookupFunction = (hostname, options, callback) => {
  dnsLookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, "", 0);
    const list = Array.isArray(addresses) ? addresses : [];
    if (list.length === 0 || list.some((a) => isPrivateAddress(a.address))) {
      const e = new Error("blocked address") as NodeJS.ErrnoException;
      e.code = "EBLOCKED";
      return callback(e, "", 0);
    }
    if (options && (options as { all?: boolean }).all) {
      return (callback as unknown as (e: null, a: typeof list) => void)(null, list);
    }
    return callback(null, list[0].address, list[0].family);
  });
};

type RawResponse = { status: number; location: string | null; contentType: string; body: string };

function requestOnce(url: URL, signal: AbortSignal): Promise<RawResponse> {
  return new Promise((resolve, reject) => {
    const mod = url.protocol === "https:" ? https : http;
    const req = mod.request(
      url,
      {
        method: "GET",
        lookup: guardedLookup,
        signal,
        headers: {
          "user-agent": "LoopLinkPreview/1.0 (+https://loopfounders.com)",
          accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
          "accept-language": "en",
        },
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const location = typeof res.headers.location === "string" ? res.headers.location : null;
        const contentType = String(res.headers["content-type"] ?? "");
        if (status >= 300 && status < 400) {
          res.resume();
          resolve({ status, location, contentType, body: "" });
          return;
        }
        if (!/text\/html|application\/xhtml\+xml/i.test(contentType)) {
          res.destroy();
          resolve({ status, location, contentType, body: "" });
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (chunk: Buffer) => {
          size += chunk.length;
          chunks.push(chunk);
          // The head is all we need. Stop reading big pages early.
          if (size >= MAX_BYTES) {
            res.destroy();
            resolve({ status, location, contentType, body: Buffer.concat(chunks).toString("utf8") });
          }
        });
        res.on("end", () =>
          resolve({ status, location, contentType, body: Buffer.concat(chunks).toString("utf8") }),
        );
        res.on("error", reject);
      },
    );
    req.on("error", reject);
    req.end();
  });
}

// Fetch Open Graph metadata for a user supplied URL. Never throws; returns
// null on any failure, block, timeout or non HTML response.
export async function fetchLinkPreview(rawUrl: string): Promise<LinkPreview | null> {
  const first = checkFetchableUrl(rawUrl);
  if (!first.ok) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TOTAL_TIMEOUT_MS);
  try {
    let url = first.url;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const res = await requestOnce(url, controller.signal);
      if (res.status >= 300 && res.status < 400 && res.location) {
        const next = checkFetchableUrl(new URL(res.location, url).toString());
        if (!next.ok) return null;
        url = next.url;
        continue;
      }
      if (res.status < 200 || res.status >= 300 || !res.body) return null;
      const preview = parseOpenGraph(res.body, url.toString());
      if (!preview.title && !preview.description) return null;
      // Keep the URL the author wrote; the card links there.
      return { ...preview, url: first.url.toString() };
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
