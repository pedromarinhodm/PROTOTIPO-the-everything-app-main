/**
 * Service: Product
 * Lógica de negócio para produtos
 */

import Product from '../models/Product.js';
import Movement from '../models/Movement.js';

/**
 * Gera o próximo código de produto
 */
const getNextProductCode = async () => {
  const lastProduct = await Product.findOne({})
    .sort({ codigo: -1 })
    .select('codigo');
  
  if (!lastProduct || !lastProduct.codigo) {
    return 1;
  }

  return lastProduct.codigo + 1;
};

/**
 * Cria um novo produto
 */
const createProduct = async (productData) => {
  const codigo = await getNextProductCode();
  
  const product = new Product({
    ...productData,
    codigo,
  });

  await product.save();
  return product;
};

/**
 * Lista todos os produtos com busca opcional
 */
const getAllProducts = async (searchQuery = '') => {
  let query = {};

  if (searchQuery) {
    query = {
      $or: [
        { descricao: { $regex: searchQuery, $options: 'i' } },
        { codigo: { $regex: searchQuery, $options: 'i' } },
        { fornecedor: { $regex: searchQuery, $options: 'i' } },
      ],
    };
  }

  // Obter a soma total de entradas por produto
  const entrySums = await Movement.aggregate([
    { $match: { tipo: 'entrada' } },
    {
      $group: {
        _id: '$produto_id',
        totalEntries: { $sum: '$quantidade' }
      }
    }
  ]);

  // Criar mapa de produto_id para soma total de entradas
  const entrySumMap = new Map();
  entrySums.forEach(sum => {
    entrySumMap.set(sum._id.toString(), sum.totalEntries);
  });

  const products = await Product.find(query).sort({ descricao: 1 });

  // Adicionar totalEntries a cada produto
  const productsWithEntries = products.map(product => ({
    ...product.toObject(),
    totalEntries: entrySumMap.get(product._id.toString()) || 0,
  }));

  return productsWithEntries;
};

/**
 * Obtém um produto por ID
 */
const getProductById = async (id) => {
  const product = await Product.findById(id);
  return product;
};

/**
 * Atualiza um produto
 */
const updateProduct = async (id, updateData) => {
  const product = await Product.findByIdAndUpdate(
    id,
    { ...updateData },
    { new: true, runValidators: true }
  );
  return product;
};

/**
 * Deleta um produto
 */
const deleteProduct = async (id) => {
  const product = await Product.findByIdAndDelete(id);
  return product;
};

/**
 * Atualiza a quantidade de um produto
 */
const updateProductQuantity = async (id, quantityChange) => {
  const product = await Product.findById(id);
  
  if (!product) {
    throw new Error('Produto não encontrado');
  }

  const newQuantity = product.quantidade + quantityChange;
  
  if (newQuantity < 0) {
    throw new Error('Estoque insuficiente');
  }

  product.quantidade = newQuantity;
  await product.save();
  
  return product;
};

/**
 * Obtém estatísticas do estoque
 */
const getStockStats = async () => {
  const totalProducts = await Product.countDocuments();

  // Obter a soma total de entradas por produto
  const entrySums = await Movement.aggregate([
    { $match: { tipo: 'entrada' } },
    {
      $group: {
        _id: '$produto_id',
        totalEntries: { $sum: '$quantidade' }
      }
    }
  ]);

  // Criar mapa de produto_id para soma total de entradas
  const entrySumMap = new Map();
  entrySums.forEach(sum => {
    entrySumMap.set(sum._id.toString(), sum.totalEntries);
  });

  // Obter todos os produtos
  const allProducts = await Product.find({});

  // Contar produtos com estoque baixo baseado em 30% da soma total de entradas
  const lowStockProducts = allProducts.filter(product => {
    const totalEntries = entrySumMap.get(product._id.toString()) || 0;
    const threshold = totalEntries * 0.3; // 30% da soma total de entradas
    return product.quantidade <= threshold;
  }).length;

  const totalStock = allProducts.reduce((sum, p) => sum + p.quantidade, 0);

  return {
    totalProducts,
    lowStockProducts,
    totalStock,
  };
};

/**
 * Obtém produtos com estoque baixo
 */
const getLowStockProducts = async (limit = 10) => {
  // Primeiro, obter a soma total de entradas por produto
  const entrySums = await Movement.aggregate([
    { $match: { tipo: 'entrada' } },
    {
      $group: {
        _id: '$produto_id',
        totalEntries: { $sum: '$quantidade' }
      }
    }
  ]);

  // Criar mapa de produto_id para soma total de entradas
  const entrySumMap = new Map();
  entrySums.forEach(sum => {
    entrySumMap.set(sum._id.toString(), sum.totalEntries);
  });

  // Obter todos os produtos
  const allProducts = await Product.find({});

  // Filtrar produtos com estoque baixo baseado em 30% da soma total de entradas
  const lowStockProducts = allProducts.filter(product => {
    const totalEntries = entrySumMap.get(product._id.toString()) || 0;
    const threshold = totalEntries * 0.3; // 30% da soma total de entradas
    return product.quantidade <= threshold;
  });

  // Ordenar por quantidade crescente e limitar
  return lowStockProducts
    .sort((a, b) => a.quantidade - b.quantidade)
    .slice(0, limit);
};

export default {
  getNextProductCode,
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateProductQuantity,
  getStockStats,
  getLowStockProducts,
};
