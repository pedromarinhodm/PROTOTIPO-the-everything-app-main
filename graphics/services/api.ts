import { DashboardStats, Movement, Product } from "@/types/stock";

// Mock data for demonstration purposes
const mockProducts: Product[] = [
  { _id: "1", codigo: "MAT-001", descricao: "Papel A4 (Resma)", quantidade: 45, unidade: "resma", setor: "Almoxarifado", estoqueMinimo: 50 },
  { _id: "2", codigo: "MAT-002", descricao: "Caneta Esferográfica Azul", quantidade: 120, unidade: "unid", setor: "Almoxarifado", estoqueMinimo: 100 },
  { _id: "3", codigo: "MAT-003", descricao: "Grampeador de Mesa", quantidade: 8, unidade: "unid", setor: "Administrativo", estoqueMinimo: 10 },
  { _id: "4", codigo: "MAT-004", descricao: "Toner para Impressora", quantidade: 3, unidade: "unid", setor: "TI", estoqueMinimo: 5 },
  { _id: "5", codigo: "MAT-005", descricao: "Pasta Classificadora", quantidade: 200, unidade: "unid", setor: "Almoxarifado", estoqueMinimo: 50 },
  { _id: "6", codigo: "MAT-006", descricao: "Clips de Papel", quantidade: 500, unidade: "cx", setor: "Almoxarifado", estoqueMinimo: 100 },
  { _id: "7", codigo: "MAT-007", descricao: "Envelope Pardo A4", quantidade: 15, unidade: "unid", setor: "Administrativo", estoqueMinimo: 30 },
  { _id: "8", codigo: "MAT-008", descricao: "Fita Adesiva", quantidade: 25, unidade: "rolo", setor: "Almoxarifado", estoqueMinimo: 20 },
];

const mockMovements: Movement[] = [
  { _id: "m1", tipo: "entrada", quantidade: 100, data: "2026-02-10T10:00:00Z", produto_id: { _id: "1", descricao: "Papel A4 (Resma)", codigo: "MAT-001" }, setor: "Almoxarifado" },
  { _id: "m2", tipo: "saida", quantidade: 55, data: "2026-02-10T14:30:00Z", produto_id: { _id: "1", descricao: "Papel A4 (Resma)", codigo: "MAT-001" }, setor: "Administrativo" },
  { _id: "m3", tipo: "entrada", quantidade: 200, data: "2026-02-09T09:00:00Z", produto_id: { _id: "2", descricao: "Caneta Esferográfica Azul", codigo: "MAT-002" }, setor: "Almoxarifado" },
  { _id: "m4", tipo: "saida", quantidade: 80, data: "2026-02-09T11:00:00Z", produto_id: { _id: "2", descricao: "Caneta Esferográfica Azul", codigo: "MAT-002" }, setor: "TI" },
  { _id: "m5", tipo: "entrada", quantidade: 10, data: "2026-02-08T08:00:00Z", produto_id: { _id: "4", descricao: "Toner para Impressora", codigo: "MAT-004" }, setor: "TI" },
  { _id: "m6", tipo: "saida", quantidade: 7, data: "2026-02-08T15:00:00Z", produto_id: { _id: "4", descricao: "Toner para Impressora", codigo: "MAT-004" }, setor: "TI" },
  { _id: "m7", tipo: "entrada", quantidade: 300, data: "2026-02-07T10:00:00Z", produto_id: { _id: "5", descricao: "Pasta Classificadora", codigo: "MAT-005" }, setor: "Almoxarifado" },
  { _id: "m8", tipo: "saida", quantidade: 100, data: "2026-02-07T16:00:00Z", produto_id: { _id: "5", descricao: "Pasta Classificadora", codigo: "MAT-005" }, setor: "Administrativo" },
  { _id: "m9", tipo: "entrada", quantidade: 50, data: "2026-02-06T09:30:00Z", produto_id: { _id: "6", descricao: "Clips de Papel", codigo: "MAT-006" }, setor: "Almoxarifado" },
  { _id: "m10", tipo: "saida", quantidade: 30, data: "2026-02-06T13:00:00Z", produto_id: { _id: "3", descricao: "Grampeador de Mesa", codigo: "MAT-003" }, setor: "Administrativo" },
  { _id: "m11", tipo: "entrada", quantidade: 75, data: "2026-02-05T08:00:00Z", produto_id: { _id: "7", descricao: "Envelope Pardo A4", codigo: "MAT-007" }, setor: "Administrativo" },
  { _id: "m12", tipo: "saida", quantidade: 60, data: "2026-02-05T14:00:00Z", produto_id: { _id: "7", descricao: "Envelope Pardo A4", codigo: "MAT-007" }, setor: "Administrativo" },
  { _id: "m13", tipo: "entrada", quantidade: 40, data: "2026-02-04T10:00:00Z", produto_id: { _id: "8", descricao: "Fita Adesiva", codigo: "MAT-008" }, setor: "Almoxarifado" },
  { _id: "m14", tipo: "saida", quantidade: 15, data: "2026-02-04T12:00:00Z", produto_id: { _id: "8", descricao: "Fita Adesiva", codigo: "MAT-008" }, setor: "Almoxarifado" },
  { _id: "m15", tipo: "entrada", quantidade: 500, data: "2026-01-30T09:00:00Z", produto_id: { _id: "6", descricao: "Clips de Papel", codigo: "MAT-006" }, setor: "Almoxarifado" },
  { _id: "m16", tipo: "saida", quantidade: 20, data: "2026-01-29T11:00:00Z", produto_id: { _id: "1", descricao: "Papel A4 (Resma)", codigo: "MAT-001" }, setor: "TI" },
  { _id: "m17", tipo: "entrada", quantidade: 150, data: "2026-01-28T10:00:00Z", produto_id: { _id: "2", descricao: "Caneta Esferográfica Azul", codigo: "MAT-002" }, setor: "Almoxarifado" },
  { _id: "m18", tipo: "saida", quantidade: 25, data: "2026-01-27T15:00:00Z", produto_id: { _id: "3", descricao: "Grampeador de Mesa", codigo: "MAT-003" }, setor: "Administrativo" },
];

const mockSetores = ["Almoxarifado", "Administrativo", "TI", "Financeiro", "RH"];

// Simulates async API calls with small delay
function delay(ms: number = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const api = {
  dashboard: {
    async getStats(): Promise<DashboardStats> {
      await delay();
      const totalEntries = mockMovements.filter((m) => m.tipo === "entrada").reduce((sum, m) => sum + m.quantidade, 0);
      const totalExits = mockMovements.filter((m) => m.tipo === "saida").reduce((sum, m) => sum + m.quantidade, 0);
      const lowStock = mockProducts.filter((p) => p.estoqueMinimo && p.quantidade <= p.estoqueMinimo * 0.3).length;
      return {
        totalProducts: mockProducts.length,
        totalEntries,
        totalExits,
        lowStockProducts: lowStock,
        totalMovements: mockMovements.length,
      };
    },

    async getRecentMovements(limit: number): Promise<Movement[]> {
      await delay();
      return [...mockMovements]
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, limit);
    },

    async getLowStockProducts(limit: number): Promise<Product[]> {
      await delay();
      return mockProducts
        .filter((p) => p.estoqueMinimo && p.quantidade <= p.estoqueMinimo)
        .slice(0, limit);
    },
  },

  products: {
    async getAll(): Promise<Product[]> {
      await delay();
      return mockProducts;
    },
  },

  movements: {
    async getAll(): Promise<Movement[]> {
      await delay();
      return mockMovements;
    },

    async getFiltered(filters: {
      startDate?: string;
      endDate?: string;
      tipo?: string;
      productId?: string;
      setor?: string;
    }): Promise<Movement[]> {
      await delay();
      let filtered = [...mockMovements];

      if (filters.startDate) {
        filtered = filtered.filter((m) => new Date(m.data) >= new Date(filters.startDate!));
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate!);
        end.setHours(23, 59, 59, 999);
        filtered = filtered.filter((m) => new Date(m.data) <= end);
      }
      if (filters.tipo && filters.tipo !== "ambos") {
        filtered = filtered.filter((m) => m.tipo === filters.tipo);
      }
      if (filters.productId && filters.productId !== "todos") {
        filtered = filtered.filter((m) => m.produto_id._id === filters.productId);
      }
      if (filters.setor && filters.setor !== "todos") {
        filtered = filtered.filter((m) => m.setor === filters.setor);
      }

      return filtered.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    },
  },

  setores: {
    async getAll(): Promise<string[]> {
      await delay();
      return mockSetores;
    },
  },
};
