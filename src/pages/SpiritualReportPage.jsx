import PageShell from '../components/PageShell';
import ReportLandingPage from '../components/ReportLandingPage';
import { spiritualConfig } from '../data/reportLandingConfigs';

export default function SpiritualReportPage() {
  return (
    <PageShell activeNav="reports">
      <ReportLandingPage config={spiritualConfig} />
    </PageShell>
  );
}
