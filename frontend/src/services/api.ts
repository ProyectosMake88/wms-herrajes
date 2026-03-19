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
  const data = await res.json();
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
  const data = await res.json();
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
  getStockReport: () => request<any>('/reports/stock'),
  getStockByCategory: (categoryId: number) => request<any>(`/reports/stock/category/${categoryId}`),
  getMovementsReport: (startDate: string, endDate: string, type?: string) => {
    let query = `?startDate=${startDate}&endDate=${endDate}`;
    if (type) query += `&type=${type}`;
    return request<any>(`/reports/movements${query}`);
  },
  getLowStockReport: () => request<any>('/reports/low-stock'),
};

// Auth / Users
export const authApi = {
  getUsers: () => request<any>('/auth/users'),
  createUser: (data: { email: string; password: string; name: string; role: string }) =>
    request<any>('/auth/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: number, data: { name?: string; role?: string; isActive?: boolean }) =>
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

// Notifications
export const notificationApi = {
  getAll: () => request<any>('/notifications'),
  markAsRead: (id: number) => request<any>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllAsRead: () => request<any>('/notifications/read-all', { method: 'PUT' }),
};
