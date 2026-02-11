/**
 * Controller: Product
 * Endpoints REST para produtos
 */

import productService from '../services/productService.js';
import movementService from '../services/movementService.js';
import { saveToProductFilesGridFS, deleteFromProductFilesGridFS } from '../gridfs/gridfsStorage.js';

/**
 * GET /api/produtos
 * Lista todos os produtos com busca opcional
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
 * GET /api/produtos/:id
 * Obtém um produto por ID
 */
const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);

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
    console.error('Erro ao obter produto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter produto',
      message: error.message,
    });
  }
};

/**
 * POST /api/produtos
 * Cria um novo produto
 */
const createProduct = async (req, res) => {
  try {
    const productData = req.body;
    const product = await productService.createProduct(productData);

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
 * PUT /api/produtos/:id
 * Atualiza um produto (com suporte a upload de nota fiscal)
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Busca produto atual para verificar nota fiscal existente
    const currentProduct = await productService.getProductById(id);
    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado',
      });
    }

    // Se há um novo arquivo de nota fiscal
    if (req.file) {
      // Valida tipo do arquivo (apenas PDF)
      if (req.file.mimetype !== 'application/pdf') {
        return res.status(400).json({
          success: false,
          error: 'Apenas arquivos PDF são permitidos para nota fiscal',
        });
      }

      // Se já existe uma nota fiscal, deleta a antiga
      if (currentProduct.nota_fiscal_id) {
        try {
          await deleteFromProductFilesGridFS(currentProduct.nota_fiscal_id);
        } catch (err) {
          console.log('Nota fiscal anterior não encontrada ou erro ao deletar:', err.message);
        }
      }

      // Salva nova nota fiscal no GridFS (bucket product_files)
      const filename = Date.now() + '-' + req.file.originalname;
      const fileId = await saveToProductFilesGridFS(req.file.buffer, filename, {
        tipo: 'nota_fiscal',
        produto_id: id,
        uploadDate: new Date(),
      });

      // Adiciona referência da nota fiscal aos dados de atualização
      updateData.nota_fiscal_id = fileId.toString();
      updateData.nota_fiscal_filename = req.file.originalname;
    }

    // Remove campos que não devem ser atualizados diretamente
    delete updateData._id;
    delete updateData.codigo;
    delete updateData.createdAt;
    delete updateData.quantidade; // Quantidade é calculada dinamicamente das movimentações

    const product = await productService.updateProduct(id, updateData);

    res.json({
      success: true,
      produto: product,
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
 * DELETE /api/produtos/:id
 * Deleta um produto
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Primeiro deleta as movimentações relacionadas
    await movementService.deleteMovementsByProduct(id);
    
    // Depois deleta o produto
    const product = await productService.deleteProduct(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Produto deletado com sucesso',
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
 * GET /api/produtos/next-code
 * Obtém o próximo código disponível
 */
const getNextCode = async (req, res) => {
  try {
    const nextCode = await productService.getNextProductCode();
    res.json({
      success: true,
      data: { nextCode },
    });
  } catch (error) {
    console.error('Erro ao obter próximo código:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter próximo código',
      message: error.message,
    });
  }
};

export default {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getNextCode,
};
