const TOKEN_KEY = 'phoneshop.session';
export const session = {
  get: () => sessionStorage.getItem(TOKEN_KEY),
  set: (token) => sessionStorage.setItem(TOKEN_KEY, token),
  clear: () => sessionStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(message, status, fields) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

export async function api(path, { method = 'GET', body, signal } = {}) {
  const token = session.get();
  const headers = token ? { Authorization: `Token ${token}` } : {};
  if (body !== undefined && !(body instanceof FormData))
    headers['Content-Type'] = 'application/json';
  let response;
  try {
    response = await fetch(`/api/v1/${path}`, {
      method,
      headers,
      signal,
      body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('We couldn’t reach your shop. Check your connection and try again.', 0);
  }
  if (response.status === 204) return { data: null };
  let result;
  try {
    result = await response.json();
  } catch {
    throw new ApiError(
      'The server could not complete this request. Please try again.',
      response.status,
    );
  }
  if (!response.ok) {
    if (response.status === 401 && path !== 'auth/login') {
      session.clear();
      window.dispatchEvent(new Event('session-expired'));
    }
    throw new ApiError(
      result.message || 'Something went wrong. Please try again.',
      response.status,
      result.errors,
    );
  }
  return result;
}

export async function allRecords(path, signal) {
  const rows = [];
  for (let page = 1; ; page++) {
    const result = await api(`${path}${path.includes('?') ? '&' : '?'}page=${page}`, { signal });
    rows.push(...result.data);
    if (!result.pagination?.next) return rows;
  }
}

export function imageUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value, location.origin);
    if (url.protocol === 'blob:' && url.origin === location.origin) return url.href;
    if (url.pathname.startsWith('/media/')) return url.pathname;
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function formatNumber(value) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(value || 0));
}
export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value.replace(' ', 'T'));
  return isNaN(date)
    ? '—'
    : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function downloadCsv(filename, headers, rows) {
  const escape = (value) => {
    let text = String(value ?? '');
    if (/^[=+\-@\t\r\n]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const content =
    '\uFEFF' + [headers, ...rows].map((row) => row.map(escape).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8;' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
