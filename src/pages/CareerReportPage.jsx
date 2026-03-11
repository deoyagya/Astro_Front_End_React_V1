import PageShell from '../components/PageShell';
import ReportTemplate from '../components/ReportTemplate';
import '../styles/report-pages.css';
import { useStyles } from '../context/StyleContext';

export default function CareerReportPage() {
  const { getOverride } = useStyles('report-detail');
  return (
    <PageShell activeNav="reports">
      <ReportTemplate
        title="Career & Finance Report"
        subtitle="Professional Path, Growth Periods & Financial Potential"
        subdomainId={100}
        icon="fa-briefcase"
        badgeText="25+ Pages"
      />
    </PageShell>
  );
}
