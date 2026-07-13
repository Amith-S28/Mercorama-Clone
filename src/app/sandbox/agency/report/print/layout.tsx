export default function PrintReportLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="print-report-shell" data-print-root>
      {children}
    </div>
  );
}
