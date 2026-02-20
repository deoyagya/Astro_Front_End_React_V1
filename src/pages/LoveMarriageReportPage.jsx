import PageShell from '../components/PageShell';
import ReportTemplate from '../components/ReportTemplate';
import '../styles/report-pages.css';

export default function LoveMarriageReportPage() {
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
