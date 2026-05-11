import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Lead = {
  name?: string;
  phone?: string;
  email?: string;
  reason?: string;
  notes?: string;
};

export async function POST(req: Request) {
  let body: Lead = {};
  try {
    body = (await req.json()) as Lead;
  } catch {
    return NextResponse.json({ ok: false, error: "Bad JSON" }, { status: 400 });
  }

  const name = (body.name || "").toString().trim();
  const phone = (body.phone || "").toString().trim();
  const email = (body.email || "").toString().trim();
  const reason = (body.reason || "").toString().trim();
  const notes = (body.notes || "").toString().trim().slice(0, 2000);

  if (!name || !email || !phone) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields" },
      { status: 422 },
    );
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Invalid email" },
      { status: 422 },
    );
  }

  console.log(
    `[lead] ${new Date().toISOString()} ${name} <${email}> ${phone} reason="${reason}" notes="${notes.slice(0, 80)}"`,
  );

  return NextResponse.json({ ok: true });
}
