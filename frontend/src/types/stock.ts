export interface Product {
  _id: string;
  id: string;
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
  tipo: 'entrada' | 'saida';
  quantidade: number;
  data: string;
  observacoes?: string;
  createdAt: string;
}

export interface MovementFilter {
  search?: string;
  tipo?: 'entrada' | 'saida' | 'all';
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface DashboardStats {
  totalProducts: number;
  totalEntries: number;
  totalExits: number;
  lowStockProducts: number;
  totalMovements: number;
}
