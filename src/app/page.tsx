import { UrlFlow } from "@/components/landing/url-flow";

export default function HomePage() {
  return (
    <main className="relative min-h-dvh overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,hsl(var(--secondary))_0%,transparent_60%)]" />
      <header className="container flex items-center justify-between py-6">
        <div className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <div className="h-6 w-6 rounded-md bg-foreground" />
          Rebuild Engine
        </div>
        <nav className="hidden gap-6 text-sm text-muted-foreground sm:flex">
          <a href="#how" className="hover:text-foreground">How it works</a>
          <a href="#pricing" className="hover:text-foreground">Pricing</a>
        </nav>
      </header>

      <section className="container flex flex-col items-center gap-8 py-12 text-center sm:py-20">
        <span className="rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
          Preview first. Pay only when you go live.
        </span>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
          Get a free rebuild of your website.
          <br className="hidden sm:inline" /> See it live before you pay.
        </h1>
        <p className="max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
          Drop in your URL. We audit your site against our conversion rubric and rebuild it as a
          ready-to-launch preview. You only pay if you love it.
        </p>

        <UrlFlow />
      </section>

      <section id="how" className="container grid gap-6 py-16 sm:grid-cols-3">
        {[
          {
            title: "1. Drop your URL",
            body: "We scrape your live site and pull copy, brand, and structure into the rebuild engine.",
          },
          {
            title: "2. Get your audit",
            body: "A 10-category UX scorecard tuned to your industry, with the exact gaps killing conversions.",
          },
          {
            title: "3. Preview the rebuild",
            body: "See your site rebuilt, side-by-side. Claim it to go live on your own domain.",
          },
        ].map((s) => (
          <div key={s.title} className="rounded-xl border bg-card p-6">
            <p className="text-sm font-semibold">{s.title}</p>
            <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
          </div>
        ))}
      </section>

      <footer className="container flex flex-col items-center gap-2 py-12 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} ConveLabs · Rebuild Engine</p>
        <p>Free preview. No credit card required.</p>
      </footer>
    </main>
  );
}
