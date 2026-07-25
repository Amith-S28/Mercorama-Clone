import { AgencyShell } from "@/components/agency/AgencyShell";

export default function AgencyPortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AgencyShell>{children}</AgencyShell>;
}
