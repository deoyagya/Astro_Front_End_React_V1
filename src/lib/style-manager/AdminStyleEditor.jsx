/**
 * AdminStyleEditor — Reusable admin page for editing UI style overrides.
 *
 * Accepts all dependencies via props — no app-specific imports.
 *
 * Props:
 *   registry      — SCREEN_STYLE_REGISTRY object
 *   apiGet        — (screenKey) => Promise<{ style_overrides }>
 *   apiPut        — (screenKey, body) => Promise
 *   apiDelete     — (screenKey) => Promise
 *   refreshStyles — () => Promise  (refreshes the global StyleProvider)
 *
 * @module lib/style-manager/AdminStyleEditor
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ElementCard } from './ElementCard';
import { GenericPreview } from './GenericPreview';
import './style-manager.css';

/* ── Helpers ─────────────────────────────────────────────── */

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function getScreenDefaults(registry, screenKey) {
  const screen = registry[screenKey];
  if (!screen) return {};
  const map = {};
  for (const cat of screen.categories) {
    for (const el of cat.elements) {
      map[el.key] = { ...el.defaults };
    }
  }
  return map;
}

function mergeStyles(defaults, overrides) {
  const merged = clone(defaults);
  for (const [key, vals] of Object.entries(overrides || {})) {
    if (merged[key]) {
      merged[key] = { ...merged[key], ...vals };
    } else {
      merged[key] = { ...vals };
    }
  }
  return merged;
}

/* ── Screen Grouping ─────────────────────────────────────── */

const SCREEN_GROUP_ORDER = [
  'Public',
  'User Tools',
  'Reports',
  'User Account',
  'My Data',
  'Admin',
  'Global Components',
];

function groupScreens(registry) {
  const groups = {};
  for (const [key, screen] of Object.entries(registry)) {
    const group = screen.group || 'Other';
    if (!groups[group]) groups[group] = [];
    groups[group].push({ key, label: screen.label, icon: screen.icon });
  }
  // Return in defined order, then any extras
  const ordered = [];
  for (const g of SCREEN_GROUP_ORDER) {
    if (groups[g]) {
      ordered.push({ group: g, screens: groups[g] });
      delete groups[g];
    }
  }
  for (const [g, screens] of Object.entries(groups)) {
    ordered.push({ group: g, screens });
  }
  return ordered;
}

/* ── Main Component ─────────────────────────────────────── */

export function AdminStyleEditor({ registry, apiGet, apiPut, apiDelete, refreshStyles }) {
  const screenKeys = useMemo(() => Object.keys(registry), [registry]);
  const screenGroups = useMemo(() => groupScreens(registry), [registry]);

  const [screenKey, setScreenKey] = useState(screenKeys[0] || '');
  const [localOverrides, setLocalOverrides] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [expandedCats, setExpandedCats] = useState({});

  const screen = registry[screenKey];
  const defaults = useMemo(() => getScreenDefaults(registry, screenKey), [registry, screenKey]);
  const effective = useMemo(() => mergeStyles(defaults, localOverrides), [defaults, localOverrides]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 4000);
  }, []);

  // Load existing overrides from backend when screen changes
  useEffect(() => {
    if (!screenKey) return;
    (async () => {
      try {
        const data = await apiGet(screenKey);
        setLocalOverrides(data.style_overrides || {});
      } catch {
        setLocalOverrides({});
      }
    })();
  }, [screenKey, apiGet]);

  // Expand all categories by default
  useEffect(() => {
    if (!screen) return;
    const initial = {};
    screen.categories.forEach((cat) => { initial[cat.name] = true; });
    setExpandedCats(initial);
  }, [screen]);

  const handlePropertyChange = useCallback((elementKey, propKey, value) => {
    setLocalOverrides((prev) => {
      const next = clone(prev);
      if (!next[elementKey]) next[elementKey] = {};
      next[elementKey][propKey] = value;
      return next;
    });
  }, []);

  const handleSave = async () => {
    if (!screenKey || !screen) return;
    setSaving(true);
    try {
      await apiPut(screenKey, {
        label: screen.label,
        style_overrides: localOverrides,
      });
      if (refreshStyles) await refreshStyles();
      showToast('Styles saved successfully!');
    } catch (err) {
      showToast(err.message || 'Failed to save styles', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!screenKey) return;
    if (typeof window !== 'undefined' && !window.confirm('Reset all styles to defaults? This cannot be undone.')) return;
    try {
      await apiDelete(screenKey);
      setLocalOverrides({});
      if (refreshStyles) await refreshStyles();
      showToast('Styles reset to defaults');
    } catch {
      setLocalOverrides({});
      showToast('Styles reset to defaults');
    }
  };

  const toggleCategory = (name) => {
    setExpandedCats((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const hasOverrides = Object.keys(localOverrides).length > 0;

  return (
    <div>
      <h1 className="sm-page-title"><i className="fas fa-palette" /> Style Manager</h1>
      <p className="sm-subtitle">
        Select a screen, customise element styles, preview live, then save.
      </p>

      {/* Screen selector + actions */}
      <div className="sm-toolbar">
        <div className="sm-screen-select-wrap">
          <label className="sm-toolbar-label">Screen:</label>
          <select
            value={screenKey}
            onChange={(e) => { setScreenKey(e.target.value); setLocalOverrides({}); }}
            className="sm-screen-select"
          >
            {screenGroups.map((g) => (
              <optgroup key={g.group} label={g.group}>
                {g.screens.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="sm-toolbar-actions">
          <button onClick={handleSave} disabled={saving} className="sm-btn sm-btn-save">
            <i className="fas fa-save" /> {saving ? 'Saving...' : 'Save Styles'}
          </button>
          <button onClick={handleReset} className="sm-btn sm-btn-reset" disabled={!hasOverrides}>
            <i className="fas fa-undo" /> Reset to Defaults
          </button>
        </div>
      </div>

      {/* Two-column layout: controls + preview */}
      {screen && (
        <div className="sm-layout">
          {/* Left: element controls */}
          <div className="sm-controls-panel">
            {screen.categories.map((cat) => (
              <div key={cat.name} className="sm-category">
                <button
                  className="sm-category-header"
                  onClick={() => toggleCategory(cat.name)}
                >
                  <i className={`fas fa-chevron-${expandedCats[cat.name] ? 'down' : 'right'}`} />
                  <span>{cat.name}</span>
                  <span className="sm-cat-count">{cat.elements.length}</span>
                </button>
                {expandedCats[cat.name] && (
                  <div className="sm-category-body">
                    {cat.elements.map((el) => (
                      <ElementCard
                        key={el.key}
                        element={el}
                        effectiveStyle={effective[el.key] || el.defaults}
                        onPropertyChange={handlePropertyChange}
                        isOverridden={!!localOverrides[el.key]}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right: live preview */}
          <GenericPreview screen={screen} styles={effective} />
        </div>
      )}

      {/* Toast */}
      {toast.message && (
        <div
          className={`sm-toast ${toast.type === 'error' ? 'sm-toast-error' : 'sm-toast-success'}`}
          onClick={() => setToast({ message: '', type: 'success' })}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
