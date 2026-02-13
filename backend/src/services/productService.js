import { supabase } from '../db/supabaseClient.js';

const parseNumericCode = (codigo) => {
  const parsed = Number.parseInt(String(codigo ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapProductRow = (row, quantity = 0, totalEntries = 0) => ({
  _id: row.id,
  codigo: row.codigo,
  descricao: row.descricao,
  unidade: row.unidade || '',
  descricao_complementar: row.descricao_complementar || '',
  validade: row.validade || '',
  fornecedor: row.fornecedor || '',
  numero_processo: row.numero_processo || '',
  observacoes: row.observacoes || '',
  nota_fiscal_id: row.nota_fiscal_id || null,
  nota_fiscal_filename: row.nota_fiscal_filename || null,
  setor: row.setor || '',
  quantidade: quantity,
  totalEntradas: totalEntries,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const getMovementSummaries = async () => {
  const { data, error } = await supabase
    .from('movements')
    .select('produto_id,tipo,quantidade');

  if (error) throw error;

  const summaryByProduct = new Map();

  for (const movement of data || []) {
    const current = summaryByProduct.get(movement.produto_id) || { entries: 0, exits: 0 };

    if (movement.tipo === 'entrada') {
      current.entries += Number(movement.quantidade || 0);
    } else if (movement.tipo === 'saida') {
      current.exits += Number(movement.quantidade || 0);
    }

    summaryByProduct.set(movement.produto_id, current);
  }

  return summaryByProduct;
};

const calculateProductQuantity = async (productId) => {
  const summaries = await getMovementSummaries();
  const summary = summaries.get(productId) || { entries: 0, exits: 0 };
  return summary.entries - summary.exits;
};

const calculateTotalEntries = async (productId) => {
  const summaries = await getMovementSummaries();
  return (summaries.get(productId) || { entries: 0 }).entries;
};

const getNextProductCode = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('codigo');

  if (error) throw error;

  const maxCode = (data || []).reduce((max, row) => Math.max(max, parseNumericCode(row.codigo)), 0);
  return String(maxCode + 1).padStart(3, '0');
};

const createProduct = async (productData) => {
  const codigo = await getNextProductCode();

  const payload = {
    codigo,
    descricao: String(productData.descricao || '').trim(),
    unidade: productData.unidade || '',
    descricao_complementar: productData.descricao_complementar || '',
    validade: productData.validade || '',
    fornecedor: productData.fornecedor || '',
    numero_processo: productData.numero_processo || '',
    observacoes: productData.observacoes || '',
    nota_fiscal_id: productData.nota_fiscal_id || null,
    nota_fiscal_filename: productData.nota_fiscal_filename || null,
    setor: productData.setor || '',
  };

  const { data, error } = await supabase
    .from('products')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;

  return mapProductRow(data, 0, 0);
};

const getAllProducts = async (searchQuery = '') => {
  let query = supabase
    .from('products')
    .select('*')
    .order('descricao', { ascending: true });

  if (searchQuery) {
    const escaped = searchQuery.replace(/,/g, ' ');
    query = query.or(`descricao.ilike.%${escaped}%,codigo.ilike.%${escaped}%,fornecedor.ilike.%${escaped}%`);
  }

  const { data: productRows, error } = await query;
  if (error) throw error;

  const summaries = await getMovementSummaries();

  return (productRows || []).map((row) => {
    const summary = summaries.get(row.id) || { entries: 0, exits: 0 };
    return mapProductRow(row, summary.entries - summary.exits, summary.entries);
  });
};

const getProductById = async (id) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const summaries = await getMovementSummaries();
  const summary = summaries.get(data.id) || { entries: 0, exits: 0 };

  return mapProductRow(data, summary.entries - summary.exits, summary.entries);
};

const updateProduct = async (id, updateData) => {
  const payload = {
    descricao: updateData.descricao,
    unidade: updateData.unidade,
    descricao_complementar: updateData.descricao_complementar,
    validade: updateData.validade,
    fornecedor: updateData.fornecedor,
    numero_processo: updateData.numero_processo,
    observacoes: updateData.observacoes,
    nota_fiscal_id: updateData.nota_fiscal_id,
    nota_fiscal_filename: updateData.nota_fiscal_filename,
    setor: updateData.setor,
  };

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const totalEntries = await calculateTotalEntries(id);
  const quantity = await calculateProductQuantity(id);

  return mapProductRow(data, quantity, totalEntries);
};

const deleteProduct = async (id) => {
  const existing = await getProductById(id);
  if (!existing) return null;

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) throw error;

  return existing;
};

const getStockStats = async () => {
  const products = await getAllProducts();
  const totalProducts = products.length;

  const lowStockProducts = products.filter((product) => {
    const threshold = (Number(product.totalEntradas || 0) * 0.3);
    return Number(product.quantidade || 0) <= threshold;
  }).length;

  const totalStock = products.reduce((sum, product) => sum + Number(product.quantidade || 0), 0);

  return {
    totalProducts,
    lowStockProducts,
    totalStock,
  };
};

const getUniqueSetores = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('setor');

  if (error) throw error;

  return [...new Set((data || []).map((row) => (row.setor || '').trim()).filter(Boolean))];
};

const getLowStockProducts = async (limit = 10) => {
  const products = await getAllProducts();

  return products
    .filter((product) => {
      const threshold = (Number(product.totalEntradas || 0) * 0.3);
      return Number(product.quantidade || 0) <= threshold;
    })
    .sort((a, b) => Number(a.quantidade || 0) - Number(b.quantidade || 0))
    .slice(0, limit);
};

export default {
  getNextProductCode,
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getStockStats,
  getLowStockProducts,
  calculateProductQuantity,
  getUniqueSetores,
};
