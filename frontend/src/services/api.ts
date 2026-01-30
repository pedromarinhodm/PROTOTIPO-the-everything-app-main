/**
 * API Service
 * Cliente HTTP para comunicação com o backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Função auxiliar para fazer requisições HTTP
 */
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    // Para downloads de arquivos, retorna a resposta diretamente
    if (options.headers && (options.headers as Record<string, string>)['Accept'] === 'application/octet-stream') {
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      return response as unknown as T;
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Erro na requisição');
    }

    return data;
  } catch (error) {
    console.error(`Erro na API (${endpoint}):`, error);
    throw error;
  }
}

// ==================== TYPES ====================

export interface Product {
  _id: string;
  codigo: number;
  descricao: string;
  quantidade: number;
  unidade: string;
  descricao_complementar?: string;
  validade?: string;
  fornecedor?: string;
  numero_processo?: string;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Movement {
  _id: string;
  id: string;
  produto: string;
  produto_id: {
    descricao: string;
  };
  tipo: 'entrada' | 'saida';
  quantidade: number;
  data: string;
  servidor_almoxarifado?: string;
  setor_responsavel?: string;
  servidor_retirada?: string;
  observacoes?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalEntries: number;
  totalExits: number;
  lowStockProducts: number;
  totalMovements: number;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

export interface FileInfo {
  _id: string;
  fileId: string;
  filename: string;
  data_inicial: string;
  data_final: string;
  uploadDate: string;
}

// ==================== PRODUCTS API ====================

export const productsAPI = {
  /**
   * Lista todos os produtos
   */
  async getAll(search?: string): Promise<Product[]> {
    const response = await fetchAPI<Product[]>('/api/produtos');
    return response;
  },

  /**
   * Obtém um produto por ID
   */
  async getById(id: string): Promise<Product> {
    // Note: backend doesn't have individual product endpoint, so we'll filter from all
    const products = await this.getAll();
    const product = products.find(p => p._id === id);
    if (!product) throw new Error('Produto não encontrado');
    return product;
  },

  /**
   * Cria um novo produto
   */
  async create(product: Omit<Product, '_id' | 'id' | 'codigo' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const response = await fetchAPI<{ success: boolean; produto: Product }>('/api/produtos', {
      method: 'POST',
      body: JSON.stringify(product),
    });
    return response.produto;
  },

  /**
   * Atualiza um produto
   */
  async update(id: string, product: Partial<Product>): Promise<Product> {
    const response = await fetchAPI<{ success: boolean; produto: Product }>(`/api/produtos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
    return response.produto;
  },

  /**
   * Deleta um produto
   */
  async delete(id: string): Promise<void> {
    await fetchAPI<{ success: boolean; message: string }>(`/api/produtos/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Obtém o próximo código de produto
   */
  async getNextCode(): Promise<number> {
    // Backend generates code automatically, so we'll return a placeholder
    return 1;
  },
};

// ==================== MOVEMENTS API ====================

export interface EntryData {
  descricao: string;
  quantidade: number;
  unidade: string;
  servidor_almoxarifado: string;
  data_entrada: string;
}

export interface ExitData {
  produto_id: string;
  quantidade: number;
  servidor_almoxarifado: string;
  data: string;
  setor_responsavel: string;
  servidor_retirada: string;
}

export interface MovementFilters {
  search?: string;
  tipo?: 'entrada' | 'saida' | 'all';
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export const movementsAPI = {
  /**
   * Lista movimentações com filtros
   */
  async getAll(filters?: MovementFilters): Promise<Movement[]> {
    const response = await fetchAPI<Movement[]>('/api/movimentacoes');
    return response;
  },

  /**
   * Registra uma entrada
   */
  async createEntry(entry: EntryData): Promise<{ success: boolean; message: string }> {
    const response = await fetchAPI<{ success: boolean; message: string }>('/api/entrada', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
    return response;
  },

  /**
   * Registra uma entrada simplificada (como no SCGES)
   */
  async createSimplifiedEntry(entry: {
    produto: string;
    quantidade: number;
    data?: string;
    observacoes?: string;
  }): Promise<{ success: boolean; message: string }> {
    const response = await fetchAPI<{ success: boolean; message: string }>('/api/entrada', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
    return response;
  },

  /**
   * Registra uma saída (como no SCGES)
   */
  async createSaida(exit: ExitData): Promise<{ success: boolean; message: string }> {
    const response = await fetchAPI<{ success: boolean; message: string }>('/api/saida', {
      method: 'POST',
      body: JSON.stringify(exit),
    });
    return response;
  },
};

// ==================== DASHBOARD API ====================

export const dashboardAPI = {
  /**
   * Obtém estatísticas do dashboard (calculadas no frontend)
   */
  async getStats(): Promise<DashboardStats> {
    const [products, movements] = await Promise.all([
      productsAPI.getAll(),
      movementsAPI.getAll()
    ]);

    const totalProducts = products.length;
    const totalEntries = movements.filter(m => m.tipo === 'entrada').length;
    const totalExits = movements.filter(m => m.tipo === 'saida').length;
    const lowStockProducts = products.filter(p => p.quantidade <= 5).length;
    const totalMovements = movements.length;

    return {
      totalProducts,
      totalEntries,
      totalExits,
      lowStockProducts,
      totalMovements
    };
  },

  /**
   * Obtém movimentações recentes
   */
  async getRecentMovements(limit: number = 5): Promise<Movement[]> {
    const movements = await movementsAPI.getAll();
    return movements.slice(0, limit);
  },

  /**
   * Obtém produtos com estoque baixo
   */
  async getLowStockProducts(limit: number = 5): Promise<Product[]> {
    const products = await productsAPI.getAll();
    return products.filter(p => p.quantidade <= 10).slice(0, limit);
  },
};

// ==================== REPORTS API ====================

export const reportsAPI = {
  /**
   * Gera e baixa relatório de estoque em PDF
   */
  async downloadStockPDF(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/reports/estoque/pdf`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Erro ao gerar relatório PDF');
    }

    // Cria um blob e força o download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'relatorio-estoque.pdf';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  /**
   * Gera e baixa relatório de histórico em PDF
   */
  async downloadHistoryPDF(filters?: { type?: string; startDate?: string; endDate?: string }): Promise<void> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const url = `${API_BASE_URL}/api/reports/historico/pdf${params.toString() ? '?' + params.toString() : ''}`;

    const response = await fetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Erro ao gerar relatório PDF');
    }

    // Cria um blob e força o download
    const blob = await response.blob();
    const urlBlob = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = urlBlob;
    a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'relatorio-historico.pdf';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(urlBlob);
    document.body.removeChild(a);
  },

  /**
   * Gera e baixa relatório completo em Excel (não implementado no backend)
   */
  async downloadExcel(): Promise<void> {
    // TODO: Implement Excel generation
    throw new Error('Relatório Excel não implementado');
  },
};

// ==================== FILES API ====================

export const filesAPI = {
  /**
   * Lista todos os arquivos armazenados
   */
  async getAll(): Promise<FileInfo[]> {
    const response = await fetchAPI<FileInfo[]>('/api/formularios');
    return response;
  },

  /**
   * Baixa um arquivo por ID
   */
  async download(id: string): Promise<void> {
    const url = `${API_BASE_URL}/api/formularios/${id}/download`;
    window.open(url, '_blank');
  },

  /**
   * Deleta um arquivo
   */
  async delete(id: string): Promise<void> {
    await fetchAPI<{ success: boolean }>(`/api/formularios/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Faz upload de arquivo (multipart/form-data). Campo esperado: 'arquivo' (File),
   * e campos adicionais: 'data_inicial', 'data_final'
   */
  async upload(fd: FormData): Promise<{ message: string; id: string }>{
    const url = `${API_BASE_URL}/api/formularios`;

    const response = await fetch(url, {
      method: 'POST',
      body: fd,
      // não definir Content-Type: o browser faz o boundary automaticamente
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.message || 'Erro ao enviar arquivo');

    return data;
  },
};

// ==================== HEALTH CHECK ====================

export const healthAPI = {
  /**
   * Verifica se a API está online
   */
  async check(): Promise<boolean> {
    try {
      // Try to fetch products as health check
      await fetchAPI('/api/produtos');
      return true;
    } catch {
      return false;
    }
  },
};

// Export default API object
export const api = {
  products: productsAPI,
  movements: movementsAPI,
  dashboard: dashboardAPI,
  reports: reportsAPI,
  files: filesAPI,
  health: healthAPI,
};

export default api;
