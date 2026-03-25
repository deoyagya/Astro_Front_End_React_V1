/**
 * ChatPage — AI Vedic Astrology Chat Interface
 *
 * Standalone top-level page at /chat (NOT nested under MyDataLayout).
 * Premium AI chat for Vedic astrology consultations across 13 life areas.
 *
 * 3-phase flow:
 *   Phase 1 — Life Area Selector (grid of 13 cards)
 *   Phase 2 — Birth Data Form (compact, pre-filled from auth)
 *   Phase 3 — Active Chat (messages, templates, follow-ups, voice toggle)
 *
 * Phase 45F — 2026-03-08
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import SiteHeader from '../components/SiteHeader';
import '../styles/chat.css';
import { useStyles } from '../context/StyleContext';

const EXCLUDED_CHAT_AREA_KEYS = new Set(['701', '1001']);

// ─── Life Area FA icon mapping ───
const LIFE_AREA_ICONS = {
  401: 'fa-heartbeat',
  501: 'fa-graduation-cap',
  601: 'fa-chart-line',
  701: 'fa-om',
  801: 'fa-home',
  901: 'fa-baby',
  1001: 'fa-gavel',
  1101: 'fa-building',
  1201: 'fa-plane',
  1301: 'fa-question-circle',
  1401: 'fa-calendar-alt',
  1501: 'fa-heart',
  1601: 'fa-star',
};

// Fallback icon lookup by key substring
const ICON_BY_KEY = {
  health: 'fa-heartbeat',
  education: 'fa-graduation-cap',
  career: 'fa-chart-line',
  finance: 'fa-chart-line',
  spiritual: 'fa-om',
  family: 'fa-home',
  children: 'fa-baby',
  legal: 'fa-gavel',
  property: 'fa-building',
  travel: 'fa-plane',
  prashna: 'fa-question-circle',
  varshaphal: 'fa-calendar-alt',
  marriage: 'fa-heart',
  compatibility: 'fa-heart',
  general: 'fa-star',
};

function resolveIcon(area) {
  const { getOverride } = useStyles('chat-widget');
  // Try numeric ID first
  if (area.key && LIFE_AREA_ICONS[area.key]) return LIFE_AREA_ICONS[area.key];
  // Try icon from API
  if (area.icon) return area.icon;
  // Fallback by name/key substring
  const lowerKey = String(area.key || area.name || '').toLowerCase();
  for (const [substr, icon] of Object.entries(ICON_BY_KEY)) {
    if (lowerKey.includes(substr)) return icon;
  }
  return 'fa-star';
}

// ─── Tone badge config ───
const TONE_CONFIG = {
  opportunity: { className: 'chat-tone-opportunity', label: 'Opportunity' },
  cautious: { className: 'chat-tone-cautious', label: 'Cautious' },
  neutral: { className: 'chat-tone-neutral', label: 'Neutral' },
  positive: { className: 'chat-tone-opportunity', label: 'Positive' },
  negative: { className: 'chat-tone-cautious', label: 'Negative' },
};

// ─── Toast notification component ───
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`chat-toast chat-toast-${type}`}>
      <i className={`fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}`}></i>
      <span>{message}</span>
      <button className="chat-toast-close" onClick={onClose}>
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
}

// ─── Typing indicator ───
function TypingIndicator() {
  return (
    <div className="chat-message assistant">
      <div className="chat-bubble assistant">
        <div className="chat-typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
}

// ─── Session history panel ───
function SessionHistoryPanel({ sessions, onSelect, onClose, visible }) {
  if (!visible) return null;

  return (
    <div className="chat-history-overlay" onClick={onClose}>
      <div className="chat-history-panel" onClick={(e) => e.stopPropagation()}>
        <div className="chat-history-header">
          <h3><i className="fas fa-history"></i> Chat History</h3>
          <button className="chat-history-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="chat-history-list">
          {sessions.length === 0 && (
            <div className="chat-history-empty">
              <i className="fas fa-comments"></i>
              <p>No previous sessions</p>
            </div>
          )}
          {sessions.map((s) => (
            <button
              key={s.id}
              className={`chat-history-item ${s.status === 'ended' ? 'ended' : ''}`}
              onClick={() => onSelect(s.id)}
            >
              <div className="chat-history-item-top">
                <span className="chat-history-area">
                  <i className={`fas ${LIFE_AREA_ICONS[s.life_area_key] || 'fa-star'}`}></i>
                  {' '}{s.life_area_key}
                </span>
                <span className={`chat-history-status ${s.status}`}>{s.status}</span>
              </div>
              <div className="chat-history-item-bottom">
                <span>{s.question_count}/{s.max_questions} questions</span>
                <span>{new Date(s.started_at).toLocaleDateString()}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Assistant message renderer with structured content ───
function AssistantMessageContent({ content, interpretationResult }) {
  // If we have structured interpretation data, render it
  const data = interpretationResult || content;

  if (typeof data === 'string') {
    return <p className="chat-assistant-text">{data}</p>;
  }

  const headline = data.headline || '';
  const interpretation = data.interpretation || data.content || '';
  const advice = data.advice || '';
  const remedies = data.remedies || [];
  const tone = data.tone || '';

  return (
    <div className="chat-assistant-structured">
      {headline && (
        <div className="chat-headline">{headline}</div>
      )}
      {interpretation && (
        <div className="chat-interpretation">{interpretation}</div>
      )}
      {advice && (
        <div className="chat-advice">
          <div className="chat-advice-label">
            <i className="fas fa-lightbulb"></i> Advice
          </div>
          <p>{advice}</p>
        </div>
      )}
      {remedies.length > 0 && (
        <div className="chat-remedies-section">
          <div className="chat-remedies-label">
            <i className="fas fa-leaf"></i> Remedies
          </div>
          <ul className="chat-remedies-list">
            {remedies.map((r, i) => (
              <li key={i}>{typeof r === 'string' ? r : r.text || r.description || JSON.stringify(r)}</li>
            ))}
          </ul>
        </div>
      )}
      {tone && TONE_CONFIG[tone] && (
        <span className={`chat-tone-badge ${TONE_CONFIG[tone].className}`}>
          {TONE_CONFIG[tone].label}
        </span>
      )}
    </div>
  );
}


export default function ChatPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // ─── Phase state ───
  // 'select' | 'birth' | 'chat'
  const [phase, setPhase] = useState('select');

  // ─── Phase 1 state: life area selection ───
  const [lifeAreas, setLifeAreas] = useState([]);
  const [lifeAreasLoading, setLifeAreasLoading] = useState(true);
  const [lifeAreasError, setLifeAreasError] = useState('');
  const [selectedArea, setSelectedArea] = useState(null);

  // ─── Session history ───
  const [sessions, setSessions] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  // ─── Phase 2 state: birth data form ───
  const [birthForm, setBirthForm] = useState({
    user_name: '',
    dob: '',
    tob_h: '',
    tob_m: '',
    lat: '',
    lon: '',
    place_of_birth: '',
  });
  const [startingSession, setStartingSession] = useState(false);

  // ─── Phase 3 state: active chat ───
  const [sessionId, setSessionId] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [followUpText, setFollowUpText] = useState('');
  const [isVoice, setIsVoice] = useState(false);
  const [sending, setSending] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [quota, setQuota] = useState(null);

  // ─── Toast notifications ───
  const [toasts, setToasts] = useState([]);

  // ─── Refs ───
  const messagesEndRef = useRef(null);
  const messageListRef = useRef(null);
  const followUpInputRef = useRef(null);

  // ─── Toast helper ───
  const addToast = useCallback((message, type = 'error') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ─── Redirect if not authenticated ───
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // ─── Scroll to bottom of messages ───
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (phase === 'chat') {
      scrollToBottom();
    }
  }, [messages, sending, phase, scrollToBottom]);

  // ─── Pre-fill birth form from user data ───
  useEffect(() => {
    if (user) {
      setBirthForm((prev) => ({
        ...prev,
        user_name: user.full_name || user.email?.split('@')[0] || '',
      }));
    }
  }, [user]);

  // ─── Load life areas on mount ───
  useEffect(() => {
    let cancelled = false;
    setLifeAreasLoading(true);
    setLifeAreasError('');

    api.get('/v1/chat/life-areas')
      .then((res) => {
        if (!cancelled) {
          setLifeAreas((res.life_areas || []).filter(
            (area) => !EXCLUDED_CHAT_AREA_KEYS.has(String(area.key)),
          ));
          setLifeAreasLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLifeAreasError(err.message || 'Failed to load life areas');
          setLifeAreasLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  // ─── Load sessions for history ───
  const loadSessions = useCallback(() => {
    api.get('/v1/chat/sessions')
      .then((res) => setSessions(res.sessions || []))
      .catch(() => {}); // silent fail for history
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadSessions();
    }
  }, [isAuthenticated, loadSessions]);

  // ─── Load quota ───
  useEffect(() => {
    if (isAuthenticated) {
      api.get('/v1/chat/quota')
        .then(setQuota)
        .catch(() => {});
    }
  }, [isAuthenticated]);

  // ─── Phase 1: Select life area ───
  const handleSelectArea = useCallback((area) => {
    setSelectedArea(area);
    setPhase('birth');
  }, []);

  // ─── Phase 2: Birth form handlers ───
  const handleBirthChange = useCallback((e) => {
    const { name, value } = e.target;
    setBirthForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleStartSession = useCallback(async (e) => {
    e.preventDefault();

    // Validation
    if (!birthForm.dob || !birthForm.tob_h || !birthForm.tob_m || !birthForm.lat || !birthForm.lon || !birthForm.place_of_birth) {
      addToast('Please fill in all birth details');
      return;
    }

    setStartingSession(true);
    try {
      const payload = {
        life_area_key: selectedArea.key,
        birth_data: {
          dob: birthForm.dob,
          tob_h: parseInt(birthForm.tob_h, 10),
          tob_m: parseInt(birthForm.tob_m, 10),
          lat: parseFloat(birthForm.lat),
          lon: parseFloat(birthForm.lon),
          place_of_birth: birthForm.place_of_birth,
        },
        mode: 'premium',
        user_name: birthForm.user_name || undefined,
      };

      const res = await api.postLong('/v1/chat/start', payload, 60000);
      setSessionId(res.session_id);
      setSessionInfo({
        life_area: res.life_area,
        max_questions: res.max_questions,
        question_count: 0,
      });
      setTemplates(res.templates || []);
      setMessages([]);
      setFollowUps([]);
      setSessionEnded(false);
      setPhase('chat');
    } catch (err) {
      addToast(err.message || 'Failed to start session');
    } finally {
      setStartingSession(false);
    }
  }, [birthForm, selectedArea, addToast]);

  // ─── Phase 3: Load an existing session ───
  const loadSession = useCallback(async (sid) => {
    try {
      const res = await api.get(`/v1/chat/sessions/${sid}`);
      const session = res.session;
      setSessionId(sid);
      setSessionInfo({
        life_area: session.life_area_key,
        max_questions: session.max_questions,
        question_count: session.question_count,
      });

      const msgs = (res.messages || []).map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        interpretationResult: m.interpretation_result,
        isVoice: m.is_voice,
        creditsConsumed: m.credits_consumed,
        followUpSuggestions: m.follow_up_suggestions,
      }));
      setMessages(msgs);

      // Set follow-ups from the last assistant message
      const lastAssistant = [...msgs].reverse().find((m) => m.role === 'assistant');
      if (lastAssistant?.followUpSuggestions) {
        setFollowUps(lastAssistant.followUpSuggestions);
      }

      if (session.status === 'ended' || session.status === 'expired') {
        setSessionEnded(true);
      } else {
        setSessionEnded(false);
        // Load templates for this life area
        try {
          const tplRes = await api.get(`/v1/chat/templates/${session.life_area_key}`);
          setTemplates(tplRes.templates || []);
        } catch {
          // templates are optional
        }
      }

      setPhase('chat');
      setHistoryOpen(false);
    } catch (err) {
      addToast(err.message || 'Failed to load session');
    }
  }, [addToast]);

  // ─── Ask a template question ───
  const handleAskTemplate = useCallback(async (template) => {
    if (sending || sessionEnded) return;

    // Add user message
    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: template.question_text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);
    setFollowUps([]);

    try {
      const res = await api.postLong(`/v1/chat/sessions/${sessionId}/ask`, {
        template_id: template.id,
        is_voice: isVoice,
      }, 60000);

      if (res.blocked) {
        const systemMsg = {
          id: `sys-${Date.now()}`,
          role: 'system',
          content: res.response?.interpretation || 'This question cannot be answered at this time.',
        };
        setMessages((prev) => [...prev, systemMsg]);
      } else {
        const assistantMsg = {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          content: res.response,
          interpretationResult: res.response,
          creditsConsumed: res.credits_consumed,
          followUpSuggestions: res.follow_up_suggestions,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setFollowUps(res.follow_up_suggestions || []);
      }

      // Update question count
      setSessionInfo((prev) => prev ? {
        ...prev,
        question_count: (prev.question_count || 0) + 1,
      } : prev);

      // Check if session hit max
      if (sessionInfo && (sessionInfo.question_count + 1) >= sessionInfo.max_questions) {
        setSessionEnded(true);
        const endMsg = {
          id: `sys-end-${Date.now()}`,
          role: 'system',
          content: 'You have reached the maximum number of questions for this session.',
        };
        setMessages((prev) => [...prev, endMsg]);
      }
    } catch (err) {
      addToast(err.message || 'Failed to send question');
      // Check for session expired
      if (err.message?.toLowerCase().includes('expired') || err.message?.toLowerCase().includes('ended')) {
        setSessionEnded(true);
      }
    } finally {
      setSending(false);
    }
  }, [sending, sessionEnded, sessionId, isVoice, sessionInfo, addToast]);

  // ─── Send a follow-up (from suggestion chip) ───
  const handleFollowUpSuggestion = useCallback(async (text) => {
    if (sending || sessionEnded || !text) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);
    setFollowUps([]);

    try {
      const res = await api.postLong(`/v1/chat/sessions/${sessionId}/follow-up`, {
        text,
        is_voice: isVoice,
      }, 60000);

      if (res.blocked) {
        const systemMsg = {
          id: `sys-${Date.now()}`,
          role: 'system',
          content: res.response?.interpretation || 'This follow-up cannot be answered at this time.',
        };
        setMessages((prev) => [...prev, systemMsg]);
      } else {
        const assistantMsg = {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          content: res.response,
          interpretationResult: res.response,
          creditsConsumed: res.credits_consumed,
          followUpSuggestions: res.follow_up_suggestions,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setFollowUps(res.follow_up_suggestions || []);
      }

      setSessionInfo((prev) => prev ? {
        ...prev,
        question_count: (prev.question_count || 0) + 1,
      } : prev);

      if (sessionInfo && (sessionInfo.question_count + 1) >= sessionInfo.max_questions) {
        setSessionEnded(true);
      }
    } catch (err) {
      addToast(err.message || 'Failed to send follow-up');
      if (err.message?.toLowerCase().includes('expired') || err.message?.toLowerCase().includes('ended')) {
        setSessionEnded(true);
      }
    } finally {
      setSending(false);
    }
  }, [sending, sessionEnded, sessionId, isVoice, sessionInfo, addToast]);

  // ─── Send custom follow-up text ───
  const handleSendFollowUp = useCallback(async (e) => {
    e.preventDefault();
    const text = followUpText.trim();
    if (text.length < 5) {
      addToast('Follow-up must be at least 5 characters');
      return;
    }
    setFollowUpText('');
    await handleFollowUpSuggestion(text);
  }, [followUpText, handleFollowUpSuggestion, addToast]);

  // ─── End session ───
  const handleEndSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      await api.post(`/v1/chat/sessions/${sessionId}/end`, {});
      setSessionEnded(true);
      loadSessions(); // refresh history
    } catch (err) {
      addToast(err.message || 'Failed to end session');
    }
  }, [sessionId, addToast, loadSessions]);

  // ─── Start new session (reset to phase 1) ───
  const handleNewSession = useCallback(() => {
    setPhase('select');
    setSessionId(null);
    setSessionInfo(null);
    setMessages([]);
    setTemplates([]);
    setFollowUps([]);
    setFollowUpText('');
    setSessionEnded(false);
    setSelectedArea(null);
    loadSessions();
  }, [loadSessions]);

  // ─── Go back from birth form to area selection ───
  const handleBackToAreas = useCallback(() => {
    setPhase('select');
    setSelectedArea(null);
  }, []);

  // ─── Computed values ───
  const questionProgress = useMemo(() => {
    if (!sessionInfo) return 0;
    return Math.min(100, ((sessionInfo.question_count || 0) / (sessionInfo.max_questions || 10)) * 100);
  }, [sessionInfo]);

  const currentAreaIcon = useMemo(() => {
    if (!sessionInfo?.life_area) return 'fa-star';
    const lk = String(sessionInfo.life_area).toLowerCase();
    for (const [substr, icon] of Object.entries(ICON_BY_KEY)) {
      if (lk.includes(substr)) return icon;
    }
    return LIFE_AREA_ICONS[sessionInfo.life_area] || 'fa-star';
  }, [sessionInfo]);

  // ─── Render ───
  return (
    <>
      <SiteHeader active="chat" />
      <div className="chat-page">
        {/* Toast notifications */}
        <div className="chat-toast-container">
          {toasts.map((t) => (
            <Toast
              key={t.id}
              message={t.message}
              type={t.type}
              onClose={() => removeToast(t.id)}
            />
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            PHASE 1 — Life Area Selector
        ═══════════════════════════════════════════════════════════════ */}
        {phase === 'select' && (
          <div className="chat-select-phase">
            <div className="chat-select-header">
              <h1 className="chat-title">AI Vedic Astrology Chat</h1>
              <p className="chat-subtitle">Select a life area to begin your personalized consultation</p>
              <div className="chat-select-actions">
                <button className="chat-history-btn" onClick={() => setHistoryOpen(true)}>
                  <i className="fas fa-history"></i> Chat History
                </button>
                {quota && (
                  <div className="chat-quota-badge">
                    <i className="fas fa-ticket-alt"></i>
                    <span>{quota.plan} Plan</span>
                  </div>
                )}
              </div>
            </div>

            {lifeAreasLoading && (
              <div className="chat-loading">
                <i className="fas fa-spinner fa-spin"></i>
                <p>Loading life areas...</p>
              </div>
            )}

            {lifeAreasError && (
              <div className="chat-error-state">
                <i className="fas fa-exclamation-triangle"></i>
                <p>{lifeAreasError}</p>
                <button onClick={() => window.location.reload()}>
                  <i className="fas fa-redo"></i> Retry
                </button>
              </div>
            )}

            {!lifeAreasLoading && !lifeAreasError && (
              <div className="chat-life-areas-grid">
                {lifeAreas.map((area) => (
                  <button
                    key={area.key}
                    className="chat-area-card"
                    onClick={() => handleSelectArea(area)}
                  >
                    <div className="chat-area-icon">
                      <i className={`fas ${resolveIcon(area)}`}></i>
                    </div>
                    <div className="chat-area-info">
                      <h3>{area.name}</h3>
                      <p>{area.description}</p>
                    </div>
                    <div className="chat-area-cta">
                      <span>Start Chat <i className="fas fa-arrow-right"></i></span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            PHASE 2 — Birth Data Form
        ═══════════════════════════════════════════════════════════════ */}
        {phase === 'birth' && selectedArea && (
          <div className="chat-birth-phase">
            <div className="chat-birth-header">
              <button className="chat-back-btn" onClick={handleBackToAreas}>
                <i className="fas fa-arrow-left"></i> Back
              </button>
              <div className="chat-birth-area-info">
                <i className={`fas ${resolveIcon(selectedArea)}`}></i>
                <span>{selectedArea.name}</span>
              </div>
            </div>

            <div className="chat-birth-form">
              <h2>Enter Birth Details</h2>
              <p className="chat-birth-desc">
                Provide your birth information for an accurate Vedic astrology consultation.
              </p>

              <form onSubmit={handleStartSession}>
                <div className="chat-form-row">
                  <div className="chat-form-group">
                    <label htmlFor="chat-name">Name</label>
                    <input
                      id="chat-name"
                      type="text"
                      name="user_name"
                      value={birthForm.user_name}
                      onChange={handleBirthChange}
                      placeholder="Your name"
                    />
                  </div>
                </div>

                <div className="chat-form-row">
                  <div className="chat-form-group">
                    <label htmlFor="chat-dob">Date of Birth *</label>
                    <input
                      id="chat-dob"
                      type="date"
                      name="dob"
                      value={birthForm.dob}
                      onChange={handleBirthChange}
                      required
                    />
                  </div>
                </div>

                <div className="chat-form-row chat-form-row-2col">
                  <div className="chat-form-group">
                    <label htmlFor="chat-tob-h">Hour (0-23) *</label>
                    <input
                      id="chat-tob-h"
                      type="number"
                      name="tob_h"
                      min="0"
                      max="23"
                      value={birthForm.tob_h}
                      onChange={handleBirthChange}
                      placeholder="e.g. 14"
                      required
                    />
                  </div>
                  <div className="chat-form-group">
                    <label htmlFor="chat-tob-m">Minute (0-59) *</label>
                    <input
                      id="chat-tob-m"
                      type="number"
                      name="tob_m"
                      min="0"
                      max="59"
                      value={birthForm.tob_m}
                      onChange={handleBirthChange}
                      placeholder="e.g. 30"
                      required
                    />
                  </div>
                </div>

                <div className="chat-form-row">
                  <div className="chat-form-group">
                    <label htmlFor="chat-place">Place of Birth *</label>
                    <input
                      id="chat-place"
                      type="text"
                      name="place_of_birth"
                      value={birthForm.place_of_birth}
                      onChange={handleBirthChange}
                      placeholder="e.g. Mumbai, India"
                      required
                    />
                  </div>
                </div>

                <div className="chat-form-row chat-form-row-2col">
                  <div className="chat-form-group">
                    <label htmlFor="chat-lat">Latitude *</label>
                    <input
                      id="chat-lat"
                      type="number"
                      step="any"
                      name="lat"
                      value={birthForm.lat}
                      onChange={handleBirthChange}
                      placeholder="e.g. 19.076"
                      required
                    />
                  </div>
                  <div className="chat-form-group">
                    <label htmlFor="chat-lon">Longitude *</label>
                    <input
                      id="chat-lon"
                      type="number"
                      step="any"
                      name="lon"
                      value={birthForm.lon}
                      onChange={handleBirthChange}
                      placeholder="e.g. 72.877"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="chat-start-btn"
                  disabled={startingSession}
                >
                  {startingSession ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Starting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-comments"></i> Start Consultation
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            PHASE 3 — Active Chat
        ═══════════════════════════════════════════════════════════════ */}
        {phase === 'chat' && sessionId && (
          <div className="chat-session-container">
            {/* ── Chat Header ── */}
            <div className="chat-header">
              <div className="chat-header-left">
                <div className="chat-header-icon">
                  <i className={`fas ${currentAreaIcon}`}></i>
                </div>
                <div className="chat-header-info">
                  <span className="chat-header-area">{sessionInfo?.life_area || 'Chat'}</span>
                  <span className="chat-header-count">
                    {sessionInfo?.question_count || 0}/{sessionInfo?.max_questions || 10} questions
                  </span>
                </div>
              </div>

              <div className="chat-header-right">
                {/* Voice toggle */}
                <div className="chat-voice-toggle-wrapper">
                  <button
                    className={`chat-voice-toggle ${isVoice ? 'active' : ''}`}
                    onClick={() => setIsVoice(!isVoice)}
                    title={isVoice ? 'Voice mode ON (2x credits)' : 'Voice mode OFF'}
                  >
                    <i className={`fas ${isVoice ? 'fa-microphone' : 'fa-microphone-slash'}`}></i>
                  </button>
                  {isVoice && <span className="chat-voice-label">2x credits</span>}
                </div>

                {/* History */}
                <button className="chat-header-action" onClick={() => setHistoryOpen(true)} title="Chat History">
                  <i className="fas fa-history"></i>
                </button>

                {/* End session */}
                {!sessionEnded && (
                  <button className="chat-end-btn" onClick={handleEndSession} title="End Session">
                    <i className="fas fa-stop-circle"></i> End
                  </button>
                )}
              </div>
            </div>

            {/* ── Progress bar ── */}
            <div className="chat-progress-bar">
              <div
                className="chat-progress-fill"
                style={{ width: `${questionProgress}%` }}
              ></div>
            </div>

            {/* ── Message list ── */}
            <div className="chat-messages" ref={messageListRef}>
              {messages.length === 0 && !sending && !sessionEnded && (
                <div className="chat-welcome">
                  <i className={`fas ${currentAreaIcon}`}></i>
                  <h3>Welcome to your consultation</h3>
                  <p>Choose a question from the templates below, or type your own follow-up after the first response.</p>
                </div>
              )}

              {messages.map((msg) => {
                if (msg.role === 'user') {
                  return (
                    <div key={msg.id} className="chat-message user">
                      <div className="chat-bubble user">
                        <p>{msg.content}</p>
                        {msg.isVoice && (
                          <span className="chat-voice-badge">
                            <i className="fas fa-microphone"></i>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }

                if (msg.role === 'system') {
                  return (
                    <div key={msg.id} className="chat-message system">
                      <div className="chat-bubble system">
                        <i className="fas fa-info-circle"></i>
                        <span>{msg.content}</span>
                      </div>
                    </div>
                  );
                }

                // assistant
                return (
                  <div key={msg.id} className="chat-message assistant">
                    <div className="chat-bubble assistant">
                      <AssistantMessageContent
                        content={msg.content}
                        interpretationResult={msg.interpretationResult}
                      />
                      {msg.creditsConsumed != null && (
                        <span className="chat-credits-badge">
                          <i className="fas fa-coins"></i> {msg.creditsConsumed} credit{msg.creditsConsumed !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {sending && <TypingIndicator />}

              {/* Session ended summary */}
              {sessionEnded && (
                <div className="chat-session-summary">
                  <div className="chat-summary-icon">
                    <i className="fas fa-check-circle"></i>
                  </div>
                  <h3>Session Complete</h3>
                  <p>
                    You asked {sessionInfo?.question_count || 0} questions during this
                    {' '}{sessionInfo?.life_area || ''} consultation.
                  </p>
                  <button className="chat-new-session-btn" onClick={handleNewSession}>
                    <i className="fas fa-plus-circle"></i> Start New Session
                  </button>
                </div>
              )}

              <div ref={messagesEndRef}></div>
            </div>

            {/* ── Follow-up suggestions ── */}
            {followUps.length > 0 && !sessionEnded && !sending && (
              <div className="chat-follow-ups">
                {followUps.map((fu, i) => (
                  <button
                    key={i}
                    className="chat-followup-chip"
                    onClick={() => handleFollowUpSuggestion(typeof fu === 'string' ? fu : fu.text || fu.question)}
                    disabled={sending}
                  >
                    <i className="fas fa-reply"></i>
                    {typeof fu === 'string' ? fu : fu.text || fu.question}
                  </button>
                ))}
              </div>
            )}

            {/* ── Template bar ── */}
            {templates.length > 0 && !sessionEnded && (
              <div className="chat-template-bar">
                <div className="chat-template-scroll">
                  {templates.map((tpl) => (
                    <button
                      key={tpl.id}
                      className="chat-template-chip"
                      onClick={() => handleAskTemplate(tpl)}
                      disabled={sending}
                      title={`${tpl.credit_cost} credit${tpl.credit_cost !== 1 ? 's' : ''}`}
                    >
                      <span className="chat-template-text">{tpl.question_text}</span>
                      <span className="chat-template-cost">
                        <i className="fas fa-coins"></i> {tpl.credit_cost}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Custom follow-up input ── */}
            {!sessionEnded && messages.length > 0 && (
              <div className="chat-input-bar">
                <form onSubmit={handleSendFollowUp} className="chat-input-form">
                  <input
                    ref={followUpInputRef}
                    type="text"
                    className="chat-input"
                    value={followUpText}
                    onChange={(e) => setFollowUpText(e.target.value)}
                    placeholder="Type a follow-up question (min 5 chars)..."
                    disabled={sending}
                    minLength={5}
                  />
                  <button
                    type="submit"
                    className="chat-send-btn"
                    disabled={sending || followUpText.trim().length < 5}
                  >
                    <i className="fas fa-paper-plane"></i>
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ── Session History Panel ── */}
        <SessionHistoryPanel
          sessions={sessions}
          onSelect={loadSession}
          onClose={() => setHistoryOpen(false)}
          visible={historyOpen}
        />
      </div>
    </>
  );
}
