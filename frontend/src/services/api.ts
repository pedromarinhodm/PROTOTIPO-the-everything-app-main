import { Product, Movement, MovementFilter, DashboardStats } from '@/types/stock';

const API_BASE_URL = 'http://localhost:3000/api';

// Utility function to download blob as file
const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Products
  products = {
    getAll: (search?: string): Promise<{ success: boolean; data: Product[]; count: number }> =>
      this.request(`/produtos${search ? `?search=${encodeURIComponent(search)}` : ''}`),

    create: (product: Omit<Product, '_id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; produto: Product }> =>
      this.request('/produtos', {
        method: 'POST',
        body: JSON.stringify(product),
      }),

    update: (id: string, product: Partial<Product>): Promise<{ success: boolean; produto: Product }> =>
      this.request(`/produtos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(product),
      }),

    delete: (id: string): Promise<{ success: boolean; message: string }> =>
      this.request(`/produtos/${id}`, {
        method: 'DELETE',
      }),

    updateWithInvoice: (id: string, formData: FormData): Promise<{ success: boolean; data: Product; message?: string }> => {
      return fetch(`${API_BASE_URL}/produtos/${id}`, {
        method: 'PUT',
        body: formData,
      }).then(res => {
        if (!res.ok) throw new Error(`Update failed: ${res.statusText}`);
        return res.json();
      });
    },

    getInvoiceViewUrl: (id: string): string => `${API_BASE_URL}/produtos/${id}/nota-fiscal/view`,

    getInvoiceDownloadUrl: (id: string): string => `${API_BASE_URL}/produtos/${id}/nota-fiscal/download`,
  };

  // Movements
  movements = {
    getAll: (filters?: MovementFilter): Promise<Movement[]> => {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.tipo) params.append('tipo', filters.tipo);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      return this.request(`/movimentacoes?${params.toString()}`);
    },

    getFiltered: (filters: {
      startDate?: string;
      endDate?: string;
      tipo?: string;
      productId?: string;
      setor?: string;
    }): Promise<Movement[]> => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.tipo && filters.tipo !== 'ambos') params.append('tipo', filters.tipo);
      if (filters?.productId && filters.productId !== 'todos') params.append('productId', filters.productId);
      if (filters?.setor && filters.setor !== 'todos') params.append('setor', filters.setor);

      return this.request(`/movimentacoes?${params.toString()}`);
    },

    createEntry: (entry: {
      produto: string;
      quantidade: number;
      unidade?: string;
      servidor_almoxarifado: string;
      data?: string;
      observacoes?: string;
    }): Promise<{ success: boolean; message: string }> =>
      this.request('/entrada', {
        method: 'POST',
        body: JSON.stringify(entry),
      }),

    createEntryWithInvoice: (formData: FormData): Promise<{ success: boolean; data: Movement; message: string }> => {
      return fetch(`${API_BASE_URL}/entrada`, {
        method: 'POST',
        body: formData,
      }).then(res => {
        if (!res.ok) throw new Error(`Entry failed: ${res.statusText}`);
        return res.json();
      });
    },

    createExit: (exit: {
      produto_id: string;
      quantidade: number;
      servidor_almoxarifado: string;
      data?: string;
      setor_responsavel?: string;
      servidor_retirada?: string;
      matricula: string;
    }): Promise<{ success: boolean; message: string }> =>
      this.request('/saida', {
        method: 'POST',
        body: JSON.stringify(exit),
      }),
  };

  // Dashboard
  dashboard = {
    getStats: (): Promise<DashboardStats> =>
      this.request<{ success: boolean; data: DashboardStats }>('/dashboard/stats').then(res => res.data),

    getRecentMovements: (limit: number = 5): Promise<Movement[]> =>
      this.request<{ success: boolean; data: Movement[] }>(`/dashboard/recent-movements?limit=${limit}`).then(res => res.data),

    getLowStockProducts: (limit: number = 5): Promise<Product[]> =>
      this.request<{ success: boolean; data: Product[] }>(`/dashboard/low-stock?limit=${limit}`).then(res => res.data),
  };

  // Files
  files = {
    getAll: (): Promise<{ _id: string; fileId: string; filename: string; data_inicial: string; data_final: string; uploadDate: string; length?: number }[]> =>
      this.request('/formularios'),

    upload: (formData: FormData): Promise<{ _id: string; filename: string; length: number; uploadDate: string }> => {
      return fetch(`${API_BASE_URL}/formularios`, {
        method: 'POST',
        body: formData,
      }).then(res => {
        if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
        return res.json();
      });
    },

    view: (fileId: string): Promise<Blob> =>
      fetch(`${API_BASE_URL}/formularios/${fileId}/view`).then(res => res.blob()),

    download: async (fileId: string, filename?: string): Promise<void> => {
      const response = await fetch(`${API_BASE_URL}/formularios/${fileId}/download`);
      if (!response.ok) throw new Error(`Failed to download file: ${response.statusText}`);
      const blob = await response.blob();
      const downloadFilename = filename || response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 'formulario.pdf';
      downloadBlob(blob, downloadFilename);
    },

    delete: (fileId: string): Promise<void> =>
      this.request(`/formularios/${fileId}`, {
        method: 'DELETE',
      }),
  };

  // Setores
  setores = {
    getAll: (): Promise<string[]> =>
      this.request<{ success: boolean; data: string[] }>('/produtos/setores').then(res => res.data),
  };

  // Reports
  reports = {
    getStockPDF: async (): Promise<void> => {
      const response = await fetch(`${API_BASE_URL}/reports/estoque/pdf`);
      if (!response.ok) throw new Error(`Failed to download stock PDF: ${response.statusText}`);
      const blob = await response.blob();
      const filename = response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 'relatorio-estoque.pdf';
      downloadBlob(blob, filename);
    },

    getHistoryPDF: async (params?: {
      type?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
    }): Promise<void> => {
      const searchParams = new URLSearchParams();
      if (params?.type) searchParams.append('type', params.type);
      if (params?.startDate) searchParams.append('startDate', params.startDate);
      if (params?.endDate) searchParams.append('endDate', params.endDate);
      if (params?.search) searchParams.append('search', params.search);

      const response = await fetch(`${API_BASE_URL}/reports/historico/pdf?${searchParams.toString()}`);
      if (!response.ok) throw new Error(`Failed to download history PDF: ${response.statusText}`);
      const blob = await response.blob();
      const filename = response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 'relatorio-historico.pdf';
      downloadBlob(blob, filename);
    },

    getExcelReport: async (): Promise<void> => {
      const response = await fetch(`${API_BASE_URL}/reports/excel`);
      if (!response.ok) throw new Error(`Failed to download Excel report: ${response.statusText}`);
      const blob = await response.blob();
      const filename = response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 'relatorio-completo.xlsx';
      downloadBlob(blob, filename);
    },
  };
}

export const api = new ApiService();

// Re-export types for convenience
export type { Product, Movement, MovementFilter, DashboardStats } from '@/types/stock';
