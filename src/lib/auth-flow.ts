// Pure helpers for sign in, sign up, verification and password reset.
// No imports so node tests and client components can both use them.

export const MIN_PASSWORD_LENGTH = 10;

/** Same site paths only: "//evil.com" or "/\\evil.com" would leave the site. */
export function safeNext(raw: string | null | undefined, fallback = "/feed"): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}

const OTP_TYPES = ["signup", "invite", "magiclink", "recovery", "email_change", "email"] as const;
export type OtpType = (typeof OTP_TYPES)[number];

export function parseOtpType(raw: string | null | undefined): OtpType | null {
  return raw && (OTP_TYPES as readonly string[]).includes(raw) ? (raw as OtpType) : null;
}

/**
 * Where /auth/callback sends someone after the link checks out. A
 * recovery link always lands on /reset-password, whatever next says,
 * so a reset can never be skipped by editing the URL.
 */
export function resolveAuthRedirect(input: { type?: string | null; next?: string | null }): string {
  if (input.type === "recovery") return "/reset-password";
  return safeNext(input.next);
}

export type AuthErrorLike = { message?: string; code?: string; status?: number } | null | undefined;

export type FriendlyAuthError = {
  message: string;
  /** Show the "Resend verification email" button. */
  needsVerification?: boolean;
  rateLimited?: boolean;
};

export function friendlyAuthError(err: AuthErrorLike): FriendlyAuthError | null {
  if (!err) return null;
  const code = err.code ?? "";
  const msg = (err.message ?? "").toLowerCase();
  if (code === "email_not_confirmed" || msg.includes("email not confirmed")) {
    return {
      message: "Please verify your email first. Check your inbox for the link we sent.",
      needsVerification: true,
    };
  }
  if (
    err.status === 429 ||
    code.startsWith("over_") ||
    msg.includes("rate limit") ||
    msg.includes("too many") ||
    msg.includes("security purposes")
  ) {
    return {
      message: "Too many tries for now. Please wait a minute and try again.",
      rateLimited: true,
    };
  }
  if (code === "invalid_credentials" || msg.includes("invalid login credentials")) {
    return { message: "That email and password do not match. Try again or reset your password." };
  }
  if (code === "weak_password" || msg.includes("password should")) {
    return { message: `Please choose a stronger password with at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (code === "same_password") {
    return { message: "Your new password must be different from your current one." };
  }
  if (code === "reauthentication_needed" || msg.includes("reauthentication")) {
    return { message: "For your security, please sign in again and then change your password." };
  }
  if (code === "otp_expired" || msg.includes("expired")) {
    return { message: "That link has expired or was already used. Please request a new one." };
  }
  if (code === "otp_disabled" || code === "signup_disabled" || msg.includes("signups not allowed")) {
    // Magic links are sign in only; answer the same way as a real send.
    return { message: "" };
  }
  return { message: "Something went wrong. Please try again." };
}

export type PasswordCheck = {
  ok: boolean;
  score: 0 | 1 | 2 | 3 | 4;
  label: "Too short" | "Weak" | "Fair" | "Good" | "Strong";
  hint: string;
};

export function checkPassword(pw: string): PasswordCheck {
  if (pw.length < MIN_PASSWORD_LENGTH) {
    const left = MIN_PASSWORD_LENGTH - pw.length;
    return {
      ok: false,
      score: 0,
      label: "Too short",
      hint: `${left} more character${left === 1 ? "" : "s"} to go.`,
    };
  }
  let variety = 0;
  if (/[a-z]/.test(pw)) variety++;
  if (/[A-Z]/.test(pw)) variety++;
  if (/[0-9]/.test(pw)) variety++;
  if (/[^A-Za-z0-9]/.test(pw)) variety++;
  const repeated = /^(.)\1+$/.test(pw) || /^(?:0123456789|1234567890|password|qwerty)/i.test(pw);
  let score = (variety >= 3 ? 2 : variety === 2 ? 1 : 0) + (pw.length >= 14 ? 2 : pw.length >= 12 ? 1 : 0);
  if (repeated) score = 0;
  const s = Math.max(1, Math.min(4, score)) as 1 | 2 | 3 | 4;
  const labels = { 1: "Weak", 2: "Fair", 3: "Good", 4: "Strong" } as const;
  const hints = {
    1: "Mix in capitals, numbers or symbols, or make it longer.",
    2: "Getting there. A few more characters makes it much stronger.",
    3: "Good password.",
    4: "Strong password.",
  } as const;
  return { ok: true, score: s, label: labels[s], hint: hints[s] };
}
