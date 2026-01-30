/**
 * Routes: Product
 * Rotas da API de produtos
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// GET /api/products - Lista todos os produtos
router.get('/', productController.getProducts);

// GET /api/products/next-code - Obtém próximo código
router.get('/next-code', productController.getNextCode);

// GET /api/products/:id - Obtém produto por ID
router.get('/:id', productController.getProduct);

// POST /api/products - Cria novo produto
router.post('/', productController.createProduct);

// PUT /api/products/:id - Atualiza produto
router.put('/:id', productController.updateProduct);

// DELETE /api/products/:id - Deleta produto
router.delete('/:id', productController.deleteProduct);

module.exports = router;
