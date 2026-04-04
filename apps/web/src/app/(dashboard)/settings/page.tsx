'use client';

import { useUser, useOrganization } from '@clerk/nextjs';

export default function SettingsPage() {
  const { user } = useUser();
  const { organization } = useOrganization();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <section className="rounded-lg border">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold">Account</h2>
        </div>
        <div className="space-y-3 px-4 py-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Name</span>
            <span className="text-sm font-medium">{user?.fullName || '\u2014'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">{user?.primaryEmailAddress?.emailAddress || '\u2014'}</span>
          </div>
        </div>
      </section>

      {organization && (
        <section className="rounded-lg border">
          <div className="border-b px-4 py-3">
            <h2 className="font-semibold">Organization</h2>
          </div>
          <div className="space-y-3 px-4 py-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="text-sm font-medium">{organization.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">ID</span>
              <span className="text-sm font-mono text-muted-foreground">{organization.id}</span>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-lg border">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold">System</h2>
        </div>
        <div className="space-y-3 px-4 py-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Version</span>
            <span className="text-sm font-medium">0.1.0 (Phase 1 MVP)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Environment</span>
            <span className="text-sm font-medium">{process.env.NODE_ENV}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
