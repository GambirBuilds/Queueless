/**
 * Authenticated API Client for QUEUELESS Frontend
 * Automatically attaches the signed-in user's Firebase ID token to backend API calls.
 */

import { auth } from '../firebase/config.js';

export async function getAuthHeaders(extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders
  };

  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const idToken = await currentUser.getIdToken();
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }
    }
  } catch (err) {
    console.warn('[apiClient] Failed to resolve ID token:', err.message);
  }

  return headers;
}

export async function apiFetch(url, options = {}) {
  const headers = await getAuthHeaders(options.headers || {});
  const response = await fetch(url, {
    ...options,
    headers
  });
  return response;
}

export async function downloadAuthenticatedCsv(url, filename = 'queueless_report.csv') {
  const headers = await getAuthHeaders({});
  delete headers['Content-Type'];
  const response = await fetch(url, { headers });
  if (!response.ok) {
    let errMsg = 'Failed to export CSV report.';
    try {
      const json = await response.json();
      if (json.error) errMsg = json.error;
    } catch {
      // ignore non-json
    }
    throw new Error(errMsg);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}
