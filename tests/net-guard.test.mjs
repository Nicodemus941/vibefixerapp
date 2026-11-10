import { test } from "node:test";
import assert from "node:assert/strict";
import { checkFetchableUrl, isPrivateAddress } from "../src/lib/net-guard.ts";
import { parseOpenGraph } from "../src/lib/og-parse.ts";

test("private and special IPv4 ranges are blocked", () => {
  for (const ip of [
    "127.0.0.1",
    "10.1.2.3",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "0.0.0.0",
    "224.0.0.1",
    "255.255.255.255",
  ]) {
    assert.equal(isPrivateAddress(ip), true, ip);
  }
});

test("public IPv4 is allowed", () => {
  for (const ip of ["8.8.8.8", "1.1.1.1", "172.32.0.1", "93.184.216.34"]) {
    assert.equal(isPrivateAddress(ip), false, ip);
  }
});

test("IPv6 loopback, link local, ULA and mapped private are blocked", () => {
  for (const ip of ["::1", "::", "fe80::1", "fc00::1", "fd12:3456::1", "::ffff:127.0.0.1", "::ffff:7f00:1", "64:ff9b::a00:1", "2002:c0a8:101::1"]) {
    assert.equal(isPrivateAddress(ip), true, ip);
  }
  assert.equal(isPrivateAddress("2606:4700:4700::1111"), false);
});

test("garbage fails closed", () => {
  assert.equal(isPrivateAddress("not-an-ip"), true);
});

test("checkFetchableUrl shape rules", () => {
  assert.equal(checkFetchableUrl("https://example.com/a").ok, true);
  assert.equal(checkFetchableUrl("ftp://example.com").ok, false);
  assert.equal(checkFetchableUrl("file:///etc/passwd").ok, false);
  assert.equal(checkFetchableUrl("http://localhost:3000").ok, false);
  assert.equal(checkFetchableUrl("http://127.0.0.1/").ok, false);
  assert.equal(checkFetchableUrl("http://[::1]/").ok, false);
  assert.equal(checkFetchableUrl("http://2130706433/").ok, false); // 127.0.0.1 as a number
  assert.equal(checkFetchableUrl("http://user:pw@example.com").ok, false);
  assert.equal(checkFetchableUrl("http://example.com:8080").ok, false);
  assert.equal(checkFetchableUrl("http://intranet/").ok, false);
  assert.equal(checkFetchableUrl("http://metadata.google.internal/").ok, false);
});

test("parseOpenGraph prefers og tags, decodes entities, keeps https images only", () => {
  const html = `<html><head>
    <title>Fallback</title>
    <meta property="og:title" content="Ship it &amp; learn">
    <meta name="description" content="Plain description">
    <meta property="og:image" content="/img/card.png">
    <meta property="og:site_name" content="Example">
  </head></html>`;
  const p = parseOpenGraph(html, "https://example.com/post");
  assert.equal(p.title, "Ship it & learn");
  assert.equal(p.description, "Plain description");
  assert.equal(p.image, "https://example.com/img/card.png");
  assert.equal(p.site_name, "Example");

  const insecure = parseOpenGraph(`<meta property="og:image" content="http://x.com/a.png"><title>T</title>`, "http://x.com");
  assert.equal(insecure.image, null);
  assert.equal(insecure.title, "T");
  assert.equal(insecure.site_name, "x.com");
});
