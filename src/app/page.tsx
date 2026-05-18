export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground font-[family-name:var(--font-geist-sans)]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.18),transparent_60%)]" />
        <div className="mx-auto max-w-5xl px-6 pt-24 pb-20 sm:pt-32 sm:pb-28 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-black/10 dark:border-white/15 bg-black/[.03] dark:bg-white/[.06] px-3 py-1 text-xs font-medium tracking-wide uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Now matching founders
          </span>
          <h1 className="mt-6 text-5xl sm:text-7xl font-semibold tracking-tight leading-[1.05]">
            Stop networking.
            <br />
            <span className="bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500 bg-clip-text text-transparent">
              Start building.
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-foreground/70 max-w-2xl mx-auto">
            AI matches your needs to another founder&rsquo;s services in under 24 hours.
            The first platform where every founder must give <span className="font-semibold text-foreground">AND</span> receive.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#get-started"
              className="rounded-full bg-foreground text-background px-6 py-3 text-base font-medium hover:opacity-90 transition"
            >
              Get matched in 7 days
            </a>
            <a
              href="#how-it-works"
              className="rounded-full border border-black/10 dark:border-white/15 px-6 py-3 text-base font-medium hover:bg-black/[.04] dark:hover:bg-white/[.06] transition"
            >
              See how it works
            </a>
          </div>
          <p className="mt-5 text-sm text-foreground/60">
            No cold DMs. No coffee chats. Just qualified intros.
          </p>
        </div>
      </section>

      <section className="border-y border-black/5 dark:border-white/10 bg-black/[.02] dark:bg-white/[.03]">
        <div className="mx-auto max-w-5xl px-6 py-14 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <Stat value="< 24 hrs" label="From signup to first match" />
          <Stat value="3 founders" label="Qualified intros in 7 days" />
          <Stat value="100%" label="Refund + 1 year free if we miss" />
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-5xl px-6 py-24">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            How matching works
          </h2>
          <p className="mt-4 text-foreground/70">
            Tell us what you need and what you can offer. Our AI handles the rest.
          </p>
        </div>
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Step
            num="01"
            title="Share what you need"
            body="A landing page, a fractional CFO, customer interviews — name your ask."
          />
          <Step
            num="02"
            title="Share what you offer"
            body="Every founder gives back. Skills, intros, feedback, a service of yours."
          />
          <Step
            num="03"
            title="Get matched"
            body="In under 24 hours, AI pairs you with founders whose needs and offers align."
          />
        </div>
      </section>

      <section className="relative">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="rounded-3xl border border-black/10 dark:border-white/15 bg-gradient-to-br from-indigo-500/10 via-fuchsia-500/10 to-rose-500/10 p-10 sm:p-14 text-center">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Our 7-day guarantee
            </h2>
            <p className="mt-5 text-lg text-foreground/80 max-w-2xl mx-auto">
              Get matched with <span className="font-semibold">3 qualified founders in 7 days</span>,
              or we refund every cent <span className="font-semibold">+ give you a full year free.</span>
            </p>
            <a
              id="get-started"
              href="#get-started"
              className="mt-8 inline-block rounded-full bg-foreground text-background px-6 py-3 text-base font-medium hover:opacity-90 transition"
            >
              Join the platform
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-28">
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-center">
          Frequently asked
        </h2>
        <div className="mt-10 divide-y divide-black/10 dark:divide-white/10 border-y border-black/10 dark:border-white/10">
          <Faq
            q="What if I only want to hire, not offer?"
            a="You don't need this platform. We're built on a simple rule: every founder must give AND receive. If you only want to buy services, hire a freelancer instead."
          />
          <Faq
            q="How does the AI matching work?"
            a="You describe your need and your offer in plain language. Our AI analyzes both sides of the marketplace and surfaces founders whose asks and offers complement yours."
          />
          <Faq
            q="What counts as something to offer?"
            a="Anything another founder would value: design, code, intros, fundraising advice, customer research, copywriting, a slot in your product, even honest feedback."
          />
          <Faq
            q="What's the refund policy?"
            a="If you don't get 3 qualified founder matches within 7 days, we refund every cent and give you a full year of the platform free."
          />
        </div>
      </section>

      <footer className="border-t border-black/10 dark:border-white/10">
        <div className="mx-auto max-w-5xl px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-foreground/60">
          <span>&copy; {new Date().getFullYear()} Code Vibe Fixer</span>
          <span>Built for founders who&rsquo;d rather ship than schmooze.</span>
        </div>
      </footer>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-3xl sm:text-4xl font-semibold tracking-tight">{value}</div>
      <div className="mt-2 text-sm text-foreground/70">{label}</div>
    </div>
  );
}

function Step({ num, title, body }: { num: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/15 p-6 hover:border-black/20 dark:hover:border-white/25 transition">
      <div className="text-xs font-mono text-foreground/50">{num}</div>
      <div className="mt-3 text-lg font-semibold">{title}</div>
      <p className="mt-2 text-sm text-foreground/70 leading-relaxed">{body}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group py-5">
      <summary className="flex cursor-pointer items-center justify-between list-none">
        <span className="text-base sm:text-lg font-medium">{q}</span>
        <span className="ml-4 text-foreground/50 transition group-open:rotate-45">+</span>
      </summary>
      <p className="mt-3 text-foreground/70 leading-relaxed">{a}</p>
    </details>
  );
}
