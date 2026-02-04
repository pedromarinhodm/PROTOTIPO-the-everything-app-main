/**
 * Service: Movement
 * Lógica de negócio para movimentações
 */

import Movement from '../models/Movement.js';
import Product from '../models/Product.js';
import productService from './productService.js';

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

  let matchConditions = {};

  // Filtro por tipo
  if (tipo && tipo !== 'all') {
    matchConditions.tipo = tipo;
  }

  // Filtro por data
  if (startDate || endDate) {
    matchConditions.data = {};
    if (startDate) {
      matchConditions.data.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchConditions.data.$lte = end;
    }
  }

  // Construir pipeline de agregação
  let pipeline = [
    {
      $lookup: {
        from: 'produtos',
        localField: 'produto_id',
        foreignField: '_id',
        as: 'produto_id'
      }
    },
    {
      $unwind: '$produto_id'
    }
  ];

  // Adicionar filtro de busca se fornecido
  if (search) {
    pipeline.push({
      $match: {
        ...matchConditions,
        'produto_id.descricao': { $regex: search, $options: 'i' }
      }
    });
  } else if (Object.keys(matchConditions).length > 0) {
    pipeline.push({
      $match: matchConditions
    });
  }

  // Ordenação
  pipeline.push({
    $sort: { data: -1, createdAt: -1 }
  });

  // Limitação se especificada
  if (limit) {
    pipeline.push({
      $limit: limit
    });
  }

  const movements = await Movement.aggregate(pipeline);
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

export default {
  createEntry,
  createExit,
  getMovements,
  getMovementStats,
  deleteMovementsByProduct,
};
