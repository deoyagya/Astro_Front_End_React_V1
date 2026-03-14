import PageShell from '../components/PageShell';
import ReportLandingPage from '../components/ReportLandingPage';
import { healthConfig } from '../data/reportLandingConfigs';

export default function HealthReportPage() {
  return (
    <PageShell activeNav="reports">
      <ReportLandingPage config={healthConfig} />
    </PageShell>
  );
}
