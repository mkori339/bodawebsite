const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request(path, { method = 'GET', body, token } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    throw new Error(data?.message || 'Request failed.');
  }

  return data;
}

export const authApi = {
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  me: (token) => request('/auth/me', { token })
};

export const ridesApi = {
  quote: (token, payload) => request('/rides/quote', { method: 'POST', body: payload, token }),
  create: (token, payload) => request('/rides', { method: 'POST', body: payload, token }),
  mine: (token) => request('/rides/mine', { token }),
  pay: (token, rideId) => request(`/rides/${rideId}/pay`, { method: 'POST', token }),
  available: (token) => request('/rides/available', { token }),
  assigned: (token) => request('/rides/assigned', { token }),
  accept: (token, rideId) => request(`/rides/${rideId}/accept`, { method: 'POST', token }),
  start: (token, rideId) => request(`/rides/${rideId}/start`, { method: 'POST', token }),
  complete: (token, rideId) => request(`/rides/${rideId}/complete`, { method: 'POST', token })
};

export const adminApi = {
  overview: (token) => request('/admin/overview', { token }),
  trips: (token) => request('/admin/trips', { token }),
  payments: (token) => request('/admin/payments', { token }),
  riders: (token) => request('/admin/riders', { token })
};
