import PageShell from '../components/PageShell';
import ReportTemplate from '../components/ReportTemplate';
import '../styles/report-pages.css';
import { useStyles } from '../context/StyleContext';

export default function HealthReportPage() {
  const { getOverride } = useStyles('report-detail');
  return (
    <PageShell activeNav="reports">
      <ReportTemplate
        title="Health & Wellness Report"
        subtitle="Physical Constitution, Health Periods & Preventive Guidance"
        subdomainId={400}
        icon="fa-heartbeat"
        badgeText="20+ Pages"
      />
    </PageShell>
  );
}
