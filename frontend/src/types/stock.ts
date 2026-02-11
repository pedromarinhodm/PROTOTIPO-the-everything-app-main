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
  nota_fiscal_id?: string;
  nota_fiscal_filename?: string;
  totalEntradas?: number;
  setor?: string;
  estoqueMinimo?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Movement {
  _id: string;
  produto_id: {
    _id: string;
    descricao: string;
    codigo: string;
  };
  tipo: 'entrada' | 'saida';
  quantidade: number;
  data: string;
  servidor_almoxarifado?: string;
  setor_responsavel?: string;
  servidor_retirada?: string;
  observacoes?: string;
  setor?: string;
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

export interface ChartFilters {
  startDate: Date | undefined;
  endDate: Date | undefined;
  tipo: 'entrada' | 'saida' | 'ambos';
  productId: string;
  setor: string;
}

export interface ChartDataPoint {
  name: string;
  entradas: number;
  saidas: number;
}
