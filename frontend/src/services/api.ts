const BASE_URL = '/api';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('wms_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function getAuthHeadersOnly(): Record<string, string> {
  const token = localStorage.getItem('wms_token');
  if (token) return { Authorization: `Bearer ${token}` };
  return {};
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: getAuthHeaders(),
    ...options,
  });
  if (res.status === 401) {
    localStorage.removeItem('wms_token');
    localStorage.removeItem('wms_user');
    window.location.href = '/login';
    throw new Error('Sesión expirada');
  }
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.warn('Non-JSON response from', url, text.substring(0, 100));
    return {} as T;
  }
  if (!res.ok) throw new Error(data.message || 'Error en la solicitud');
  return data;
}

async function requestFormData<T>(url: string, method: string, formData: FormData): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    method,
    headers: getAuthHeadersOnly(),
    body: formData,
  });
  if (res.status === 401) {
    localStorage.removeItem('wms_token');
    localStorage.removeItem('wms_user');
    window.location.href = '/login';
    throw new Error('Sesión expirada');
  }
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.warn('Non-JSON response from', url, text.substring(0, 100));
    return {} as T;
  }
  if (!res.ok) throw new Error(data.message || 'Error en la solicitud');
  return data;
}

// Categories
export const categoryApi = {
  getAll: () => request<any>('/categories'),
  getById: (id: number) => request<any>(`/categories/${id}`),
  create: (data: { name: string; description?: string }) =>
    request<any>('/categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: { name?: string; description?: string }) =>
    request<any>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request<any>(`/categories/${id}`, { method: 'DELETE' }),
};

// Products
export const productApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/products${query}`);
  },
  getById: (id: number) => request<any>(`/products/${id}`),
  getBySku: (sku: string) => request<any>(`/products/sku/${sku}`),
  getLowStock: () => request<any>('/products/low-stock'),
  create: (data: Record<string, any>, imageFile?: File) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, String(value));
      }
    });
    if (imageFile) formData.append('image', imageFile);
    return requestFormData<any>('/products', 'POST', formData);
  },
  update: (id: number, data: Record<string, any>, imageFile?: File) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, String(value));
      }
    });
    if (imageFile) formData.append('image', imageFile);
    return requestFormData<any>(`/products/${id}`, 'PUT', formData);
  },
  delete: (id: number) => request<any>(`/products/${id}`, { method: 'DELETE' }),
};

// Inventory / Movements
export const inventoryApi = {
  registerMovement: (data: {
    productId: number;
    type: 'ENTRY' | 'EXIT';
    quantity: number;
    salePrice?: number;
    reason: string;
    responsible: string;
    notes?: string;
  }) => request<any>('/inventory/movement', { method: 'POST', body: JSON.stringify(data) }),
  getMovements: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/inventory/movements${query}`);
  },
  getMovementsByProduct: (productId: number) =>
    request<any>(`/inventory/movements/product/${productId}`),
};

// Reports
export const reportApi = {
  getStockReport: (branchId?: string) => {
    const query = branchId ? `?branchId=${branchId}` : '';
    return request<any>(`/reports/stock${query}`);
  },
  getStockByCategory: (categoryId: number) => request<any>(`/reports/stock/category/${categoryId}`),
  getMovementsReport: (startDate: string, endDate: string, type?: string, branchId?: string) => {
    let query = `?startDate=${startDate}&endDate=${endDate}`;
    if (type) query += `&type=${type}`;
    if (branchId) query += `&branchId=${branchId}`;
    return request<any>(`/reports/movements${query}`);
  },
  getLowStockReport: () => request<any>('/reports/low-stock'),
  getTopSelling: () => request<any>('/reports/top-selling'),
};

// Auth / Users
export const authApi = {
  updateProfile: (data: { name: string; email: string }, avatarFile?: File) => {
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.email) formData.append('email', data.email);
    if (avatarFile) formData.append('avatar', avatarFile);
    return requestFormData<any>('/auth/profile', 'PUT', formData);
  },
  getUsers: () => request<any>('/auth/users'),
  createUser: (data: { email: string; password: string; name: string; role: string; organizationId?: number; branchId?: number }) =>
    request<any>('/auth/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: number, data: { name?: string; role?: string; branchId?: number | null; isActive?: boolean }) =>
    request<any>(`/auth/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id: number) => request<any>(`/auth/users/${id}`, { method: 'DELETE' }),
};

// Company
export const companyApi = {
  getProfile: () => request<any>('/company'),
  updateProfile: (data: Record<string, any>, logoFile?: File) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) formData.append(key, String(value));
    });
    if (logoFile) formData.append('logo', logoFile);
    return requestFormData<any>('/company', 'PUT', formData);
  },
};

// Organizations (Super Admin)
export const organizationApi = {
  getAll: () => request<any>('/organizations'),
  getById: (id: number) => request<any>(`/organizations/${id}`),
  getStats: () => request<any>('/organizations/stats'),
  create: (data: any) => request<any>('/organizations', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => request<any>(`/organizations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleActive: (id: number) => request<any>(`/organizations/${id}/toggle`, { method: 'PUT' }),
};

// Branch Stock
export const branchStockApi = {
  getAvailable: (organizationId?: number) => {
    const query = organizationId ? `?organizationId=${organizationId}` : '';
    return request<any>(`/branch-stock/available${query}`);
  },
  getByBranch: (branchId: number) => request<any>(`/branch-stock/branch/${branchId}`),
  assign: (data: { productId: number; branchId: number; quantity: number }) =>
    request<any>('/branch-stock/assign', { method: 'POST', body: JSON.stringify(data) }),
  remove: (data: { productId: number; branchId: number }) =>
    request<any>('/branch-stock/remove', { method: 'POST', body: JSON.stringify(data) }),
};

// Branches
export const branchApi = {
  getAll: () => request<any>('/branches'),
  getById: (id: number) => request<any>(`/branches/${id}`),
  create: (data: { name: string; code: string; address?: string; city?: string; phone?: string; manager?: string }) =>
    request<any>('/branches', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) =>
    request<any>(`/branches/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request<any>(`/branches/${id}`, { method: 'DELETE' }),
};

// Pending Entries
export const pendingEntryApi = {
  create: (data: { productId: number; quantity: number; reason: string; notes?: string }) =>
    request<any>('/pending-entries', { method: 'POST', body: JSON.stringify(data) }),
  getAll: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return request<any>(`/pending-entries${query}`);
  },
  approve: (id: number) => request<any>(`/pending-entries/${id}/approve`, { method: 'PUT' }),
  reject: (id: number, rejectReason: string) =>
    request<any>(`/pending-entries/${id}/reject`, { method: 'PUT', body: JSON.stringify({ rejectReason }) }),
};

// Notifications
export const notificationApi = {
  getAll: () => request<any>('/notifications'),
  markAsRead: (id: number) => request<any>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllAsRead: () => request<any>('/notifications/read-all', { method: 'PUT' }),
};
