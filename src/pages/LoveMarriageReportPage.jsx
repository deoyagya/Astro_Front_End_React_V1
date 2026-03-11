import PageShell from '../components/PageShell';
import ReportTemplate from '../components/ReportTemplate';
import '../styles/report-pages.css';
import { useStyles } from '../context/StyleContext';

export default function LoveMarriageReportPage() {
  const { getOverride } = useStyles('report-detail');
  return (
    <PageShell activeNav="reports">
      <ReportTemplate
        title="Love & Marriage Report"
        subtitle="Relationship Compatibility, Marriage Timing & Life Partner Analysis"
        subdomainId={200}
        icon="fa-heart"
        badgeText="30+ Pages"
      />
    </PageShell>
  );
}
