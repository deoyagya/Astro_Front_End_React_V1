import PageShell from '../components/PageShell';
import ReportLandingPage from '../components/ReportLandingPage';
import { loveConfig } from '../data/reportLandingConfigs';

export default function LoveMarriageReportPage() {
  return (
    <PageShell activeNav="reports">
      <ReportLandingPage config={loveConfig} />
    </PageShell>
  );
}
