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
  const produto = entryData.produto ?? entryData.descricao;
  const quantidade = Number(entryData.quantidade);
  const data = entryData.data ?? entryData.data_entrada;
  const servidor_almoxarifado = entryData.servidor_almoxarifado;
  const observacoes = entryData.observacoes;
  const nota_fiscal_id = entryData.nota_fiscal_id;
  const nota_fiscal_filename = entryData.nota_fiscal_filename;

  if (!produto || !String(produto).trim()) {
    throw new Error('Descrição do produto é obrigatória');
  }
  if (!Number.isFinite(quantidade) || quantidade <= 0) {
    throw new Error('Quantidade inválida');
  }
  if (!servidor_almoxarifado || !String(servidor_almoxarifado).trim()) {
    throw new Error('Servidor do almoxarifado é obrigatório');
  }

  // Procura produto existente pela descrição
  let existingProduct = await Product.findOne({
    descricao: { $regex: new RegExp(`^${produto}$`, 'i') }
  });

  if (existingProduct) {
    // Se há nota fiscal, atualiza o produto
    if (nota_fiscal_id) {
      existingProduct.nota_fiscal_id = nota_fiscal_id;
      existingProduct.nota_fiscal_filename = nota_fiscal_filename;
      await existingProduct.save();
    }
  } else {
    // Cria novo produto com nota fiscal se fornecida
    const productData = {
      descricao: produto,
      quantidade,
    };
    
    if (nota_fiscal_id) {
      productData.nota_fiscal_id = nota_fiscal_id;
      productData.nota_fiscal_filename = nota_fiscal_filename;
    }
    
    existingProduct = await productService.createProduct(productData);
  }

  // Cria registro de movimentação
  // Converte string de data para Date (adiciona T12:00:00 para evitar problema de fuso)
  let movementDate = data;
  if (typeof data === 'string' && data.length === 10) {
    movementDate = new Date(data + 'T12:00:00');
  } else if (!data) {
    movementDate = new Date();
  }

  const movement = new Movement({
    produto_id: existingProduct._id,
    tipo: 'entrada',
    quantidade,
    data: movementDate,
    servidor_almoxarifado: servidor_almoxarifado || 'Sistema',
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

  // Verifica estoque disponível calculando dinamicamente
  const productService = await import('./productService.js');
  const currentQuantity = await productService.default.calculateProductQuantity(produto_id);
  
  if (currentQuantity < quantidade) {
    throw new Error('Estoque insuficiente');
  }

  // Cria registro de movimentação
  // Converte string de data para Date (adiciona T12:00:00 para evitar problema de fuso)
  let movementDate = data;
  if (typeof data === 'string' && data.length === 10) {
    movementDate = new Date(data + 'T12:00:00');
  } else if (!data) {
    movementDate = new Date();
  }

  const movement = new Movement({
    produto_id,
    tipo: 'saida',
    quantidade,
    data: movementDate,
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

  // Ordenação: primeiro por data (sem horário), depois por createdAt
  // Usando $dateTrunc para ignorar o horário na ordenação
  pipeline.push({
    $addFields: {
      dataDia: { $dateTrunc: { date: "$data", unit: "day" } }
    }
  });
  
  pipeline.push({
    $sort: { dataDia: -1, createdAt: -1 }
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
const deleteMovementsByProduct = async (produtoId) => {
  await Movement.deleteMany({ produto_id: produtoId });
};

export default {
  createEntry,
  createExit,
  getMovements,
  getMovementStats,
  deleteMovementsByProduct,
};
