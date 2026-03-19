import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { api } from '../../api/client';
import {
  ENUM_SOURCES,
  PRIMITIVE_PARAM_SPECS,
  PRIMITIVE_CATEGORIES,
  extractDataFieldTags,
} from '../../config/ruleBuilderConfig';
import '../../styles/admin.css';
import '../../styles/rule-builder.css';
import { useStyles } from '../../context/StyleContext';

// ---------------------------------------------------------------------------
// Helpers — unique ID
// ---------------------------------------------------------------------------
let _idCounter = 0;
const uid = () => `n_${++_idCounter}_${Date.now().toString(36)}`;

// ---------------------------------------------------------------------------
// Tree Model constructors
// ---------------------------------------------------------------------------
function createEmptyCondition() {
  return { id: uid(), nodeType: 'condition', primitiveType: '', params: {}, negated: false };
}

function createDefaultGroup(logic = 'AND') {
  return { id: uid(), nodeType: 'group', logic, children: [createEmptyCondition()] };
}

// ---------------------------------------------------------------------------
// Pure immutable tree operations
// ---------------------------------------------------------------------------
function _mapTree(node, targetId, fn) {
  if (node.id === targetId) return fn(node);
  if (node.nodeType === 'group') {
    return { ...node, children: node.children.map(c => _mapTree(c, targetId, fn)) };
  }
  return node;
}

function addConditionToGroup(tree, groupId) {
  return _mapTree(tree, groupId, n => ({
    ...n, children: [...n.children, createEmptyCondition()],
  }));
}

function addGroupToGroup(tree, parentGroupId) {
  return _mapTree(tree, parentGroupId, n => ({
    ...n, children: [...n.children, createDefaultGroup(n.logic === 'AND' ? 'OR' : 'AND')],
  }));
}

function removeNode(tree, nodeId) {
  if (tree.id === nodeId) return null;
  if (tree.nodeType === 'group') {
    const filtered = tree.children.map(c => removeNode(c, nodeId)).filter(Boolean);
    return { ...tree, children: filtered };
  }
  return tree;
}

function duplicateNode(tree, nodeId) {
  function _deepClone(n) {
    if (n.nodeType === 'group') {
      return { ...n, id: uid(), children: n.children.map(_deepClone) };
    }
    return { ...n, id: uid() };
  }
  if (tree.nodeType === 'group') {
    const newChildren = [];
    for (const c of tree.children) {
      newChildren.push(c.id === nodeId ? c : c);
      if (c.id === nodeId) newChildren.push(_deepClone(c));
      if (c.nodeType === 'group' && c.id !== nodeId) {
        // recurse
        const updated = duplicateNode(c, nodeId);
        if (updated !== c) { newChildren[newChildren.length - 1] = updated; }
      }
    }
    // Check if duplicate was inserted here
    if (newChildren.length > tree.children.length) {
      return { ...tree, children: newChildren };
    }
    // Otherwise recurse deeper
    return { ...tree, children: tree.children.map(c => c.nodeType === 'group' ? duplicateNode(c, nodeId) : c) };
  }
  return tree;
}

function toggleGroupLogic(tree, groupId) {
  return _mapTree(tree, groupId, n => ({
    ...n, logic: n.logic === 'AND' ? 'OR' : 'AND',
  }));
}

function toggleNot(tree, conditionId) {
  return _mapTree(tree, conditionId, n => ({ ...n, negated: !n.negated }));
}

function updatePrimitiveType(tree, condId, newType) {
  // Build default params from spec
  const spec = PRIMITIVE_PARAM_SPECS[newType];
  const defaults = {};
  if (spec) {
    Object.entries(spec.params).forEach(([k, p]) => {
      if (p.default !== undefined) defaults[k] = p.default;
      else if (p.multi) defaults[k] = [];
      else if (p.type === 'boolean') defaults[k] = true;
      else if (p.type === 'number') defaults[k] = '';
      else defaults[k] = '';
    });
  }
  return _mapTree(tree, condId, n => ({ ...n, primitiveType: newType, params: defaults }));
}

function updateParam(tree, condId, paramName, value) {
  return _mapTree(tree, condId, n => ({
    ...n, params: { ...n.params, [paramName]: value },
  }));
}

// ---------------------------------------------------------------------------
// Tree → RDL JSON (backend format)
// ---------------------------------------------------------------------------
function treeToRdlJson(tree) {
  if (!tree) return null;
  if (tree.nodeType === 'condition') {
    if (!tree.primitiveType) return null;
    const spec = PRIMITIVE_PARAM_SPECS[tree.primitiveType];
    const base = { type: tree.primitiveType };
    // Copy params, skip empty
    if (spec) {
      Object.entries(spec.params).forEach(([k, pSpec]) => {
        const v = tree.params[k];
        if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) return;
        if (pSpec.type === 'number' && v !== '') base[k] = Number(v);
        else base[k] = v;
      });
    }
    if (tree.negated) {
      return { type: 'NOT', sub_rules: [base] };
    }
    return base;
  }
  if (tree.nodeType === 'group') {
    const subs = tree.children.map(treeToRdlJson).filter(Boolean);
    if (subs.length === 0) return null;
    if (subs.length === 1) return subs[0];
    return { type: tree.logic, sub_rules: subs };
  }
  return null;
}

// ---------------------------------------------------------------------------
// RDL JSON → Tree (parse existing rules)
// ---------------------------------------------------------------------------
function rdlJsonToTree(json) {
  if (!json || typeof json !== 'object') return createDefaultGroup();
  const t = json.type;
  if (t === 'AND' || t === 'OR') {
    return {
      id: uid(), nodeType: 'group', logic: t,
      children: (json.sub_rules || []).map(rdlJsonToTree),
    };
  }
  if (t === 'NOT') {
    const inner = (json.sub_rules || [])[0];
    if (inner) {
      const child = rdlJsonToTree(inner);
      if (child.nodeType === 'condition') {
        return { ...child, negated: true };
      }
      // NOT wrapping a group — create a condition-like wrapper
      return { ...child, negated: true };
    }
    return createEmptyCondition();
  }
  // Primitive condition
  const spec = PRIMITIVE_PARAM_SPECS[t];
  const params = {};
  if (spec) {
    Object.entries(spec.params).forEach(([k, pSpec]) => {
      if (json[k] !== undefined) {
        params[k] = json[k];
      } else if (pSpec.multi) {
        params[k] = [];
      } else if (pSpec.type === 'boolean') {
        params[k] = pSpec.default !== undefined ? pSpec.default : true;
      } else {
        params[k] = pSpec.default !== undefined ? pSpec.default : '';
      }
    });
  }
  return { id: uid(), nodeType: 'condition', primitiveType: t, params, negated: false };
}

// ---------------------------------------------------------------------------
// Count helpers
// ---------------------------------------------------------------------------
function countNodes(tree) {
  let conditions = 0, groups = 0;
  function _walk(n) {
    if (!n) return;
    if (n.nodeType === 'condition') conditions++;
    if (n.nodeType === 'group') { groups++; n.children.forEach(_walk); }
  }
  _walk(tree);
  return { conditions, groups };
}

// ---------------------------------------------------------------------------
// Grouped primitives for optgroups
// ---------------------------------------------------------------------------
const GROUPED_PRIMITIVES = PRIMITIVE_CATEGORIES.map(cat => ({
  ...cat,
  primitives: Object.entries(PRIMITIVE_PARAM_SPECS)
    .filter(([, spec]) => spec.category === cat.id)
    .map(([key, spec]) => ({ key, label: key.replace(/_/g, ' '), description: spec.description })),
})).filter(g => g.primitives.length > 0);

// ===================================================================
// Main Component
// ===================================================================
export default function AdminRuleBuilderPage() {
  const { getOverride } = useStyles('admin-rule-builder');
  const navigate = useNavigate();

  // ── Repository state ──
  const [domains, setDomains] = useState([]);
  const [subdomains, setSubdomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedSubdomain, setSelectedSubdomain] = useState('');
  const [subdomainData, setSubdomainData] = useState(null);
  const [selectedRepoRuleId, setSelectedRepoRuleId] = useState('');
  const [repoRuleMeta, setRepoRuleMeta] = useState({
    rule_id: '',
    description: '',
    weight: '',
    lock: 'natal',
    category: '',
    tradition: '',
  });
  const [repoMetadata, setRepoMetadata] = useState({
    version: '',
    author: '',
    primary_tradition: '',
  });

  // ── Taxonomy state ──
  const [themes, setThemes] = useState([]);
  const [lifeAreas, setLifeAreas] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [questionObj, setQuestionObj] = useState(null);

  // ── Rule tree ──
  const [ruleTree, setRuleTree] = useState(createDefaultGroup());

  // ── UI state ──
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [jsonPreviewOpen, setJsonPreviewOpen] = useState(false);

  // ── Derived ──
  const ruleJson = useMemo(() => treeToRdlJson(ruleTree), [ruleTree]);
  const dataFieldTags = useMemo(() => extractDataFieldTags(ruleJson), [ruleJson]);
  const { conditions: condCount, groups: grpCount } = useMemo(() => countNodes(ruleTree), [ruleTree]);

  // ── Toast auto-dismiss ──
  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }
  }, [toast]);

  // ── Load themes ──
  const loadThemes = useCallback(async () => {
    try {
      const data = await api.get('/v1/admin/taxonomy/themes');
      setThemes(data);
    } catch (err) { setError(err.message); }
  }, []);
  useEffect(() => { loadThemes(); }, [loadThemes]);

  const loadDomains = useCallback(async () => {
    try {
      const data = await api.get('/v1/admin/rules/domains');
      setDomains(Array.isArray(data) ? data : []);
    } catch (err) { setError(err.message); }
  }, []);
  useEffect(() => { loadDomains(); }, [loadDomains]);

  const handleDomainChange = useCallback(async (domainId) => {
    setSelectedDomain(domainId);
    setSelectedSubdomain('');
    setSelectedRepoRuleId('');
    setSubdomainData(null);
    setSubdomains([]);
    setRepoRuleMeta({
      rule_id: '',
      description: '',
      weight: '',
      lock: 'natal',
      category: '',
      tradition: '',
    });
    if (!domainId) return;
    try {
      const data = await api.get(`/v1/admin/rules/domains/${domainId}`);
      setSubdomains(Array.isArray(data) ? data : []);
    } catch (err) { setError(err.message); }
  }, []);

  const loadSubdomain = useCallback(async (subdomainId) => {
    if (!subdomainId) {
      setSubdomainData(null);
      setSelectedRepoRuleId('');
      return;
    }
    try {
      const data = await api.get(`/v1/admin/rules/${subdomainId}`);
      setSubdomainData(data);
      setRepoMetadata({
        version: data.version || '',
        author: data.author || '',
        primary_tradition: data.primary_tradition || '',
      });
      setSelectedRepoRuleId('');
    } catch (err) { setError(err.message); }
  }, []);

  // ── Theme change → load life areas ──
  const handleThemeChange = useCallback(async (themeId) => {
    setSelectedTheme(themeId);
    setSelectedArea('');
    setSelectedQuestion('');
    setQuestionObj(null);
    setLifeAreas([]);
    setQuestions([]);
    if (!themeId) return;
    try {
      const data = await api.get(`/v1/admin/taxonomy/themes/${themeId}/life-areas`);
      setLifeAreas(data);
    } catch (err) { setError(err.message); }
  }, []);

  // ── Area change → load questions ──
  const handleAreaChange = useCallback(async (areaId) => {
    setSelectedArea(areaId);
    setSelectedQuestion('');
    setQuestionObj(null);
    setQuestions([]);
    if (!areaId) return;
    try {
      const data = await api.get(`/v1/admin/taxonomy/questions?life_area_id=${areaId}`);
      setQuestions(data);
    } catch (err) { setError(err.message); }
  }, []);

  // ── Question change → load existing rule ──
  const handleQuestionChange = useCallback((qId) => {
    setSelectedQuestion(qId);
    setValidationResult(null);
    if (!qId) { setQuestionObj(null); return; }
    const q = questions.find(x => x.id === qId);
    setQuestionObj(q || null);
    if (q && q.rules_json && typeof q.rules_json === 'object') {
      setRuleTree(rdlJsonToTree(q.rules_json));
    } else {
      setRuleTree(createDefaultGroup());
    }
  }, [questions]);

  const handleSubdomainChange = useCallback(async (subdomainId) => {
    setSelectedSubdomain(subdomainId);
    setSelectedRepoRuleId('');
    setRepoRuleMeta({
      rule_id: '',
      description: '',
      weight: '',
      lock: 'natal',
      category: '',
      tradition: '',
    });
    await loadSubdomain(subdomainId);
  }, [loadSubdomain]);

  const loadRepositoryRule = useCallback((ruleId) => {
    setSelectedRepoRuleId(ruleId);
    const rule = subdomainData?.rules?.find((entry) => entry.rule_id === ruleId);
    if (!rule) return;
    setRepoRuleMeta({
      rule_id: rule.rule_id || '',
      description: rule.description || '',
      weight: String(rule.weight ?? ''),
      lock: rule.lock || 'natal',
      category: rule.category || '',
      tradition: rule.tradition || '',
    });
    if (rule.condition && typeof rule.condition === 'object') {
      setRuleTree(rdlJsonToTree(rule.condition));
    } else {
      setRuleTree(createDefaultGroup());
    }
    setToast({ type: 'success', msg: `Loaded repository rule ${rule.rule_id}` });
  }, [subdomainData]);

  const resetRepositoryRuleEditor = useCallback(() => {
    setSelectedRepoRuleId('');
    setRepoRuleMeta({
      rule_id: '',
      description: '',
      weight: '',
      lock: 'natal',
      category: '',
      tradition: '',
    });
    setRuleTree(createDefaultGroup());
  }, []);

  const handleRepoMetaField = useCallback((field, value) => {
    setRepoRuleMeta((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleRepositoryRuleSave = useCallback(async () => {
    if (!selectedSubdomain) {
      setError('Select a repository subdomain before saving a rule.');
      return;
    }
    if (!repoRuleMeta.rule_id.trim()) {
      setError('Repository rule ID is required.');
      return;
    }
    if (!ruleJson) {
      setError('Rule tree is empty.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        rule_id: repoRuleMeta.rule_id.trim(),
        description: repoRuleMeta.description,
        weight: Number(repoRuleMeta.weight || 0),
        lock: repoRuleMeta.lock || 'natal',
        condition: ruleJson,
        category: repoRuleMeta.category || undefined,
        tradition: repoRuleMeta.tradition || undefined,
      };
      if (selectedRepoRuleId) {
        await api.put(`/v1/admin/rules/${selectedSubdomain}/${selectedRepoRuleId}`, payload);
      } else {
        await api.post(`/v1/admin/rules/${selectedSubdomain}`, payload);
      }
      await loadSubdomain(selectedSubdomain);
      setSelectedRepoRuleId(payload.rule_id);
      setToast({ type: 'success', msg: selectedRepoRuleId ? 'Repository rule updated.' : 'Repository rule created.' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [loadSubdomain, repoRuleMeta, ruleJson, selectedRepoRuleId, selectedSubdomain]);

  const handleRepositoryRuleDelete = useCallback(async () => {
    if (!selectedSubdomain || !selectedRepoRuleId) return;
    setSaving(true);
    setError('');
    try {
      await api.del(`/v1/admin/rules/${selectedSubdomain}/${selectedRepoRuleId}`);
      await loadSubdomain(selectedSubdomain);
      resetRepositoryRuleEditor();
      setToast({ type: 'success', msg: 'Repository rule deleted.' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [loadSubdomain, resetRepositoryRuleEditor, selectedRepoRuleId, selectedSubdomain]);

  const handleRepositoryMetadataSave = useCallback(async () => {
    if (!selectedSubdomain) {
      setError('Select a repository subdomain before updating metadata.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = Object.fromEntries(
        Object.entries(repoMetadata).filter(([, value]) => value !== '')
      );
      await api.put(`/v1/admin/rules/${selectedSubdomain}/metadata`, payload);
      await loadSubdomain(selectedSubdomain);
      setToast({ type: 'success', msg: 'Subdomain metadata updated.' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [loadSubdomain, repoMetadata, selectedSubdomain]);

  // ── Tree mutation callbacks ──
  const onAddCondition = useCallback((groupId) => {
    setRuleTree(prev => addConditionToGroup(prev, groupId));
  }, []);

  const onAddGroup = useCallback((parentId) => {
    setRuleTree(prev => addGroupToGroup(prev, parentId));
  }, []);

  const onRemoveNode = useCallback((nodeId) => {
    setRuleTree(prev => {
      const result = removeNode(prev, nodeId);
      return result || createDefaultGroup();
    });
  }, []);

  const onDuplicate = useCallback((nodeId) => {
    setRuleTree(prev => duplicateNode(prev, nodeId));
  }, []);

  const onToggleLogic = useCallback((groupId) => {
    setRuleTree(prev => toggleGroupLogic(prev, groupId));
  }, []);

  const onToggleNot = useCallback((condId) => {
    setRuleTree(prev => toggleNot(prev, condId));
  }, []);

  const onChangePrimitive = useCallback((condId, newType) => {
    setRuleTree(prev => updatePrimitiveType(prev, condId, newType));
  }, []);

  const onChangeParam = useCallback((condId, paramName, value) => {
    setRuleTree(prev => updateParam(prev, condId, paramName, value));
  }, []);

  // ── Footer actions ──
  const handleValidate = async () => {
    if (!ruleJson) { setValidationResult({ valid: false, errors: ['Rule tree is empty.'], warnings: [] }); return; }
    setValidationResult(null);
    try {
      const result = await api.post('/v1/admin/taxonomy/validate-rules', { rules_json: ruleJson });
      setValidationResult(result);
      setToast({ type: result.valid ? 'success' : 'error', msg: result.valid ? 'Rule is valid!' : 'Validation failed — see errors.' });
    } catch (err) {
      setValidationResult({ valid: false, errors: [err.message], warnings: [] });
    }
  };

  const handleSave = async () => {
    if (!selectedQuestion) { setError('Please select a question first.'); return; }
    if (!ruleJson) { setError('Rule tree is empty.'); return; }
    setSaving(true);
    setError('');
    try {
      await api.put(`/v1/admin/taxonomy/questions/${selectedQuestion}`, { rules_json: ruleJson });
      setToast({ type: 'success', msg: 'Rules saved to question!' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    if (!ruleJson) return;
    const blob = new Blob([JSON.stringify(ruleJson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rule_${questionObj?.question_id_display || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setRuleTree(createDefaultGroup());
    setValidationResult(null);
  };

  // ═══════════════════════════════════════════════════════════════
  // Rendering
  // ═══════════════════════════════════════════════════════════════

  // ── Render param field ──
  function renderParamField(condId, paramName, paramSpec, currentValue) {
    const { type, multi, source, label } = paramSpec;
    const opts = source ? (ENUM_SOURCES[source] || []) : [];

    if (type === 'select' && multi) {
      // Multi-select chips
      const selected = Array.isArray(currentValue) ? currentValue : [];
      const chipClass = source === 'planets' ? 'rb-chip--planet'
        : source === 'houses' ? 'rb-chip--house'
        : source === 'signs' ? 'rb-chip--sign'
        : source === 'nakshatras' ? 'rb-chip--nakshatra' : '';
      return (
        <div key={paramName} className="rb-param-group">
          <span className="rb-param-label">{label}:</span>
          <div className="rb-chip-container">
            {opts.map(o => {
              const val = String(o);
              const isSelected = selected.includes(o);
              return (
                <button key={val} type="button"
                  className={`rb-chip ${chipClass} ${isSelected ? 'rb-chip--selected' : ''}`}
                  onClick={() => {
                    const next = isSelected ? selected.filter(x => x !== o) : [...selected, o];
                    onChangeParam(condId, paramName, next);
                  }}>
                  {val}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (type === 'select') {
      return (
        <div key={paramName} className="rb-param-group">
          <span className="rb-param-label">{label}:</span>
          <select className="rb-select--param" value={currentValue || ''}
            onChange={e => onChangeParam(condId, paramName, e.target.value)}>
            <option value="">--</option>
            {opts.map(o => <option key={String(o)} value={o}>{String(o)}</option>)}
          </select>
        </div>
      );
    }

    if (type === 'number') {
      return (
        <div key={paramName} className="rb-param-group">
          <span className="rb-param-label">{label}:</span>
          <input type="number" className="rb-input--number"
            value={currentValue ?? ''} step="any"
            onChange={e => onChangeParam(condId, paramName, e.target.value)} />
        </div>
      );
    }

    if (type === 'boolean') {
      return (
        <label key={paramName} className="rb-checkbox-wrap">
          <input type="checkbox" checked={!!currentValue}
            onChange={e => onChangeParam(condId, paramName, e.target.checked)} />
          <span className="rb-checkbox-label">{label}</span>
        </label>
      );
    }

    // text / json_editor fallback
    return (
      <div key={paramName} className="rb-param-group">
        <span className="rb-param-label">{label}:</span>
        <input type="text" className="rb-input--text" value={currentValue || ''}
          onChange={e => onChangeParam(condId, paramName, e.target.value)} />
      </div>
    );
  }

  // ── Render condition row ──
  function renderConditionRow(cond) {
    const spec = cond.primitiveType ? PRIMITIVE_PARAM_SPECS[cond.primitiveType] : null;
    return (
      <div key={cond.id} className="rb-condition-row">
        <span className="rb-condition-grip"><i className="fas fa-grip-vertical"></i></span>

        {/* NOT toggle */}
        <button type="button"
          className={`rb-not-toggle ${cond.negated ? 'rb-not-toggle--active' : ''}`}
          onClick={() => onToggleNot(cond.id)}>
          NOT
        </button>

        {/* Primitive type dropdown */}
        <select className="rb-select--primitive" value={cond.primitiveType}
          onChange={e => onChangePrimitive(cond.id, e.target.value)}>
          <option value="">Select condition...</option>
          {GROUPED_PRIMITIVES.map(g => (
            <optgroup key={g.id} label={g.label}>
              {g.primitives.map(p => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </optgroup>
          ))}
        </select>

        {/* Dynamic parameters */}
        {spec && (
          <div className="rb-params">
            {Object.entries(spec.params).map(([pName, pSpec]) =>
              renderParamField(cond.id, pName, pSpec, cond.params[pName])
            )}
          </div>
        )}

        {/* Actions */}
        <div className="rb-condition-actions">
          <button type="button" className="rb-condition-action-btn" title="Duplicate"
            onClick={() => onDuplicate(cond.id)}>
            <i className="far fa-copy"></i>
          </button>
          <button type="button" className="rb-condition-action-btn rb-condition-action-btn--delete"
            title="Remove" onClick={() => onRemoveNode(cond.id)}>
            <i className="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    );
  }

  // ── Render group (recursive) ──
  function renderGroup(group, depth = 0) {
    const isNested = depth > 0;
    return (
      <div key={group.id} className={`rb-group ${isNested ? 'rb-group--nested' : ''}`}>
        <div className="rb-group-header">
          {/* Logic toggle */}
          <div className="rb-logic-toggle">
            <button type="button"
              className={`rb-logic-btn ${group.logic === 'AND' ? 'rb-logic-btn--active-and' : ''}`}
              onClick={() => onToggleLogic(group.id)}>AND</button>
            <button type="button"
              className={`rb-logic-btn ${group.logic === 'OR' ? 'rb-logic-btn--active-or' : ''}`}
              onClick={() => onToggleLogic(group.id)}>OR</button>
          </div>

          <span className="rb-group-label">
            {depth === 0 ? 'Root Group' : `Group ${depth}`}
          </span>

          <div className="rb-group-actions">
            <button type="button" className="rb-group-action-btn" title="Add Condition"
              onClick={() => onAddCondition(group.id)}>
              <i className="fas fa-plus"></i>
            </button>
            <button type="button" className="rb-group-action-btn" title="Add Nested Group"
              onClick={() => onAddGroup(group.id)}>
              <i className="fas fa-layer-group"></i>
            </button>
            {isNested && (
              <>
                <button type="button" className="rb-group-action-btn" title="Duplicate Group"
                  onClick={() => onDuplicate(group.id)}>
                  <i className="far fa-copy"></i>
                </button>
                <button type="button" className="rb-group-action-btn rb-group-action-btn--danger"
                  title="Remove Group" onClick={() => onRemoveNode(group.id)}>
                  <i className="fas fa-trash-alt"></i>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Children */}
        {group.children.map((child, idx) => (
          <div key={child.id}>
            {idx > 0 && (
              <div className={`rb-connector ${group.logic === 'AND' ? 'rb-connector--and' : 'rb-connector--or'}`}>
                {group.logic}
              </div>
            )}
            {child.nodeType === 'condition'
              ? renderConditionRow(child)
              : renderGroup(child, depth + 1)}
          </div>
        ))}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // JSX
  // ═══════════════════════════════════════════════════════════════
  return (
    <PageShell activeNav="admin">
      <section className="admin-page">
        <div className="container">
          {/* Breadcrumb */}
          <div className="admin-breadcrumb">
            <a href="/admin/themes" onClick={e => { e.preventDefault(); navigate('/admin/themes'); }}>Themes</a>
            <span className="sep">/</span>
            <a href="/admin/questions" onClick={e => { e.preventDefault(); navigate('/admin/questions'); }}>Questions</a>
            <span className="sep">/</span>
            <span>Rule Builder</span>
          </div>

          {/* Header */}
          <div className="admin-header">
            <h1><i className="fas fa-project-diagram"></i> Rule Builder</h1>
            <p>Visually build RDL condition trees for prediction questions</p>
          </div>

          <div className="rb-container">
            <div className="rb-data-tags" style={{ marginBottom: '1rem' }}>
              <div className="rb-data-tags-header">
                <i className="fas fa-folder-open"></i>
                <span>Rule Repository Manager</span>
              </div>
              <div className="rb-taxonomy-bar" style={{ marginTop: '0.85rem' }}>
                <div className="rb-taxonomy-group">
                  <label><i className="fas fa-layer-group"></i> Domain</label>
                  <select aria-label="Repository Domain" value={selectedDomain} onChange={e => handleDomainChange(e.target.value)}>
                    <option value="">Select domain...</option>
                    {domains.map(domain => (
                      <option key={domain.id} value={domain.id}>{domain.name}</option>
                    ))}
                  </select>
                </div>
                <div className="rb-taxonomy-group">
                  <label><i className="fas fa-folder"></i> Subdomain</label>
                  <select aria-label="Repository Subdomain" value={selectedSubdomain} onChange={e => handleSubdomainChange(e.target.value)} disabled={!selectedDomain}>
                    <option value="">Select subdomain...</option>
                    {subdomains.map(subdomain => (
                      <option key={subdomain.id} value={subdomain.id}>
                        [{subdomain.id}] {subdomain.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="rb-taxonomy-group">
                  <label><i className="fas fa-file-alt"></i> Repository Rule</label>
                  <select aria-label="Repository Rule" value={selectedRepoRuleId} onChange={e => loadRepositoryRule(e.target.value)} disabled={!selectedSubdomain}>
                    <option value="">Select repository rule...</option>
                    {(subdomainData?.rules || []).map(rule => (
                      <option key={rule.rule_id} value={rule.rule_id}>{rule.rule_id}</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedSubdomain && (
                <>
                  <div className="rb-taxonomy-bar" style={{ marginTop: '0.85rem' }}>
                    <div className="rb-taxonomy-group">
                      <label>Version</label>
                      <input value={repoMetadata.version} onChange={e => setRepoMetadata(prev => ({ ...prev, version: e.target.value }))} placeholder="1.0.0" />
                    </div>
                    <div className="rb-taxonomy-group">
                      <label>Author</label>
                      <input value={repoMetadata.author} onChange={e => setRepoMetadata(prev => ({ ...prev, author: e.target.value }))} placeholder="Admin author" />
                    </div>
                    <div className="rb-taxonomy-group">
                      <label>Primary Tradition</label>
                      <input value={repoMetadata.primary_tradition} onChange={e => setRepoMetadata(prev => ({ ...prev, primary_tradition: e.target.value }))} placeholder="PARASHARI" />
                    </div>
                    <div className="rb-taxonomy-group" style={{ justifyContent: 'flex-end' }}>
                      <label>&nbsp;</label>
                      <button type="button" className="rb-toolbar-btn" onClick={handleRepositoryMetadataSave} disabled={saving}>
                        <i className="fas fa-save"></i> Save Metadata
                      </button>
                    </div>
                  </div>

                  <div className="rb-taxonomy-bar" style={{ marginTop: '0.5rem' }}>
                    <div className="rb-taxonomy-group">
                      <label>Rule ID</label>
                      <input aria-label="Repository Rule ID" value={repoRuleMeta.rule_id} onChange={e => handleRepoMetaField('rule_id', e.target.value)} placeholder="jobloss_dasha_trigger" />
                    </div>
                    <div className="rb-taxonomy-group">
                      <label>Weight</label>
                      <input aria-label="Repository Rule Weight" type="number" step="any" value={repoRuleMeta.weight} onChange={e => handleRepoMetaField('weight', e.target.value)} placeholder="0.12" />
                    </div>
                    <div className="rb-taxonomy-group">
                      <label>Lock</label>
                      <input aria-label="Repository Rule Lock" value={repoRuleMeta.lock} onChange={e => handleRepoMetaField('lock', e.target.value)} placeholder="natal" />
                    </div>
                    <div className="rb-taxonomy-group">
                      <label>Tradition</label>
                      <input aria-label="Repository Rule Tradition" value={repoRuleMeta.tradition} onChange={e => handleRepoMetaField('tradition', e.target.value)} placeholder="PARASHARI" />
                    </div>
                  </div>
                  <div className="rb-taxonomy-bar" style={{ marginTop: '0.5rem' }}>
                    <div className="rb-taxonomy-group" style={{ minWidth: '280px', flex: 2 }}>
                      <label>Description</label>
                      <input aria-label="Repository Rule Description" value={repoRuleMeta.description} onChange={e => handleRepoMetaField('description', e.target.value)} placeholder="Describe when the rule should fire" />
                    </div>
                    <div className="rb-taxonomy-group">
                      <label>Category</label>
                      <input aria-label="Repository Rule Category" value={repoRuleMeta.category} onChange={e => handleRepoMetaField('category', e.target.value)} placeholder="timing" />
                    </div>
                    <div className="rb-taxonomy-group" style={{ justifyContent: 'flex-end' }}>
                      <label>&nbsp;</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="button" className="rb-toolbar-btn" onClick={resetRepositoryRuleEditor}>
                          <i className="fas fa-file-medical"></i> New Repository Rule
                        </button>
                        <button type="button" className="rb-toolbar-btn rb-toolbar-btn--primary" onClick={handleRepositoryRuleSave} disabled={saving || !selectedSubdomain}>
                          <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`}></i> {selectedRepoRuleId ? 'Update Repository Rule' : 'Create Repository Rule'}
                        </button>
                        <button type="button" className="rb-toolbar-btn" onClick={handleRepositoryRuleDelete} disabled={saving || !selectedRepoRuleId}>
                          <i className="fas fa-trash-alt"></i> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Taxonomy Bar */}
            <div className="rb-taxonomy-bar">
              <div className="rb-taxonomy-group">
                <label><i className="fas fa-layer-group"></i> Theme</label>
                <select value={selectedTheme} onChange={e => handleThemeChange(e.target.value)}>
                  <option value="">Select theme...</option>
                  {themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="rb-taxonomy-group">
                <label><i className="fas fa-sitemap"></i> Life Area</label>
                <select value={selectedArea} onChange={e => handleAreaChange(e.target.value)}
                  disabled={!selectedTheme}>
                  <option value="">Select life area...</option>
                  {lifeAreas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="rb-taxonomy-group">
                <label><i className="fas fa-question-circle"></i> Question</label>
                <select value={selectedQuestion} onChange={e => handleQuestionChange(e.target.value)}
                  disabled={!selectedArea}>
                  <option value="">Select question...</option>
                  {questions.map(q => (
                    <option key={q.id} value={q.id}>
                      {q.question_id_display ? `[${q.question_id_display}] ` : ''}{q.question_text}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Question badge */}
            {questionObj && (
              <div className="rb-question-badge">
                <i className="fas fa-tag"></i>
                {questionObj.question_id_display} — {questionObj.question_text}
              </div>
            )}

            {/* Toolbar */}
            <div className="rb-toolbar">
              <button type="button" className="rb-toolbar-btn rb-toolbar-btn--primary"
                onClick={() => onAddCondition(ruleTree.id)}>
                <i className="fas fa-plus"></i> Condition
              </button>
              <button type="button" className="rb-toolbar-btn"
                onClick={() => onAddGroup(ruleTree.id)}>
                <i className="fas fa-layer-group"></i> Group
              </button>
              <button type="button" className="rb-toolbar-btn"
                onClick={handleReset}>
                <i className="fas fa-undo"></i> Reset
              </button>
              <div className="rb-toolbar-badge">
                <i className="fas fa-code-branch"></i>
                {condCount} condition{condCount !== 1 ? 's' : ''} &middot; {grpCount} group{grpCount !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Canvas */}
            <div className="rb-canvas">
              {ruleTree.children.length === 0 ? (
                <div className="rb-canvas--empty">
                  <i className="fas fa-drafting-compass"></i>
                  <p>Add conditions or groups to start building your rule</p>
                </div>
              ) : (
                renderGroup(ruleTree)
              )}
            </div>

            {/* Data Field Tags */}
            <div className="rb-data-tags">
              <div className="rb-data-tags-header">
                <i className="fas fa-tags"></i>
                <span>Detected Data Fields</span>
                {dataFieldTags.length > 0 && (
                  <span className="rb-data-tags-count">{dataFieldTags.length}</span>
                )}
              </div>
              {dataFieldTags.length > 0 ? (
                <div className="rb-tags-grid">
                  {dataFieldTags.map(tag => (
                    <span key={tag.tag} className="rb-tag"
                      style={{
                        borderColor: tag.color + '60',
                        background: tag.color + '15',
                        color: tag.color,
                      }}
                      title={tag.label}>
                      {`{${tag.tag}}`}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="rb-data-tags--empty">
                  No data fields detected yet. Add conditions with parameters to see auto-detected prompt variables.
                </div>
              )}
            </div>

            {/* Validation result */}
            {validationResult && (
              <div className={`rb-validation-box ${validationResult.valid ? 'rb-validation-box--success' : 'rb-validation-box--error'}`}>
                {validationResult.valid ? (
                  <><i className="fas fa-check-circle"></i> Rule is valid!
                    {validationResult.warnings?.length > 0 && ` (${validationResult.warnings.length} warning${validationResult.warnings.length > 1 ? 's' : ''})`}</>
                ) : (
                  <><i className="fas fa-times-circle"></i> Validation failed</>
                )}
                {validationResult.errors?.length > 0 && (
                  <ul>{validationResult.errors.map((e, i) => <li key={i}><i className="fas fa-times"></i> {e}</li>)}</ul>
                )}
                {validationResult.warnings?.length > 0 && (
                  <ul>{validationResult.warnings.map((w, i) => <li key={i}><i className="fas fa-exclamation-triangle"></i> {w}</li>)}</ul>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="api-error">
                <i className="fas fa-exclamation-circle"></i>
                <p>{error}</p>
                <button type="button" style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}
                  onClick={() => setError('')}><i className="fas fa-times"></i></button>
              </div>
            )}

            {/* Footer */}
            <div className="rb-footer">
              <button type="button" className="rb-footer-btn rb-footer-btn--validate"
                onClick={handleValidate} disabled={!ruleJson}>
                <i className="fas fa-check-circle"></i> Validate
              </button>
              <button type="button" className="rb-footer-btn"
                onClick={() => setJsonPreviewOpen(true)} disabled={!ruleJson}>
                <i className="fas fa-code"></i> Preview JSON
              </button>
              <button type="button" className="rb-footer-btn"
                onClick={handleExport} disabled={!ruleJson}>
                <i className="fas fa-download"></i> Export
              </button>
              <div className="rb-footer-spacer" />
              <button type="button" className="rb-footer-btn rb-footer-btn--save"
                onClick={handleSave} disabled={saving || !selectedQuestion || !ruleJson}>
                {saving
                  ? <><i className="fas fa-spinner fa-spin"></i> Saving...</>
                  : <><i className="fas fa-save"></i> Save to Question</>}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* JSON Preview Modal */}
      {jsonPreviewOpen && (
        <div className="rb-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setJsonPreviewOpen(false); }}>
          <div className="rb-modal">
            <div className="rb-modal-header">
              <h2><i className="fas fa-code"></i> RDL Rule JSON</h2>
              <button type="button" className="rb-modal-close" onClick={() => setJsonPreviewOpen(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="rb-modal-body">
              <pre className="rb-json-preview">
                {JSON.stringify(ruleJson, null, 2)}
              </pre>
            </div>
            <div className="rb-modal-footer">
              <button type="button" className="rb-footer-btn"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(ruleJson, null, 2));
                  setToast({ type: 'success', msg: 'JSON copied to clipboard!' });
                }}>
                <i className="fas fa-copy"></i> Copy
              </button>
              <button type="button" className="rb-footer-btn" onClick={() => setJsonPreviewOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className={`admin-toast ${toast.type}`}>{toast.msg}</div>}
    </PageShell>
  );
}
