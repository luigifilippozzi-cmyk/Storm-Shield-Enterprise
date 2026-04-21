export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Storm Shield Enterprise</h1>
          <p className="mt-1 text-sm text-muted-foreground">Let's get your shop set up</p>
        </div>
        {children}
      </div>
    </div>
  );
}
