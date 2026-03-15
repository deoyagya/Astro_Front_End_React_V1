import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import EmbeddedCheckoutModal from '../components/EmbeddedCheckoutModal';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import '../styles/ask-question.css';

const PRICE_PER_QUESTION = 500; // cents
const PAGE_SIZE = 5;

export default function AskQuestionPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Catalog state
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dropdown selection state
  const [selectedThemeId, setSelectedThemeId] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Selection state
  const [selectedQuestions, setSelectedQuestions] = useState([]);

  // Order state
  const [ordering, setOrdering] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  // Drag state
  const [draggedQuestion, setDraggedQuestion] = useState(null);

  // Fetch catalog on mount
  useEffect(() => {
    api.get('/v1/questions/browse')
      .then((data) => {
        setCatalog(data.themes || []);
        if (data.themes?.length > 0) {
          setSelectedThemeId(data.themes[0].id);
          if (data.themes[0].life_areas?.length > 0) {
            setSelectedAreaId(data.themes[0].life_areas[0].id);
          }
        }
      })
      .catch((err) => setError(err.message || 'Failed to load questions'))
      .finally(() => setLoading(false));
  }, []);

  // Derived: selected theme object
  const selectedTheme = useMemo(
    () => catalog.find((t) => t.id === selectedThemeId) || null,
    [catalog, selectedThemeId]
  );

  // Derived: life areas for selected theme
  const lifeAreas = useMemo(
    () => selectedTheme?.life_areas || [],
    [selectedTheme]
  );

  // Derived: selected life area object
  const selectedArea = useMemo(
    () => lifeAreas.find((la) => la.id === selectedAreaId) || null,
    [lifeAreas, selectedAreaId]
  );

  // Build flat list of all questions for search
  const allQuestions = useMemo(() => {
    const flat = [];
    for (const theme of catalog) {
      for (const la of theme.life_areas) {
        for (const q of la.questions) {
          flat.push({ ...q, lifeArea: la, theme });
        }
      }
    }
    return flat;
  }, [catalog]);

  // Derived: visible questions (filtered, not selected, paginated)
  const { visibleQuestions, totalFiltered, totalPages } = useMemo(() => {
    let source;
    const query = searchQuery.trim().toLowerCase();

    if (query) {
      // Search across ALL questions regardless of dropdown
      source = allQuestions.filter(
        (q) =>
          !selectedQuestions.some((sq) => sq.id === q.id) &&
          (q.text.toLowerCase().includes(query) ||
            q.display_id.toLowerCase().includes(query) ||
            q.lifeArea.name.toLowerCase().includes(query) ||
            q.theme.name.toLowerCase().includes(query))
      );
    } else if (selectedArea) {
      // Filter by dropdown selections
      source = (selectedArea.questions || [])
        .filter((q) => !selectedQuestions.some((sq) => sq.id === q.id))
        .map((q) => ({ ...q, lifeArea: selectedArea, theme: selectedTheme }));
    } else {
      source = [];
    }

    const total = source.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const start = (currentPage - 1) * PAGE_SIZE;
    const visible = source.slice(start, start + PAGE_SIZE);

    return { visibleQuestions: visible, totalFiltered: total, totalPages: pages };
  }, [searchQuery, allQuestions, selectedArea, selectedTheme, selectedQuestions, currentPage]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedThemeId, selectedAreaId]);

  // Check if a question is already selected
  const isSelected = useCallback(
    (qId) => selectedQuestions.some((q) => q.id === qId),
    [selectedQuestions]
  );

  // Add a question to the cart
  const addQuestion = useCallback((question, lifeArea, theme) => {
    if (selectedQuestions.some((q) => q.id === question.id)) return;
    if (selectedQuestions.length >= 25) {
      setOrderError('Maximum 25 questions per order');
      return;
    }
    setSelectedQuestions((prev) => [
      ...prev,
      {
        id: question.id,
        displayId: question.display_id,
        text: question.text,
        lifeArea: lifeArea.name,
        lifeAreaId: lifeArea.id,
        theme: theme.name,
        themeId: theme.id,
        priceCents: question.cost_cents || PRICE_PER_QUESTION,
      },
    ]);
    setOrderError('');
  }, [selectedQuestions]);

  // Remove a question from the cart
  const removeQuestion = useCallback((qId) => {
    setSelectedQuestions((prev) => prev.filter((q) => q.id !== qId));
    setOrderError('');
  }, []);

  // Clear all
  const clearAll = useCallback(() => {
    setSelectedQuestions([]);
    setOrderError('');
  }, []);

  // Calculate totals
  const totalCents = selectedQuestions.reduce((sum, q) => sum + q.priceCents, 0);
  const totalDollars = (totalCents / 100).toFixed(2);

  // Group selected questions by theme for display
  const groupedByTheme = selectedQuestions.reduce((acc, q) => {
    if (!acc[q.theme]) acc[q.theme] = [];
    acc[q.theme].push(q);
    return acc;
  }, {});

  // Drag handlers
  const handleDragStart = (e, question, lifeArea, theme) => {
    setDraggedQuestion({ question, lifeArea, theme });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', question.id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (draggedQuestion) {
      addQuestion(draggedQuestion.question, draggedQuestion.lifeArea, draggedQuestion.theme);
      setDraggedQuestion(null);
    }
  };

  // Handle theme change
  const handleThemeChange = (themeId) => {
    setSelectedThemeId(themeId);
    const theme = catalog.find((t) => t.id === themeId);
    if (theme?.life_areas?.length > 0) {
      setSelectedAreaId(theme.life_areas[0].id);
    } else {
      setSelectedAreaId('');
    }
  };

  // Place Order
  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/ask-question' } } });
      return;
    }

    if (selectedQuestions.length === 0) {
      setOrderError('Please select at least one question');
      return;
    }

    setOrdering(true);
    setOrderError('');

    try {
      const result = await api.post('/v1/questions/create-order', {
        question_ids: selectedQuestions.map((q) => q.id),
        gateway: 'stripe',
      });

      if (result.client_secret) {
        // Open Stripe Embedded Checkout modal
        setClientSecret(result.client_secret);
      } else {
        setOrderError('Unable to initiate payment. Please try again.');
      }
    } catch (err) {
      setOrderError(err.message || 'Failed to create order');
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <PageShell activeNav="consult">
        <div className="aq-loading">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading questions...</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell activeNav="consult">
      <div className="aq-page">
        {/* ---- Header ---- */}
        <div className="aq-header">
          <h1><i className="fas fa-question-circle"></i> Ask a Question</h1>
          <p>Select questions from any life area. Mix and match across themes for a personalized reading.</p>
        </div>

        {error && (
          <div className="aq-error-banner">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        <div className="aq-split">
          {/* ---- LEFT: Question Browser ---- */}
          <div className="aq-browser">
            <div className="aq-browser-header">
              <h2><i className="fas fa-list-alt"></i> Question Library</h2>
              <span className="aq-badge">{allQuestions.length} questions</span>
            </div>

            {/* Search Bar */}
            <div className="aq-search-bar">
              <i className="fas fa-search aq-search-icon"></i>
              <input
                type="text"
                className="aq-search-input"
                placeholder="Search questions across all themes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="aq-search-clear" onClick={() => setSearchQuery('')}>
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>

            {/* Dropdown Filters (hidden when searching) */}
            {!searchQuery && (
              <div className="aq-dropdowns">
                <div className="aq-dropdown-group">
                  <label className="aq-dropdown-label">Theme</label>
                  <select
                    className="aq-dropdown"
                    value={selectedThemeId}
                    onChange={(e) => handleThemeChange(e.target.value)}
                  >
                    {catalog.map((theme) => (
                      <option key={theme.id} value={theme.id}>
                        {theme.name} ({theme.life_area_count} areas)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="aq-dropdown-group">
                  <label className="aq-dropdown-label">Life Area</label>
                  <select
                    className="aq-dropdown"
                    value={selectedAreaId}
                    onChange={(e) => setSelectedAreaId(e.target.value)}
                  >
                    {lifeAreas.map((la) => (
                      <option key={la.id} value={la.id}>
                        {la.name} ({la.question_count}q)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Questions List (paginated) */}
            <div className="aq-questions-list">
              {searchQuery && (
                <div className="aq-search-results-info">
                  Showing {totalFiltered} result{totalFiltered !== 1 ? 's' : ''} for "{searchQuery}"
                </div>
              )}

              {visibleQuestions.length === 0 ? (
                <div className="aq-no-questions">
                  <i className="fas fa-inbox"></i>
                  <p>{searchQuery ? 'No questions match your search' : 'No questions available'}</p>
                </div>
              ) : (
                visibleQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="aq-question-card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, q, q.lifeArea, q.theme)}
                  >
                    <div className="aq-q-text">
                      <span className="aq-q-id">{q.display_id}</span>
                      {q.text}
                      {searchQuery && (
                        <span className="aq-q-source">{q.lifeArea.name}</span>
                      )}
                    </div>
                    <div className="aq-q-actions">
                      <span className="aq-q-price">${(q.cost_cents / 100).toFixed(2)}</span>
                      <button
                        className="aq-add-btn"
                        onClick={() => addQuestion(q, q.lifeArea, q.theme)}
                        title="Add to order"
                      >
                        <i className="fas fa-plus"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="aq-pagination">
                  <button
                    className="aq-page-btn"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    <i className="fas fa-chevron-left"></i> Prev
                  </button>
                  <span className="aq-page-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className="aq-page-btn"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Next <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ---- RIGHT: Drop Zone / Cart ---- */}
          <div
            className={`aq-cart ${draggedQuestion ? 'aq-cart-drag-active' : ''}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="aq-cart-header">
              <h2><i className="fas fa-shopping-cart"></i> Your Questions</h2>
              {selectedQuestions.length > 0 && (
                <div className="aq-cart-header-right">
                  <div className="aq-cart-total-badge">
                    <span className="aq-cart-total-badge-amount">${totalDollars}</span>
                  </div>
                  <button className="aq-clear-btn" onClick={clearAll}>
                    <i className="fas fa-trash-alt"></i> Clear All
                  </button>
                </div>
              )}
            </div>

            {selectedQuestions.length === 0 ? (
              <div className="aq-cart-empty">
                <i className="fas fa-hand-pointer"></i>
                <h3>Drag questions here</h3>
                <p>Or click the <strong>+</strong> button next to any question to add it</p>
                <p className="aq-cart-hint">You can select questions from multiple life areas</p>
              </div>
            ) : (
              <>
                <div className="aq-cart-items">
                  {Object.entries(groupedByTheme).map(([themeName, questions]) => (
                    <div key={themeName} className="aq-cart-group">
                      <div className="aq-cart-group-header">
                        <span>{themeName}</span>
                        <span className="aq-cart-group-count">{questions.length}</span>
                      </div>
                      {questions.map((q) => (
                        <div key={q.id} className="aq-cart-item">
                          <div className="aq-cart-item-info">
                            <span className="aq-cart-item-area">{q.lifeArea}</span>
                            <span className="aq-cart-item-text">{q.text}</span>
                          </div>
                          <div className="aq-cart-item-actions">
                            <span className="aq-cart-item-price">${(q.priceCents / 100).toFixed(2)}</span>
                            <button
                              className="aq-remove-btn"
                              onClick={() => removeQuestion(q.id)}
                              title="Remove"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Cost Calculator */}
                <div className="aq-calculator">
                  <div className="aq-calc-row">
                    <span>Questions</span>
                    <span>{selectedQuestions.length}</span>
                  </div>
                  <div className="aq-calc-row">
                    <span>Price per question</span>
                    <span>$5.00</span>
                  </div>
                  <div className="aq-calc-divider"></div>
                  <div className="aq-calc-row aq-calc-total">
                    <span>Total</span>
                    <span>${totalDollars}</span>
                  </div>
                </div>

                {orderError && (
                  <div className="aq-order-error">
                    <i className="fas fa-exclamation-triangle"></i> {orderError}
                  </div>
                )}

                <button
                  className="aq-order-btn"
                  onClick={handlePlaceOrder}
                  disabled={ordering || selectedQuestions.length === 0}
                >
                  {ordering ? (
                    <><i className="fas fa-spinner fa-spin"></i> Processing...</>
                  ) : (
                    <><i className="fas fa-lock"></i> Place Order — ${totalDollars}</>
                  )}
                </button>

                <p className="aq-secure-note">
                  <i className="fas fa-shield-alt"></i> Secure payment via Stripe. Your answers will be generated using AI-powered Vedic astrology analysis.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stripe Embedded Checkout Modal */}
      {clientSecret && (
        <EmbeddedCheckoutModal
          clientSecret={clientSecret}
          onClose={() => setClientSecret('')}
        />
      )}
    </PageShell>
  );
}
