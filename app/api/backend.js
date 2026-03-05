// 后端接口封装：统一处理 baseUrl、token、错误

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8080';

const getToken = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('fund_token') || window.sessionStorage.getItem('fund_token');
};

export const setToken = (token, remember = true) => {
  if (typeof window === 'undefined') return;
  if (remember) {
    window.localStorage.setItem('fund_token', token);
    window.sessionStorage.removeItem('fund_token');
  } else {
    window.sessionStorage.setItem('fund_token', token);
    window.localStorage.removeItem('fund_token');
  }
};

export const clearToken = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('fund_token');
  window.sessionStorage.removeItem('fund_token');
};

const request = async (path, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const resp = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // 统一解析 PageResult
  const data = await resp.json().catch(() => null);
  if (!resp.ok) {
    throw new Error(data?.msg || `请求失败(${resp.status})`);
  }
  if (data && data.flag === false) {
    throw new Error(data.msg || '请求失败');
  }
  return data?.data;
};

export const authApi = {
  login: (payload) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request('/api/auth/me'),
  refresh: () => request('/api/auth/refresh', { method: 'POST' }),
};

export const storageApi = {
  get: () => request('/api/user/storage'),
  save: (storageData) => request('/api/user/storage', { method: 'PUT', body: JSON.stringify({ storageData }) }),
};

export const marketApi = {
  searchFunds: (key) => request(`/api/market/fund/search?key=${encodeURIComponent(key)}`),
  fundDetail: (code) => request(`/api/market/fund/${encodeURIComponent(code)}`),
  fundHistory: (code, range) => request(`/api/market/fund/${encodeURIComponent(code)}/history?range=${encodeURIComponent(range || '1m')}`),
  shanghaiIndexDate: () => request('/api/market/index/shanghai/date'),
};

export const feedbackApi = {
  submit: (payload) => request('/api/feedback', { method: 'POST', body: JSON.stringify(payload) }),
};

// 简单解析 JWT exp（秒）
export const parseJwtExp = (token) => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof json.exp === 'number' ? json.exp : null;
  } catch {
    return null;
  }
};
