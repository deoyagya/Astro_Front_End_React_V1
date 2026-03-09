/**
 * ChatWidget — Floating bottom-right AI Vedic Astrology chat panel.
 *
 * Phases:
 *   welcome   — life area selection (paid) or upgrade CTA (free)
 *   templates — predefined question chips for chosen life area
 *   active    — conversational chat with follow-up chips + text input
 *
 * Persists open/closed state + session across minimise/re-open via localStorage.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import '../styles/chat-widget.css';

// ────────────────────────────── localStorage keys
const LS_OPEN = 'cw_is_open';
const LS_STATE = 'cw_session_state';

// ────────────────────────────── Inline sub-components

function TypingIndicator() {
  return (
    <div className="cw-typing">
      <span className="cw-typing-dot" />
      <span className="cw-typing-dot" />
      <span className="cw-typing-dot" />
    </div>
  );
}

const AssistantMessage = React.forwardRef(({ msg }, ref) => {
  return (
    <div className="cw-msg cw-msg-assistant" ref={ref}>
      {msg.headline && <div className="cw-msg-headline">{msg.headline}</div>}
      <div className="cw-msg-text">{msg.interpretation || msg.content}</div>
      {msg.advice && (
        <div className="cw-msg-advice">
          <i className="fas fa-lightbulb" /> {msg.advice}
        </div>
      )}
      {msg.remedies?.length > 0 && (
        <div className="cw-msg-remedies">
          <strong>Remedies:</strong>
          <ul>
            {msg.remedies.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}
      {msg.tone && (
        <span className={`cw-tone-badge cw-tone-${msg.tone}`}>{msg.tone}</span>
      )}
    </div>
  );
});

function UserMessage({ msg }) {
  return (
    <div className="cw-msg cw-msg-user">
      <div className="cw-msg-text">{msg.content}</div>
    </div>
  );
}

// ────────────────────────────── Main component

export default function ChatWidget() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // ── Chat is a premium feature — don't render anything for unauthenticated users
  // No trigger button, no nudge, no panel — completely invisible.
  // Free users still see the upgrade CTA inside the panel.

  // ── Core state
  const [isOpen, setIsOpen] = useState(
    () => isAuthenticated && localStorage.getItem(LS_OPEN) === 'true',
  );
  const [phase, setPhase] = useState('welcome');
  const [lifeAreas, setLifeAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [askedTemplateIds, setAskedTemplateIds] = useState(new Set());
  const [followUpText, setFollowUpText] = useState('');
  const [sending, setSending] = useState(false);
  const [savedChart, setSavedChart] = useState(null);
  const [noChart, setNoChart] = useState(false);
  const [quota, setQuota] = useState({
    plan: '',
    questionCount: 0,
    maxQuestions: 10,
  });
  const [error, setError] = useState(null);
  const [panelReady, setPanelReady] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const [showNudge, setShowNudge] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);

  // ── Maximize state
  const [isMaximized, setIsMaximized] = useState(false);

  // ── Partner birth data (compatibility 1501)
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [pendingArea, setPendingArea] = useState(null);
  const [partnerForm, setPartnerForm] = useState({
    name: '', dob: '', tob_h: '12', tob_m: '0',
    place_of_birth: '', lat: '', lon: '', tz_id: 'Asia/Kolkata', gender: 'female',
  });

  // ── Refs
  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const errorTimerRef = useRef(null);
  const restoredRef = useRef(false);
  const nudgeTimerRef = useRef(null);
  const lastAnswerRef = useRef(null);

  const isFreeUser = user?.role === 'free';
  const quotaExhausted =
    quota.maxQuestions > 0 && quota.questionCount >= quota.maxQuestions;

  // ────────────────────────── Helpers

  /** Scroll to the start of the latest AI answer so user reads from the top. */
  const scrollToLatestAnswer = useCallback(() => {
    requestAnimationFrame(() => {
      if (lastAnswerRef.current && bodyRef.current) {
        // Scroll the answer's top edge into view within the chat body
        lastAnswerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (bodyRef.current) {
        bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
      }
    });
  }, []);

  /** Show a transient error toast (auto-dismiss after 5 s). */
  const showError = useCallback((msg) => {
    setError(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setError(null), 5000);
  }, []);

  /** Persist current session state to localStorage. */
  const persistState = useCallback(() => {
    try {
      const snapshot = {
        phase,
        selectedArea,
        sessionId,
        messages,
        templates,
        followUps,
        quota,
        savedChart,
        noChart,
        showPartnerForm,
        pendingArea,
      };
      localStorage.setItem(LS_STATE, JSON.stringify(snapshot));
    } catch {
      // localStorage full or unavailable — silently ignore
    }
  }, [phase, selectedArea, sessionId, messages, templates, followUps, quota, savedChart, noChart, showPartnerForm, pendingArea]);

  /** Restore session state from localStorage. */
  const restoreState = useCallback(() => {
    try {
      const raw = localStorage.getItem(LS_STATE);
      if (!raw) return false;
      const s = JSON.parse(raw);
      if (s.sessionId) {
        setPhase(s.phase || 'welcome');
        setSelectedArea(s.selectedArea || null);
        setSessionId(s.sessionId);
        setMessages(s.messages || []);
        setTemplates(s.templates || []);
        setFollowUps(s.followUps || []);
        setQuota(s.quota || { plan: '', questionCount: 0, maxQuestions: 10 });
        setSavedChart(s.savedChart || null);
        setNoChart(s.noChart || false);
        return true;
      }
    } catch {
      // Corrupt data — ignore
    }
    return false;
  }, []);

  // ────────────────────────── Effects

  /** Sync isOpen to localStorage. */
  useEffect(() => {
    localStorage.setItem(LS_OPEN, String(isOpen));
  }, [isOpen]);

  /** Persist state whenever it changes meaningfully. */
  useEffect(() => {
    if (sessionId) {
      persistState();
    }
  }, [phase, messages, followUps, quota, sessionId, persistState]);

  /** On open: restore or fetch fresh data. */
  useEffect(() => {
    if (!isOpen) return;

    // Trigger slide-up animation
    const raf = requestAnimationFrame(() => setPanelReady(true));

    if (isFreeUser) return () => cancelAnimationFrame(raf);

    // Attempt restore only once per mount
    if (!restoredRef.current) {
      restoredRef.current = true;
      const restored = restoreState();
      if (restored) {
        return () => cancelAnimationFrame(raf);
      }
    }

    // Fresh load — fetch life areas + saved chart in parallel
    let cancelled = false;

    async function loadInitialData() {
      try {
        const [areasRes, chartsRes] = await Promise.all([
          api.get('/v1/chat/life-areas'),
          api.get('/v1/charts/saved?limit=1'),
        ]);

        if (cancelled) return;

        setLifeAreas(areasRes.life_areas || []);

        const charts = chartsRes.charts || [];
        if (charts.length === 0) {
          setNoChart(true);
          setSavedChart(null);
        } else {
          setNoChart(false);
          setSavedChart(charts[0]);
        }
      } catch (err) {
        if (!cancelled) showError(err.message);
      }
    }

    loadInitialData();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Scroll to latest answer when messages change or typing indicator shows. */
  useEffect(() => {
    scrollToLatestAnswer();
  }, [messages, sending, scrollToLatestAnswer]);

  /** Clean up error timer on unmount. */
  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  /** Nudge bubble — pop out after 20s when widget is closed and not yet dismissed. */
  useEffect(() => {
    if (nudgeTimerRef.current) {
      clearTimeout(nudgeTimerRef.current);
      nudgeTimerRef.current = null;
    }

    if (!isOpen && !nudgeDismissed) {
      nudgeTimerRef.current = setTimeout(() => {
        setShowNudge(true);
      }, 20000);
    } else {
      setShowNudge(false);
    }

    return () => {
      if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current);
    };
  }, [isOpen, nudgeDismissed, isAuthenticated]);

  /** Dismiss the nudge and prevent it from showing again this session. */
  const handleDismissNudge = useCallback((e) => {
    e.stopPropagation();
    setShowNudge(false);
    setNudgeDismissed(true);
  }, []);

  /** Click on nudge opens the chat. */
  const handleNudgeClick = useCallback(() => {
    setShowNudge(false);
    setNudgeDismissed(true);
    setIsOpen(true);
  }, []);

  // ────────────────────────── Handlers

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleMinimize = useCallback(() => {
    setIsOpen(false);
    setPanelReady(false);
  }, []);

  /** Select a life area and start a session. */
  const handleSelectArea = useCallback(
    async (area) => {
      if (!savedChart) return;

      // For compatibility (1501): show partner birth data form first
      if (area.key === '1501') {
        setPendingArea(area);
        setShowPartnerForm(true);
        setPhase('partner_form');
        return;
      }

      // All other life areas: start session immediately
      await startSessionWithArea(area, null);
    },
    [savedChart], // eslint-disable-line react-hooks/exhaustive-deps
  );

  /** Shared session-start logic (used by both normal and compatibility paths). */
  const startSessionWithArea = useCallback(
    async (area, partnerBirthData) => {
      setSelectedArea(area);
      setSending(true);

      try {
        const payload = {
          life_area_key: area.key,
          birth_data: savedChart.birth_data,
          mode: voiceMode ? 'voice' : 'text',
          user_name: savedChart.birth_data.name,
        };

        // Include partner birth data for compatibility sessions
        if (area.key === '1501' && partnerBirthData) {
          payload.partner_birth_data = partnerBirthData;
        }

        const res = await api.postLong('/v1/chat/start', payload, 60000);

        setSessionId(res.session_id);
        setTemplates(res.templates || []);
        setQuota((prev) => ({
          ...prev,
          maxQuestions: res.max_questions || prev.maxQuestions,
        }));
        setPhase('templates');
        setShowPartnerForm(false);
        setPendingArea(null);
      } catch (err) {
        showError(err.message);
        setSelectedArea(null);
      } finally {
        setSending(false);
      }
    },
    [savedChart, voiceMode, showError],
  );

  /** Submit partner birth data form and start compatibility session. */
  const handlePartnerFormSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (!pendingArea || !partnerForm.name || !partnerForm.dob) {
        showError('Please provide partner\'s name and date of birth.');
        return;
      }
      const partnerData = {
        ...partnerForm,
        tob_h: parseInt(partnerForm.tob_h, 10) || 12,
        tob_m: parseInt(partnerForm.tob_m, 10) || 0,
        lat: partnerForm.lat ? parseFloat(partnerForm.lat) : 28.61,
        lon: partnerForm.lon ? parseFloat(partnerForm.lon) : 77.23,
      };
      startSessionWithArea(pendingArea, partnerData);
    },
    [pendingArea, partnerForm, startSessionWithArea, showError],
  );

  /** Cancel partner form and return to life area selection. */
  const handlePartnerFormCancel = useCallback(() => {
    setShowPartnerForm(false);
    setPendingArea(null);
    setPhase('welcome');
  }, []);

  /** Ask a predefined template question. */
  const handleAskTemplate = useCallback(
    async (template) => {
      if (!sessionId || sending) return;

      // Track this template as asked so it never reappears
      setAskedTemplateIds((prev) => new Set([...prev, template.id]));

      // Add user bubble
      const userMsg = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: template.question_text,
      };
      setMessages((prev) => [...prev, userMsg]);
      setPhase('active');
      setTemplates([]);
      setFollowUps([]);
      setSending(true);

      try {
        const res = await api.postLong(
          `/v1/chat/sessions/${sessionId}/ask`,
          { template_id: template.id, is_voice: voiceMode },
          60000,
        );

        if (res.blocked) {
          showError('This question could not be answered. Please try another.');
          setSending(false);
          return;
        }

        const assistantMsg = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          headline: res.response?.headline || '',
          interpretation: res.response?.interpretation || '',
          content: res.response?.interpretation || '',
          advice: res.response?.advice || '',
          remedies: res.response?.remedies || [],
          tone: res.response?.tone || '',
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setFollowUps(res.follow_up_suggestions || []);
        setQuota((prev) => ({
          ...prev,
          questionCount: res.question_count ?? prev.questionCount + 1,
          maxQuestions: res.max_questions ?? prev.maxQuestions,
        }));
      } catch (err) {
        if (err.message.includes('wait')) {
          showError('Please wait before asking again.');
        } else if (
          err.message.includes('expired') ||
          err.message.includes('ended')
        ) {
          showError('Session ended. Start a new topic to continue.');
          setFollowUps([]);
        } else {
          showError(err.message);
        }
      } finally {
        setSending(false);
      }
    },
    [sessionId, sending, voiceMode, showError],
  );

  /** Send a follow-up (from chip or custom text). */
  const handleFollowUp = useCallback(
    async (text) => {
      if (!sessionId || sending || !text.trim()) return;
      if (quotaExhausted) {
        showError('You have used all your questions for this session.');
        return;
      }

      const userMsg = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: text.trim(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setFollowUpText('');
      setFollowUps([]);
      setSending(true);

      try {
        const res = await api.postLong(
          `/v1/chat/sessions/${sessionId}/follow-up`,
          { text: text.trim(), is_voice: voiceMode },
          60000,
        );

        if (res.blocked) {
          showError('This question could not be answered. Please try another.');
          setSending(false);
          return;
        }

        const assistantMsg = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          headline: res.response?.headline || '',
          interpretation: res.response?.interpretation || '',
          content: res.response?.interpretation || '',
          advice: res.response?.advice || '',
          remedies: res.response?.remedies || [],
          tone: res.response?.tone || '',
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setFollowUps(res.follow_up_suggestions || []);
        setQuota((prev) => ({
          ...prev,
          questionCount: res.question_count ?? prev.questionCount + 1,
          maxQuestions: res.max_questions ?? prev.maxQuestions,
        }));
      } catch (err) {
        if (err.message.includes('wait')) {
          showError('Please wait before asking again.');
        } else if (
          err.message.includes('expired') ||
          err.message.includes('ended')
        ) {
          showError('Session ended. Start a new topic to continue.');
          setFollowUps([]);
        } else {
          showError(err.message);
        }
      } finally {
        setSending(false);
      }
    },
    [sessionId, sending, voiceMode, quotaExhausted, showError],
  );

  /** Submit custom follow-up from the text input. */
  const handleSubmitInput = useCallback(
    (e) => {
      e.preventDefault();
      if (followUpText.trim()) {
        handleFollowUp(followUpText);
      }
    },
    [followUpText, handleFollowUp],
  );

  /** Handle keyboard submit in the text input. */
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (followUpText.trim()) {
          handleFollowUp(followUpText);
        }
      }
    },
    [followUpText, handleFollowUp],
  );

  /** Submit a custom question typed by the user in the templates phase. */
  const handleCustomQuestion = useCallback(
    (e) => {
      e.preventDefault();
      if (!customQuestion.trim() || !sessionId || sending) return;
      // Transition to active phase and send as follow-up
      handleFollowUp(customQuestion.trim());
      setCustomQuestion('');
      setPhase('active');
      setTemplates([]);
    },
    [customQuestion, sessionId, sending, handleFollowUp],
  );

  /** End current session and reset to life area picker. */
  const handleNewTopic = useCallback(async () => {
    // End current session silently
    if (sessionId) {
      try {
        await api.post(`/v1/chat/sessions/${sessionId}/end`, {});
      } catch {
        // Ending may fail if session already expired — ignore
      }
    }

    // Reset all session state
    setPhase('welcome');
    setSelectedArea(null);
    setSessionId(null);
    setMessages([]);
    setTemplates([]);
    setFollowUps([]);
    setAskedTemplateIds(new Set());
    setFollowUpText('');
    setQuota((prev) => ({ ...prev, questionCount: 0 }));
    setShowPartnerForm(false);
    setPendingArea(null);
    setPartnerForm({
      name: '', dob: '', tob_h: '12', tob_m: '0',
      place_of_birth: '', lat: '', lon: '', tz_id: 'Asia/Kolkata', gender: 'female',
    });

    // Clear persisted state so re-open starts fresh
    localStorage.removeItem(LS_STATE);
  }, [sessionId]);

  // ── Gate: chat is a premium feature — render nothing for unauthenticated visitors.
  // All hooks (useState, useEffect, useCallback, useRef) are above this line
  // so React rules-of-hooks are satisfied.
  if (!isAuthenticated) return null;

  // ────────────────────────── Render helpers

  /** Welcome content for free users: upgrade CTA. */
  function renderFreeWelcome() {
    return (
      <div className="cw-welcome">
        <div className="cw-welcome-icon">
          <i className="fas fa-lock" />
        </div>
        <h3 className="cw-welcome-title">Unlock AI Jyotish Guidance</h3>
        <p className="cw-welcome-text">
          Get personalised Vedic astrology insights powered by classical texts
          like BPHS &amp; Phaladeepika, cross-validated by dual AI reviewers.
        </p>
        <ul className="cw-feature-list">
          <li><i className="fas fa-check-circle" /> 13 life areas — career, health, marriage &amp; more</li>
          <li><i className="fas fa-check-circle" /> AI answers grounded in your birth chart</li>
          <li><i className="fas fa-check-circle" /> Personalised remedies &amp; timing guidance</li>
        </ul>
        <button
          className="cw-btn cw-btn-primary"
          onClick={() => navigate('/pricing')}
        >
          <i className="fas fa-crown" /> Upgrade to Chat
        </button>
      </div>
    );
  }

  /** Welcome content for paid users: life area grid or no-chart notice. */
  function renderPaidWelcome() {
    if (noChart) {
      return (
        <div className="cw-welcome">
          <div className="cw-welcome-icon">
            <i className="fas fa-user-circle" />
          </div>
          <h3 className="cw-welcome-title">Save Your Birth Details First</h3>
          <p className="cw-welcome-text">
            To begin a conversation, we need your birth chart on file. Please
            save your birth details and come back.
          </p>
          <button
            className="cw-btn cw-btn-primary"
            onClick={() => navigate('/my-data/saved-charts')}
          >
            Go to My Charts
          </button>
        </div>
      );
    }

    return (
      <div className="cw-welcome">
        <p className="cw-welcome-greeting">
          Namaste{savedChart?.birth_data?.name ? `, ${savedChart.birth_data.name}` : ''}! Choose a
          topic to begin your consultation.
        </p>
        <div className="cw-area-grid">
          {lifeAreas.map((area) => (
            <button
              key={area.key}
              className="cw-area-chip"
              onClick={() => handleSelectArea(area)}
              disabled={sending}
            >
              <span className="cw-area-icon"><i className={`fas ${area.icon || 'fa-star'}`} /></span>
              <span className="cw-area-name">{area.name}</span>
            </button>
          ))}
        </div>
        {sending && (
          <div className="cw-loading-hint">Starting session...</div>
        )}
      </div>
    );
  }

  /** Template chips for selected life area (excludes already-asked). */
  function renderTemplates() {
    const available = templates.filter((t) => !askedTemplateIds.has(t.id));
    return (
      <div className="cw-templates-section">
        <p className="cw-templates-intro">
          These are the most popular questions asked by our users:
        </p>
        <div className="cw-template-list">
          {available.map((t) => (
            <button
              key={t.id}
              className="cw-template-chip"
              onClick={() => handleAskTemplate(t)}
              disabled={sending}
            >
              {t.question_text}
              {t.credit_cost > 1 && (
                <span className="cw-credit-badge">{t.credit_cost}x</span>
              )}
            </button>
          ))}
        </div>
        {/* Custom question input */}
        <div className="cw-custom-question">
          <p className="cw-custom-question-label">Or ask your own question:</p>
          <form className="cw-custom-question-form" onSubmit={handleCustomQuestion}>
            <input
              type="text"
              placeholder="Type your question here (max 100 chars)..."
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              maxLength={100}
              disabled={sending}
              autoComplete="off"
            />
            <button
              type="submit"
              className="cw-send-btn"
              disabled={!customQuestion.trim() || sending}
              aria-label="Send"
            >
              <i className="fas fa-paper-plane" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  /** Follow-up suggestion chips below the last assistant message (excludes already-asked). */
  function renderFollowUpChips() {
    const available = followUps.filter((f) => !askedTemplateIds.has(f.id));
    if (available.length === 0 || quotaExhausted) return null;
    return (
      <div className="cw-followup-chips">
        {available.map((f) => (
          <button
            key={f.id}
            className="cw-followup-chip"
            onClick={() => {
              setAskedTemplateIds((prev) => new Set([...prev, f.id]));
              handleFollowUp(f.question_text);
            }}
            disabled={sending}
          >
            {f.question_text}
          </button>
        ))}
      </div>
    );
  }

  /** Quota exhaustion notice. */
  function renderQuotaExhausted() {
    return (
      <div className="cw-quota-exhausted">
        <p>
          You have used all {quota.maxQuestions} questions for this session.
        </p>
        <button className="cw-btn cw-btn-secondary" onClick={handleNewTopic}>
          Start New Topic
        </button>
      </div>
    );
  }

  /** Partner birth data form for compatibility (1501). */
  function renderPartnerForm() {
    return (
      <div className="cw-partner-form">
        <div className="cw-partner-header">
          <i className="fas fa-heart" />
          <h4>Partner&apos;s Birth Details</h4>
          <p className="cw-partner-subtitle">
            Compatibility analysis requires both partners&apos; birth charts (Guna Milan — BPHS Ch. 78).
          </p>
        </div>
        <form className="cw-partner-fields" onSubmit={handlePartnerFormSubmit}>
          <label className="cw-field">
            <span>Partner&apos;s Name *</span>
            <input
              type="text" required placeholder="Full name"
              value={partnerForm.name}
              onChange={(e) => setPartnerForm((f) => ({ ...f, name: e.target.value }))}
            />
          </label>
          <label className="cw-field">
            <span>Date of Birth *</span>
            <input
              type="date" required
              value={partnerForm.dob}
              onChange={(e) => setPartnerForm((f) => ({ ...f, dob: e.target.value }))}
            />
          </label>
          <div className="cw-field-row">
            <label className="cw-field cw-field-half">
              <span>Birth Hour (0-23)</span>
              <input
                type="number" min="0" max="23"
                value={partnerForm.tob_h}
                onChange={(e) => setPartnerForm((f) => ({ ...f, tob_h: e.target.value }))}
              />
            </label>
            <label className="cw-field cw-field-half">
              <span>Birth Minute (0-59)</span>
              <input
                type="number" min="0" max="59"
                value={partnerForm.tob_m}
                onChange={(e) => setPartnerForm((f) => ({ ...f, tob_m: e.target.value }))}
              />
            </label>
          </div>
          <label className="cw-field">
            <span>Place of Birth</span>
            <input
              type="text" placeholder="City, Country"
              value={partnerForm.place_of_birth}
              onChange={(e) => setPartnerForm((f) => ({ ...f, place_of_birth: e.target.value }))}
            />
          </label>
          <label className="cw-field">
            <span>Gender</span>
            <select
              value={partnerForm.gender}
              onChange={(e) => setPartnerForm((f) => ({ ...f, gender: e.target.value }))}
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </label>
          <div className="cw-partner-actions">
            <button type="button" className="cw-btn cw-btn-secondary" onClick={handlePartnerFormCancel}>
              <i className="fas fa-arrow-left" /> Back
            </button>
            <button type="submit" className="cw-btn cw-btn-primary" disabled={sending}>
              {sending ? 'Starting...' : 'Start Compatibility Analysis'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ────────────────────────── Main render

  const showFooterInput =
    phase === 'active' && sessionId && !quotaExhausted && !sending;

  return (
    <>
      {/* ── Floating trigger button ── */}
      {!isOpen && (
        <>
          {/* Nudge pop-out — large orb + curved text + badge */}
          {showNudge && (
            <div className="cw-nudge" onClick={handleNudgeClick}>
              <button
                className="cw-nudge-dismiss"
                onClick={handleDismissNudge}
                aria-label="Dismiss"
              >
                &times;
              </button>

              {/* Waving hand */}
              <span className="cw-nudge-hand" role="img" aria-label="namaste">🙏</span>

              {/* Large circular icon */}
              <div className="cw-nudge-orb">
                {/* Curved text above the orb */}
                <div className="cw-nudge-curved-text">
                  <svg viewBox="0 0 160 50" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <path id="cwCurve" d="M 10,48 Q 80,-5 150,48" fill="none" />
                    </defs>
                    <text>
                      <textPath href="#cwCurve" startOffset="50%" textAnchor="middle">
                        Consult Your Stars!
                      </textPath>
                    </text>
                  </svg>
                </div>
                <i className="fas fa-om cw-nudge-orb-icon" />
                <span className="cw-nudge-badge">1</span>
              </div>

              {/* Text bubble */}
              <div className="cw-nudge-text">
                <span className="cw-nudge-title">Jyotish AI is here!</span>
                <span className="cw-nudge-desc">Get Vedic astrology guidance on career, health &amp; destiny</span>
              </div>
            </div>
          )}

          <button
            className="cw-trigger"
            onClick={handleOpen}
            aria-label="Open Jyotish AI chat"
          >
            <i className="fas fa-comment-dots" />
            {showNudge && <span className="cw-trigger-badge" />}
          </button>
        </>
      )}

      {/* ── Chat panel ── */}
      {isOpen && (
        <div className={`cw-panel ${panelReady ? 'cw-panel-open' : ''} ${isMaximized ? 'cw-panel-maximized' : ''}`}>
          {/* Header */}
          <div className="cw-header">
            <div className="cw-header-left">
              <span className="cw-header-icon" role="img" aria-label="lamp">
                {'\uD83E\uDED4'}
              </span>
              <span className="cw-header-title">Jyotish AI</span>
              {selectedArea && (
                <span className="cw-header-area">{selectedArea.name}</span>
              )}
            </div>
            <div className="cw-header-right">
              {/* Voice mode toggle */}
              <button
                className={`cw-voice-toggle ${voiceMode ? 'cw-voice-active' : ''}`}
                onClick={() => setVoiceMode((v) => !v)}
                aria-label={voiceMode ? 'Switch to text mode' : 'Switch to voice mode'}
                title={voiceMode ? 'Voice mode ON (2x credits)' : 'Enable voice mode'}
              >
                <i className={voiceMode ? 'fas fa-microphone' : 'fas fa-microphone-slash'} />
                <span className="cw-voice-label">{voiceMode ? 'Voice' : 'Text'}</span>
              </button>
              {sessionId && (
                <span className="cw-quota-badge">
                  {quota.questionCount}/{quota.maxQuestions}
                </span>
              )}
              <button
                className="cw-maximize-btn"
                onClick={() => setIsMaximized((v) => !v)}
                aria-label={isMaximized ? 'Restore chat size' : 'Maximize chat'}
                title={isMaximized ? 'Restore' : 'Maximize'}
              >
                <i className={isMaximized ? 'fas fa-compress-alt' : 'fas fa-expand-alt'} />
              </button>
              <button
                className="cw-minimize-btn"
                onClick={handleMinimize}
                aria-label="Minimize chat"
              >
                <i className="fas fa-minus" />
              </button>
            </div>
          </div>

          {/* Error toast */}
          {error && (
            <div className="cw-error-toast" role="alert">
              <span>{error}</span>
              <button
                className="cw-error-dismiss"
                onClick={() => setError(null)}
                aria-label="Dismiss"
              >
                <i className="fas fa-times" />
              </button>
            </div>
          )}

          {/* Body */}
          <div className="cw-body" ref={bodyRef}>
            {/* Phase: welcome — free users see upgrade CTA, paid users see area picker */}
            {phase === 'welcome' &&
              (isFreeUser ? renderFreeWelcome() : renderPaidWelcome())}

            {/* Phase: partner_form — compatibility birth data */}
            {phase === 'partner_form' && renderPartnerForm()}

            {/* Phase: templates */}
            {phase === 'templates' && renderTemplates()}

            {/* Phase: active — message thread */}
            {phase === 'active' && (
              <div className="cw-thread">
                {messages.map((msg, idx) => {
                  const isLastAssistant =
                    msg.role === 'assistant' &&
                    !messages.slice(idx + 1).some((m) => m.role === 'assistant');
                  return msg.role === 'user' ? (
                    <UserMessage key={msg.id} msg={msg} />
                  ) : (
                    <AssistantMessage
                      key={msg.id}
                      msg={msg}
                      ref={isLastAssistant ? lastAnswerRef : null}
                    />
                  );
                })}

                {sending && <TypingIndicator />}

                {!sending && renderFollowUpChips()}

                {!sending && quotaExhausted && renderQuotaExhausted()}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="cw-footer">
            {/* Text input during active session */}
            {showFooterInput && (
              <form className="cw-input-row" onSubmit={handleSubmitInput}>
                <input
                  ref={inputRef}
                  type="text"
                  className="cw-input"
                  placeholder="Ask a follow-up (max 100 chars)..."
                  value={followUpText}
                  onChange={(e) => setFollowUpText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={100}
                  disabled={sending}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="cw-send-btn"
                  disabled={!followUpText.trim() || sending}
                  aria-label="Send"
                >
                  <i className="fas fa-paper-plane" />
                </button>
              </form>
            )}

            {/* Sending indicator in footer */}
            {phase === 'active' && sending && (
              <div className="cw-footer-status">Thinking...</div>
            )}

            {/* New Topic button when session exists (visible in template and active phases) */}
            {(phase === 'templates' || phase === 'active') && !sending && (
              <button
                className="cw-btn cw-btn-new-topic"
                onClick={handleNewTopic}
              >
                <i className="fas fa-redo-alt" /> New Topic
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
