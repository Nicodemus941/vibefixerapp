import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeUrl(input: string): string {
  let v = input.trim();
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
  const u = new URL(v);
  u.hash = "";
  return u.toString().replace(/\/$/, "");
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function shortId(length = 6): string {
  const alphabet = "23456789abcdefghjkmnpqrstuvwxyz";
  let s = "";
  for (let i = 0; i < length; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}
