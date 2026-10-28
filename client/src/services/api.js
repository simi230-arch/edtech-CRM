// Centralized API client with JWT authentication and error handling

const API_BASE = '/api';

export function getAuthToken() {
  return localStorage.getItem('crm_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('crm_token', token);
  } else {
    localStorage.removeItem('crm_token');
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('crm_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem('crm_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('crm_user');
  }
}

export async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    // Handle 401 Unauthorized
    if (res.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
      setAuthToken(null);
      setStoredUser(null);
      window.dispatchEvent(new Event('auth:unauthorized'));
      throw new Error('Your session has expired. Please sign in again.');
    }

    // Handle CSV or non-JSON responses
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/csv') || options.responseType === 'blob') {
      if (!res.ok) throw new Error('Failed to download file');
      return await res.blob();
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }

    return data;
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, err);
    throw err;
  }
}

// College API
export const CollegesAPI = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/colleges${query ? `?${query}` : ''}`);
  },
  getFilters: () => apiRequest('/colleges/meta/filters'),
  get: (id) => apiRequest(`/colleges/${id}`),
  create: (data) => apiRequest('/colleges', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/colleges/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStage: (id, data) => apiRequest(`/colleges/${id}/stage`, { method: 'PATCH', body: JSON.stringify(data) }),
  archive: (id, isArchived) => apiRequest(`/colleges/${id}/archive`, { method: 'PATCH', body: JSON.stringify({ is_archived: isArchived }) }),
  delete: (id) => apiRequest(`/colleges/${id}`, { method: 'DELETE' }),
  checkDuplicate: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/colleges/check-duplicate?${query}`);
  }
};

// Activities API
export const ActivitiesAPI = {
  getByCollege: (collegeId) => apiRequest(`/activities/college/${collegeId}`),
  log: (data) => apiRequest('/activities', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/activities/${id}`, { method: 'DELETE' })
};

// Follow-ups API
export const FollowUpsAPI = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/followups${query ? `?${query}` : ''}`);
  },
  create: (data) => apiRequest('/followups', { method: 'POST', body: JSON.stringify(data) }),
  toggleComplete: (id, isCompleted) => apiRequest(`/followups/${id}/complete`, { method: 'PATCH', body: JSON.stringify({ is_completed: isCompleted }) }),
  reschedule: (id, data) => apiRequest(`/followups/${id}/reschedule`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/followups/${id}`, { method: 'DELETE' })
};

// Startups API
export const StartupsAPI = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/startups${query ? `?${query}` : ''}`);
  },
  get: (id) => apiRequest(`/startups/${id}`),
  create: (data) => apiRequest('/startups', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/startups/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/startups/${id}`, { method: 'DELETE' })
};

// Courses API
export const CoursesAPI = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/courses${query ? `?${query}` : ''}`);
  },
  get: (id) => apiRequest(`/courses/${id}`),
  create: (data) => apiRequest('/courses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/courses/${id}`, { method: 'DELETE' })
};

// Proposals API
export const ProposalsAPI = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/proposals${query ? `?${query}` : ''}`);
  },
  create: (data) => apiRequest('/proposals', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/proposals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/proposals/${id}`, { method: 'DELETE' })
};

// Dashboard API
export const DashboardAPI = {
  getMetrics: () => apiRequest('/dashboard/metrics')
};

// Auth API
export const AuthAPI = {
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (data) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  me: () => apiRequest('/auth/me'),
  logout: () => apiRequest('/auth/logout', { method: 'POST' })
};

// Export / Import API
export const ExportImportAPI = {
  exportColleges: () => apiRequest('/export-import/colleges', { responseType: 'blob' }),
  exportActivities: () => apiRequest('/export-import/activities', { responseType: 'blob' }),
  exportFollowUps: () => apiRequest('/export-import/followups', { responseType: 'blob' }),
  exportStartups: () => apiRequest('/export-import/startups', { responseType: 'blob' }),
  exportProposals: () => apiRequest('/export-import/proposals', { responseType: 'blob' }),
  importColleges: (csvData, skipDuplicates = true) => apiRequest('/export-import/import-colleges', {
    method: 'POST',
    body: JSON.stringify({ csvData, skipDuplicates })
  }),
  downloadDatabaseBackup: () => apiRequest('/backup/download', { responseType: 'blob' })
};
