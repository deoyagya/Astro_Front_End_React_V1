import PageShell from '../components/PageShell';
import ReportTemplate from '../components/ReportTemplate';
import '../styles/report-pages.css';

export default function SpiritualGrowthReportPage() {
  return (
    <PageShell activeNav="reports">
      <ReportTemplate
        title="Spiritual Growth Report"
        subtitle="Dharma Path, Meditation Practices & Karmic Insights"
        subdomainId={500}
        icon="fa-om"
        badgeText="20+ Pages"
      />
    </PageShell>
  );
}
