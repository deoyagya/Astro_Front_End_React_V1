import PageShell from '../components/PageShell';
import ReportTemplate from '../components/ReportTemplate';
import '../styles/report-pages.css';
import { useStyles } from '../context/StyleContext';

export default function EducationReportPage() {
  const { getOverride } = useStyles('report-detail');
  return (
    <PageShell activeNav="reports">
      <ReportTemplate
        title="Education & Learning Report"
        subtitle="Academic Potential, Study Periods & Knowledge Domains"
        subdomainId={300}
        icon="fa-graduation-cap"
        badgeText="20+ Pages"
      />
    </PageShell>
  );
}
