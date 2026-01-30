/**
 * Service: Product
 * Lógica de negócio para produtos
 */

const Product = require('../models/Product');

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
        { supplier: { $regex: searchQuery, $options: 'i' } },
      ],
    };
  }

  const products = await Product.find(query).sort({ descricao: 1 });
  return products;
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
  const lowStockProducts = await Product.countDocuments({ quantidade: { $lte: 5 } });
  
  const products = await Product.find({});
  const totalStock = products.reduce((sum, p) => sum + p.quantidade, 0);
  
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
  const products = await Product.find({ quantidade: { $lte: 5 } })
    .sort({ quantidade: 1 })
    .limit(limit);
  return products;
};

module.exports = {
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
