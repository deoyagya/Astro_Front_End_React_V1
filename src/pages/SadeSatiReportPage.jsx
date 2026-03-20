import PageShell from '../components/PageShell';
import ReportLandingPage from '../components/ReportLandingPage';
import { sadeSatiConfig } from '../data/reportLandingConfigs';

export default function SadeSatiReportPage() {
  return (
    <PageShell activeNav="kundli">
      <ReportLandingPage config={sadeSatiConfig} />
    </PageShell>
  );
}
