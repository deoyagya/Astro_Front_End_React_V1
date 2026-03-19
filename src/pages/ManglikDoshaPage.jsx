import PageShell from '../components/PageShell';
import ReportLandingPage from '../components/ReportLandingPage';
import { manglikConfig } from '../data/reportLandingConfigs';

export default function ManglikDoshaPage() {
  return (
    <PageShell activeNav="kundli">
      <ReportLandingPage config={manglikConfig} />
    </PageShell>
  );
}
