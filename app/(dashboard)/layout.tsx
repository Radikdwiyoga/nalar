import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Pengguna';
  const userEmail = user?.email || '';

  return (
    <DashboardShell displayName={displayName} userEmail={userEmail}>
      {children}
    </DashboardShell>
  );
}
