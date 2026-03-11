/**
 * PublicSurveyPage — Renders a live survey form for anonymous submission.
 *
 * Phase 51: No auth required. Uses raw fetch (not api client) so it works
 * without JWT. Minimal page — no SiteHeader, no stars background.
 */

import { useParams } from 'react-router-dom';
import { SurveyRenderer } from '../lib/survey-builder';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function PublicSurveyPage() {
  const { slug } = useParams();

  const apiFetch = async (s) => {
    const res = await fetch(`${API_BASE}/v1/survey/${s}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Survey not found' }));
      throw new Error(err.detail || 'Survey not found');
    }
    return res.json();
  };

  const apiSubmit = async (s, responses, metadata) => {
    const res = await fetch(`${API_BASE}/v1/survey/${s}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responses, metadata }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Submission failed' }));
      throw new Error(err.detail || 'Submission failed');
    }
    return res.json();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d1117',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '40px 16px',
    }}>
      <SurveyRenderer
        slug={slug}
        apiFetch={apiFetch}
        apiSubmit={apiSubmit}
      />
    </div>
  );
}
