import PageShell from '../../components/PageShell';
import '../../styles/admin.css';

export default function AdminReportsPage() {
  return (
    <PageShell activeNav="admin">
      <section className="admin-page">
        <div className="container">
          <div className="admin-header">
            <h1><i className="fas fa-file-invoice"></i> Report Management</h1>
            <p>Configure report templates, pricing, and delivery settings</p>
          </div>
          <div className="admin-empty">
            <i className="fas fa-file-invoice"></i>
            <p>Coming soon. Report management tools will be available here.</p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
