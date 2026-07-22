// app/dashboard/page.tsx
import { IncotermsTool } from './_tools/incoterms-tool';
import { HSCodeTool } from './_tools/hscode-tool';
import { ContractTool } from './_tools/contract-tool';
import { DealTool } from './_tools/deal-tool';
import { FtaDiversifyTool } from './_tools/fta-diversify-tool';
import { ExportCompassTool } from './_tools/export-compass-tool';
import { BGIDashboard } from './_components/bgi-dashboard';
import { FundMyExportTool } from './_tools/fund-my-export-tool';
import { FreightConnectTool } from './_tools/freight-connect-tool';
import { FindExpertsTool } from './_tools/find-experts-tool';
import { ExpertProfileTool } from './_tools/expert-profile-tool';
import { ExpertRequestTool } from './_tools/expert-request-tool';
import { CanadaExplorerTool } from './_tools/canada-explorer-tool';
import { CanadaPlanTool } from './_tools/canada-plan-tool';
import { SnapshotTool } from './_tools/snapshot-tool';
import { DashboardBreadcrumb } from './_components/breadcrumb';
import { ViewTracker } from './_components/view-tracker';

// ─── Dashboard home ────────────────────────────────────────────────────────────

function DashboardHome() {
  return (
    <div>
      <BGIDashboard />
    </div>
  );
}

// ─── View/tool resolver ─────────────────────────────────────────────────────────

function resolveContent(view?: string, tool?: string, product?: string, hsCode?: string) {
  // View-based routing (primary)
  if (view === 'profile')         return <SnapshotTool />;
  if (view === 'canada-markets')  return <CanadaExplorerTool />;
  if (view === 'canada-plan')    return <CanadaPlanTool />;
  if (view === 'global-markets')  return <ExportCompassTool product={product} hsCode={hsCode} />;
  if (view === 'export-plan')     return <DealTool />;
  if (view === 'trade-advantage') return <FtaDiversifyTool />;
  if (view === 'freight-connect') return <FreightConnectTool />;
  if (view === 'fund-my-export')  return <FundMyExportTool />;
  if (view === 'find-experts')    return <FindExpertsTool />;

  // Legacy tool-based routing (preserved for bookmarks/external links)
  if (tool === 'incoterms-analyzer') return <IncotermsTool />;
  if (tool === 'hs-code-assistant')  return <HSCodeTool />;
  if (tool === 'deal-summary-generator' || tool === 'contract-generator') return <ContractTool />;
  if (tool === 'deal-wizard')        return <DealTool />;
  if (tool === 'fta-diversify')      return <FtaDiversifyTool />;
  if (tool === 'export-compass')     return <ExportCompassTool product={product} hsCode={hsCode} />;
  if (tool === 'fund-my-export')     return <FundMyExportTool />;
  if (tool === 'freight-connect')    return <FreightConnectTool />;
  if (tool === 'find-experts')       return <FindExpertsTool />;
  if (tool === 'expert-profile')     return <ExpertProfileTool />;
  if (tool === 'expert-request')     return <ExpertRequestTool />;

  return null;
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; tool?: string; product?: string; hsCode?: string }>;
}) {
  const { view, tool, product, hsCode } = await searchParams;
  const content = resolveContent(view, tool, product, hsCode);

  if (content) {
    const trackView = view ?? tool ?? '';
    return (
      <>
        <DashboardBreadcrumb />
        {trackView && <ViewTracker view={trackView} />}
        {content}
      </>
    );
  }

  return <DashboardHome />;
}
