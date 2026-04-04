const ACCEPTANCE_GATE_TOKEN_KEY = 'acceptance_gate_token';

const readStoredGateToken = () => {
  if (typeof window === 'undefined') return '';
  try {
    return window.sessionStorage.getItem(ACCEPTANCE_GATE_TOKEN_KEY) || '';
  } catch {
    return '';
  }
};

const writeStoredGateToken = (token) => {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      window.sessionStorage.setItem(ACCEPTANCE_GATE_TOKEN_KEY, token);
    } else {
      window.sessionStorage.removeItem(ACCEPTANCE_GATE_TOKEN_KEY);
    }
  } catch {
    // Ignore storage failures and keep the in-memory fallback.
  }
};

let acceptanceGateToken = readStoredGateToken();

export function setAcceptanceGateToken(token = '') {
  acceptanceGateToken = token || '';
  writeStoredGateToken(acceptanceGateToken);
}

export function getAcceptanceGateToken() {
  return acceptanceGateToken;
}

export function withAcceptanceGateHeaders(headers = {}) {
  if (!acceptanceGateToken) return { ...headers };
  return {
    ...headers,
    'X-Acceptance-Gate-Token': acceptanceGateToken,
  };
}

export function clearAcceptanceGateToken() {
  acceptanceGateToken = '';
  writeStoredGateToken('');
}

export function announceAcceptanceGateReset() {
  clearAcceptanceGateToken();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('acceptance-gate-reset'));
  }
}
