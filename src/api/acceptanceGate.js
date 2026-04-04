let acceptanceGateToken = '';

export function setAcceptanceGateToken(token = '') {
  acceptanceGateToken = token || '';
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
}

export function announceAcceptanceGateReset() {
  clearAcceptanceGateToken();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('acceptance-gate-reset'));
  }
}

