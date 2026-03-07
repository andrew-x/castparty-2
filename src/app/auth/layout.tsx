export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main
      data-slot="auth"
      className="flex min-h-svh flex-col items-center justify-center px-page"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 40%, var(--color-brand-subtle) 0%, transparent 70%)",
      }}
    >
      {children}
    </main>
  )
}
