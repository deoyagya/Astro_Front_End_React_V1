import PageShell from '../components/PageShell';
import ReportLandingPage from '../components/ReportLandingPage';
import { birthChartAnalysisConfig } from '../data/reportLandingConfigs';

export default function BirthChartAnalysisPage() {
  return (
    <PageShell activeNav="kundli">
      <ReportLandingPage config={birthChartAnalysisConfig} />
    </PageShell>
  );
}
