export interface Product {
  _id: string;
  codigo: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  setor: string;
  estoqueMinimo?: number;
}

export interface Movement {
  _id: string;
  tipo: "entrada" | "saida";
  quantidade: number;
  data: string;
  produto_id: {
    _id: string;
    descricao: string;
    codigo: string;
  };
  setor?: string;
  observacao?: string;
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
  tipo: "entrada" | "saida" | "ambos";
  productId: string;
  setor: string;
}

export interface ChartDataPoint {
  name: string;
  entradas: number;
  saidas: number;
}
