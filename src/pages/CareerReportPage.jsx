import PageShell from '../components/PageShell';
import ReportLandingPage from '../components/ReportLandingPage';
import { careerConfig } from '../data/reportLandingConfigs';

export default function CareerReportPage() {
  return (
    <PageShell activeNav="reports">
      <ReportLandingPage config={careerConfig} />
    </PageShell>
  );
}
