import { supabase } from '../db/supabaseClient.js';
import productService from './productService.js';

const mapMovementRow = (movement, productRow) => ({
  _id: movement.id,
  produto_id: {
    _id: productRow.id,
    codigo: productRow.codigo,
    descricao: productRow.descricao,
  },
  tipo: movement.tipo,
  quantidade: movement.quantidade,
  data: movement.data,
  servidor_almoxarifado: movement.servidor_almoxarifado,
  setor_responsavel: movement.setor_responsavel,
  servidor_retirada: movement.servidor_retirada,
  observacoes: movement.observacoes,
  setor: movement.setor,
  createdAt: movement.created_at,
});

const getProductByIdRaw = async (id) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

const getProductByDescription = async (descricao) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .ilike('descricao', descricao)
    .limit(1);

  if (error) throw error;
  return data?.[0] || null;
};

const createEntry = async (entryData) => {
  const produto = entryData.produto ?? entryData.descricao;
  const quantidade = Number(entryData.quantidade);
  const data = entryData.data ?? entryData.data_entrada;
  const servidor_almoxarifado = entryData.servidor_almoxarifado;

  if (!produto || !String(produto).trim()) {
    throw new Error('Descricao do produto e obrigatoria');
  }
  if (!Number.isFinite(quantidade) || quantidade <= 0) {
    throw new Error('Quantidade invalida');
  }
  if (!servidor_almoxarifado || !String(servidor_almoxarifado).trim()) {
    throw new Error('Servidor do almoxarifado e obrigatorio');
  }

  let existingProduct = await getProductByDescription(String(produto).trim());

  if (existingProduct) {
    if (entryData.nota_fiscal_id) {
      const { error: updateError } = await supabase
        .from('products')
        .update({
          nota_fiscal_id: entryData.nota_fiscal_id,
          nota_fiscal_filename: entryData.nota_fiscal_filename || null,
        })
        .eq('id', existingProduct.id);

      if (updateError) throw updateError;
      existingProduct = {
        ...existingProduct,
        nota_fiscal_id: entryData.nota_fiscal_id,
        nota_fiscal_filename: entryData.nota_fiscal_filename || null,
      };
    }
  } else {
    const created = await productService.createProduct({
      descricao: produto,
      unidade: entryData.unidade || '',
      nota_fiscal_id: entryData.nota_fiscal_id || null,
      nota_fiscal_filename: entryData.nota_fiscal_filename || null,
    });

    existingProduct = {
      id: created._id,
      codigo: created.codigo,
      descricao: created.descricao,
    };
  }

  let movementDate = data;
  if (typeof data === 'string' && data.length === 10) {
    movementDate = `${data}T12:00:00.000Z`;
  } else if (!data) {
    movementDate = new Date().toISOString();
  }

  const payload = {
    produto_id: existingProduct.id,
    tipo: 'entrada',
    quantidade,
    data: movementDate,
    servidor_almoxarifado: servidor_almoxarifado || 'Sistema',
    observacoes: entryData.observacoes || null,
  };

  const { data: movement, error } = await supabase
    .from('movements')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;

  return mapMovementRow(movement, existingProduct);
};

const createExit = async (exitData) => {
  const { produto_id, quantidade, servidor_almoxarifado, data, setor_responsavel, servidor_retirada, observacoes } = exitData;

  const product = await getProductByIdRaw(produto_id);
  if (!product) {
    throw new Error('Produto nao encontrado');
  }

  const currentQuantity = await productService.calculateProductQuantity(produto_id);
  if (currentQuantity < Number(quantidade)) {
    throw new Error('Estoque insuficiente');
  }

  let movementDate = data;
  if (typeof data === 'string' && data.length === 10) {
    movementDate = `${data}T12:00:00.000Z`;
  } else if (!data) {
    movementDate = new Date().toISOString();
  }

  const payload = {
    produto_id,
    tipo: 'saida',
    quantidade: Number(quantidade),
    data: movementDate,
    servidor_almoxarifado,
    setor_responsavel: setor_responsavel || null,
    servidor_retirada: servidor_retirada || null,
    observacoes: observacoes || null,
    setor: exitData.setor || null,
  };

  const { data: movement, error } = await supabase
    .from('movements')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;

  return mapMovementRow(movement, product);
};

const getMovements = async (filters = {}) => {
  const { search, tipo, startDate, endDate, limit, productId, setor } = filters;

  let query = supabase
    .from('movements')
    .select('*')
    .order('data', { ascending: false })
    .order('created_at', { ascending: false });

  if (tipo && tipo !== 'all' && tipo !== 'ambos') {
    query = query.eq('tipo', tipo);
  }

  if (productId && productId !== 'todos') {
    query = query.eq('produto_id', productId);
  }

  // Nota: O filtro por setor será aplicado em memória após buscar os dados
  // para evitar problemas com caracteres especiais na query do Supabase

  // Helper para extrair data no formato YYYY-MM-DD de diferentes formatos de entrada
  const extractDatePart = (dateString) => {
    if (!dateString) return null;
    // Se já estiver no formato YYYY-MM-DD, retorna como está
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    // Se for ISO format (2026-02-13T03:00:00.000Z), extrai a parte da data
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    return dateString;
  };

  const formattedStartDate = extractDatePart(startDate);
  const formattedEndDate = extractDatePart(endDate);

  if (formattedStartDate) {
    query = query.gte('data', `${formattedStartDate}T00:00:00.000Z`);
  }

  if (formattedEndDate) {
    query = query.lte('data', `${formattedEndDate}T23:59:59.999Z`);
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data: movements, error } = await query;
  if (error) throw error;

  if (!movements?.length) {
    return [];
  }

  const productIds = [...new Set(movements.map((movement) => movement.produto_id))];

  const { data: products, error: productError } = await supabase
    .from('products')
    .select('id,codigo,descricao')
    .in('id', productIds);

  if (productError) throw productError;

  const productMap = new Map((products || []).map((product) => [product.id, product]));

  let mapped = movements
    .map((movement) => {
      const product = productMap.get(movement.produto_id);
      if (!product) return null;
      return mapMovementRow(movement, product);
    })
    .filter(Boolean);

  if (search) {
    const normalizedSearch = search.toLowerCase();
    mapped = mapped.filter((movement) => movement.produto_id.descricao.toLowerCase().includes(normalizedSearch));
  }

  // Aplicar filtro por setor em memória (após mapear os produtos)
  if (setor && setor !== 'todos') {
    mapped = mapped.filter((movement) => 
      movement.setor_responsavel === setor || movement.setor === setor
    );
  }

  return mapped;
};

const getMovementStats = async () => {
  const { data, error } = await supabase
    .from('movements')
    .select('tipo,quantidade');

  if (error) throw error;

  const totalEntries = (data || [])
    .filter((movement) => movement.tipo === 'entrada')
    .reduce((sum, movement) => sum + Number(movement.quantidade || 0), 0);

  const totalExits = (data || [])
    .filter((movement) => movement.tipo === 'saida')
    .reduce((sum, movement) => sum + Number(movement.quantidade || 0), 0);

  return {
    totalEntries,
    totalExits,
    totalMovements: (data || []).length,
  };
};

const deleteMovementsByProduct = async (produtoId) => {
  const { error } = await supabase
    .from('movements')
    .delete()
    .eq('produto_id', produtoId);

  if (error) throw error;
};

export default {
  createEntry,
  createExit,
  getMovements,
  getMovementStats,
  deleteMovementsByProduct,
};
