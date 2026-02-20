import PageShell from '../components/PageShell';
import ReportTemplate from '../components/ReportTemplate';
import '../styles/report-pages.css';

export default function FamilyChildrenReportPage() {
  return (
    <PageShell activeNav="reports">
      <ReportTemplate
        title="Family & Children Report"
        subtitle="Family Dynamics, Children Prospects & Domestic Harmony"
        subdomainId={600}
        icon="fa-users"
        badgeText="20+ Pages"
      />
    </PageShell>
  );
}
