/**
 * Routes: Product Files
 * Rotas da API de arquivos de produtos (GridFS)
 */

import express from 'express';
import productFileController from '../controllers/productFileController.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/product-files - Upload de arquivo de produto (campo 'arquivo')
router.post('/', upload.single('arquivo'), productFileController.uploadProductFile);

// GET /api/product-files/:id/view - Visualizar arquivo inline (PDF)
router.get('/:id/view', productFileController.viewProductFile);

// GET /api/product-files/:id/download - Download de arquivo
router.get('/:id/download', productFileController.downloadProductFile);

// DELETE /api/product-files/:id - Deleta arquivo
router.delete('/:id', productFileController.deleteProductFile);

export default router;
