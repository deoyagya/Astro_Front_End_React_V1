import PageShell from '../components/PageShell';
import ReportLandingPage from '../components/ReportLandingPage';
import { familyConfig } from '../data/reportLandingConfigs';

export default function FamilyReportPage() {
  return (
    <PageShell activeNav="reports">
      <ReportLandingPage config={familyConfig} />
    </PageShell>
  );
}
