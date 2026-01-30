/**
 * Controller: Product
 * Endpoints REST para produtos
 */

const productService = require('../services/productService');
const movementService = require('../services/movementService');

/**
 * GET /api/products
 * Lista todos os produtos
 */
const getProducts = async (req, res) => {
  try {
    const { search } = req.query;
    const products = await productService.getAllProducts(search);
    
    res.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar produtos',
      message: error.message,
    });
  }
};

/**
 * GET /api/products/:id
 * Obtém um produto por ID
 */
const getProduct = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar produto',
      message: error.message,
    });
  }
};

/**
 * POST /api/products
 * Cria um novo produto
 */
const createProduct = async (req, res) => {
  try {
    const product = await productService.createProduct(req.body);
    
    res.status(201).json({
      success: true,
      data: product,
      message: 'Produto criado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(400).json({
      success: false,
      error: 'Erro ao criar produto',
      message: error.message,
    });
  }
};

/**
 * PUT /api/products/:id
 * Atualiza um produto
 */
const updateProduct = async (req, res) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado',
      });
    }

    res.json({
      success: true,
      data: product,
      message: 'Produto atualizado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(400).json({
      success: false,
      error: 'Erro ao atualizar produto',
      message: error.message,
    });
  }
};

/**
 * DELETE /api/products/:id
 * Deleta um produto
 */
const deleteProduct = async (req, res) => {
  try {
    const product = await productService.deleteProduct(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado',
      });
    }

    // Remove movimentações relacionadas
    await movementService.deleteMovementsByProduct(req.params.id);

    res.json({
      success: true,
      message: 'Produto excluído com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar produto',
      message: error.message,
    });
  }
};

/**
 * GET /api/products/next-code
 * Obtém o próximo código de produto
 */
const getNextCode = async (req, res) => {
  try {
    const code = await productService.getNextProductCode();
    
    res.json({
      success: true,
      data: { code },
    });
  } catch (error) {
    console.error('Erro ao gerar código:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar código',
      message: error.message,
    });
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getNextCode,
};
