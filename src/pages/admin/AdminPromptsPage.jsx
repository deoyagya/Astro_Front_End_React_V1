import PageShell from '../../components/PageShell';
import '../../styles/admin.css';

export default function AdminPromptsPage() {
  return (
    <PageShell activeNav="admin">
      <section className="admin-page">
        <div className="container">
          <div className="admin-header">
            <h1><i className="fas fa-robot"></i> Prompt Management</h1>
            <p>Manage LLM prompts, templates, and AI interpretation settings</p>
          </div>
          <div className="admin-empty">
            <i className="fas fa-robot"></i>
            <p>Coming soon. Prompt management tools will be available here.</p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
