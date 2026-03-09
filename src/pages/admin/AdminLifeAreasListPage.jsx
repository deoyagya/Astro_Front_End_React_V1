import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { api } from '../../api/client';
import '../../styles/admin.css';

export default function AdminLifeAreasListPage() {
  const navigate = useNavigate();
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterThemeId, setFilterThemeId] = useState('all');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const themesData = await api.get('/v1/admin/taxonomy/themes?include_inactive=true');
      const enriched = await Promise.all(
        themesData.map(async (theme) => {
          const areas = await api.get(`/v1/admin/taxonomy/themes/${theme.id}/life-areas?include_inactive=true`);
          return { ...theme, areas };
        })
      );
      setThemes(enriched);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const allAreas = themes.flatMap((theme) =>
    theme.areas.map((area) => ({ ...area, themeName: theme.name, themeId: theme.id }))
  );

  const filteredAreas = filterThemeId === 'all'
    ? allAreas
    : allAreas.filter((a) => a.themeId === filterThemeId);

  return (
    <PageShell activeNav="admin">
      <section className="admin-page">
        <div className="container">
          <div className="admin-header">
            <h1><i className="fas fa-sitemap"></i> All Life Areas</h1>
            <p>Browse all life areas across every core theme</p>
          </div>

          <div className="admin-toolbar">
            <select
              className="filter-select"
              value={filterThemeId}
              onChange={(e) => setFilterThemeId(e.target.value)}
            >
              <option value="all">All Themes</option>
              {themes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="admin-loading">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Loading life areas...</p>
            </div>
          ) : error ? (
            <div className="admin-empty">
              <i className="fas fa-exclamation-circle"></i>
              <p>{error}</p>
            </div>
          ) : filteredAreas.length === 0 ? (
            <div className="admin-empty">
              <i className="fas fa-folder-open"></i>
              <p>No life areas found.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Theme</th>
                  <th>Life Area</th>
                  <th>Rule File</th>
                  <th>Houses</th>
                  <th>Charts</th>
                  <th>Questions</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAreas.map((area) => (
                  <tr key={area.id} className={!area.is_active ? 'deleted-row' : ''}>
                    <td style={{ color: '#b794ff', fontWeight: 600 }}>{area.themeName}</td>
                    <td>
                      <strong>{area.name}</strong>
                      {area.description && (
                        <div style={{ color: '#a0a8b8', fontSize: '0.9375rem' }}>{area.description}</div>
                      )}
                    </td>
                    <td style={{ color: '#a0a8b8', fontSize: '0.9375rem' }}>
                      {area.rule_file || '\u2014'}
                    </td>
                    <td style={{ color: '#b794ff' }}>
                      {area.primary_houses?.join(', ') || '\u2014'}
                    </td>
                    <td style={{ fontSize: '0.9375rem' }}>
                      {area.divisional_charts?.length
                        ? area.divisional_charts.join(', ')
                        : '\u2014'}
                    </td>
                    <td>{area.question_count}</td>
                    <td>
                      {area.is_active
                        ? <span className="badge-active">Active</span>
                        : <span className="badge-inactive">Inactive</span>}
                    </td>
                    <td>
                      <button
                        className="btn-edit"
                        onClick={() => navigate(`/admin/themes/${area.themeId}/life-areas`)}
                      >
                        <i className="fas fa-edit"></i> Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </PageShell>
  );
}
