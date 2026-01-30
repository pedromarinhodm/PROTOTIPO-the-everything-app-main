/**
 * Service: Movement
 * Lógica de negócio para movimentações
 */

const Movement = require('../models/Movement');
const Product = require('../models/Product');
const productService = require('./productService');

/**
 * Registra uma entrada de estoque
 */
const createEntry = async (entryData) => {
  const { produto, quantidade, data, observacoes } = entryData;

  // Procura produto existente pela descrição
  let existingProduct = await Product.findOne({
    descricao: { $regex: new RegExp(`^${produto}$`, 'i') }
  });

  if (existingProduct) {
    // Incrementa quantidade do produto existente
    existingProduct.quantidade += quantidade;
    await existingProduct.save();
  } else {
    // Cria novo produto
    existingProduct = await productService.createProduct({
      descricao: produto,
      quantidade,
    });
  }

  // Cria registro de movimentação
  const movement = new Movement({
    produto,
    tipo: 'entrada',
    quantidade,
    data: data || new Date(),
    observacoes: observacoes || '',
  });

  await movement.save();
  return movement;
};

/**
 * Registra uma saída de estoque
 */
const createExit = async (exitData) => {
  const { produto_id, quantidade, servidor_almoxarifado, data, setor_responsavel, servidor_retirada } = exitData;

  // Busca produto
  const produto = await Product.findById(produto_id);
  if (!produto) {
    throw new Error('Produto não encontrado');
  }

  // Verifica estoque disponível
  if (produto.quantidade < quantidade) {
    throw new Error('Estoque insuficiente');
  }

  // Atualiza quantidade
  produto.quantidade -= quantidade;
  await produto.save();

  // Cria registro de movimentação
  const movement = new Movement({
    produto_id,
    tipo: 'saida',
    quantidade,
    data: data || new Date(),
    servidor_almoxarifado,
    setor_responsavel,
    servidor_retirada,
  });

  await movement.save();
  return movement;
};

/**
 * Lista movimentações com filtros
 */
const getMovements = async (filters = {}) => {
  const { search, tipo, startDate, endDate, limit } = filters;

  let query = {};

  // Filtro por tipo
  if (tipo && tipo !== 'all') {
    query.tipo = tipo;
  }

  // Filtro por busca no produto
  if (search) {
    query.produto = { $regex: search, $options: 'i' };
  }

  // Filtro por data
  if (startDate || endDate) {
    query.data = {};
    if (startDate) {
      query.data.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.data.$lte = end;
    }
  }

  let queryBuilder = Movement.find(query).sort({ data: -1, createdAt: -1 });

  if (limit) {
    queryBuilder = queryBuilder.limit(limit);
  }

  const movements = await queryBuilder;
  return movements;
};

/**
 * Obtém estatísticas de movimentações
 */
const getMovementStats = async () => {
  const movements = await Movement.find({});
  
  const totalEntries = movements
    .filter(m => m.tipo === 'entrada')
    .reduce((sum, m) => sum + m.quantidade, 0);
    
  const totalExits = movements
    .filter(m => m.tipo === 'saida')
    .reduce((sum, m) => sum + m.quantidade, 0);

  return {
    totalEntries,
    totalExits,
    totalMovements: movements.length,
  };
};

/**
 * Deleta movimentações de um produto
 */
const deleteMovementsByProduct = async (produto) => {
  await Movement.deleteMany({ produto: { $regex: new RegExp(`^${produto}$`, 'i') } });
};

module.exports = {
  createEntry,
  createExit,
  getMovements,
  getMovementStats,
  deleteMovementsByProduct,
};
