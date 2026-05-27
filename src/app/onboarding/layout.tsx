export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-2xl mx-auto px-6 py-12 sm:py-16">{children}</div>
    </div>
  );
}
