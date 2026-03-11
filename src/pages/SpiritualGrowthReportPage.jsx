import PageShell from '../components/PageShell';
import ReportTemplate from '../components/ReportTemplate';
import '../styles/report-pages.css';
import { useStyles } from '../context/StyleContext';

export default function SpiritualGrowthReportPage() {
  const { getOverride } = useStyles('report-detail');
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
