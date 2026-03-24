import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is not logged in, redirect to login
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#ECE5DD] dark:bg-[#0B141A]">
      {children}
    </div>
  );
}
