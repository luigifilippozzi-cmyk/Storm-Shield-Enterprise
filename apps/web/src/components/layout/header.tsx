import { UserButton } from '@clerk/nextjs';
import { WorkspaceSwitcher } from './workspace-switcher';

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold">Storm Shield Enterprise</h2>
        <WorkspaceSwitcher />
      </div>
      <div className="flex items-center gap-4">
        <UserButton />
      </div>
    </header>
  );
}
