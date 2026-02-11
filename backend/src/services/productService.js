/**
 * Service: Product
 * Lógica de negócio para produtos
 */

import Product from '../models/Product.js';
import Movement from '../models/Movement.js';

/**
 * Calcula a quantidade atual de um produto baseado nas movimentações
 * @param {string} productId - ID do produto
 * @returns {Promise<number>} - Quantidade calculada (entradas - saídas)
 */
const calculateProductQuantity = async (productId) => {
  const movements = await Movement.find({ produto_id: productId });
  
  const totalEntries = movements
    .filter(m => m.tipo === 'entrada')
    .reduce((sum, m) => sum + m.quantidade, 0);
    
  const totalExits = movements
    .filter(m => m.tipo === 'saida')
    .reduce((sum, m) => sum + m.quantidade, 0);
    
  return totalEntries - totalExits;
};

/**
 * Adiciona quantidade calculada a um produto ou array de produtos
 */
const addCalculatedQuantity = async (productOrProducts) => {
  if (Array.isArray(productOrProducts)) {
    // Processar array de produtos
    const productsWithQuantity = await Promise.all(
      productOrProducts.map(async (product) => {
        const quantity = await calculateProductQuantity(product._id);
        return {
          ...product.toObject(),
          quantidade: quantity
        };
      })
    );
    return productsWithQuantity;
  } else {
    // Processar produto único
    const quantity = await calculateProductQuantity(productOrProducts._id);
    return {
      ...productOrProducts.toObject(),
      quantidade: quantity
    };
  }
};

/**
 * Gera o próximo código de produto (3 dígitos: 001, 002, etc.)
 */
const getNextProductCode = async () => {
  const lastProduct = await Product.findOne({})
    .sort({ codigo: -1 })
    .select('codigo');
  
  if (!lastProduct || !lastProduct.codigo) {
    return '001';
  }

  // Extrai o número do código atual e incrementa
  const currentCode = parseInt(lastProduct.codigo, 10) || 0;
  const nextCode = currentCode + 1;
  
  // Formata com zero-padding para 3 dígitos
  return nextCode.toString().padStart(3, '0');
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

  const products = await Product.find(query).sort({ descricao: 1 });

  // Calcular quantidade para cada produto baseado nas movimentações
  const productsWithQuantity = await addCalculatedQuantity(products);

  return productsWithQuantity;
};

/**
 * Obtém um produto por ID
 */
const getProductById = async (id) => {
  const product = await Product.findById(id);
  if (!product) return null;
  
  // Calcular quantidade baseada nas movimentações
  const productWithQuantity = await addCalculatedQuantity(product);
  return productWithQuantity;
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
 * Obtém estatísticas do estoque
 */
const getStockStats = async () => {
  const totalProducts = await Product.countDocuments();

  // Obter todos os produtos com quantidade calculada
  const allProducts = await Product.find({});
  const productsWithQuantity = await addCalculatedQuantity(allProducts);

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

  // Contar produtos com estoque baixo baseado em 30% da soma total de entradas
  const lowStockProducts = productsWithQuantity.filter(product => {
    const totalEntries = entrySumMap.get(product._id.toString()) || 0;
    const threshold = totalEntries * 0.3; // 30% da soma total de entradas
    return product.quantidade <= threshold;
  }).length;

  const totalStock = productsWithQuantity.reduce((sum, p) => sum + p.quantidade, 0);

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

  // Obter todos os produtos com quantidade calculada
  const allProducts = await Product.find({});
  const productsWithQuantity = await addCalculatedQuantity(allProducts);

  // Filtrar produtos com estoque baixo baseado em 30% da soma total de entradas
  const lowStockProducts = productsWithQuantity.filter(product => {
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
  getStockStats,
  getLowStockProducts,
  calculateProductQuantity,
};
