import { AgencyShell } from '@/components/agency/AgencyShell';

export default function AgencySandboxLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AgencyShell>{children}</AgencyShell>;
}
