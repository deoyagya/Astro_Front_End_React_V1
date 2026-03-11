/**
 * AdminStyleManagerPage — Thin wrapper over the reusable AdminStyleEditor.
 *
 * Phase 50B: Passes app-specific API functions and the screen registry
 * to the library's generic editor component.
 */

import { useCallback, useContext } from 'react';
import PageShell from '../../components/PageShell';
import { AdminStyleEditor } from '../../lib/style-manager';
import { SCREEN_STYLE_REGISTRY } from '../../config/screenStyleRegistry';
import { StyleManagerContext } from '../../lib/style-manager';
import { api } from '../../api/client';
import '../../styles/admin.css';

export default function AdminStyleManagerPage() {
  const { refreshStyles } = useContext(StyleManagerContext);

  const apiGet = useCallback((key) => api.get(`/v1/admin/styles/${key}`), []);
  const apiPut = useCallback((key, body) => api.put(`/v1/admin/styles/${key}`, body), []);
  const apiDelete = useCallback((key) => api.delete(`/v1/admin/styles/${key}`), []);

  return (
    <PageShell activeNav="admin">
      <div className="admin-page">
        <AdminStyleEditor
          registry={SCREEN_STYLE_REGISTRY}
          apiGet={apiGet}
          apiPut={apiPut}
          apiDelete={apiDelete}
          refreshStyles={refreshStyles}
        />
      </div>
    </PageShell>
  );
}
