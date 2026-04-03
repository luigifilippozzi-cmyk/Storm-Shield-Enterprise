export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 rounded-lg border p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sign In</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your Storm Shield Enterprise account
          </p>
        </div>
        <div className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Auth integration coming soon (Auth0/Clerk)
          </p>
        </div>
      </div>
    </div>
  );
}
