import { redirect } from 'next/navigation';

// Clerk redirects here when a pending task (e.g. choose-organization) exists after sign-in.
// Redirect to /login so the mounted SignIn component handles the task via path routing.
export default function LoginTasksPage() {
  redirect('/login');
}
