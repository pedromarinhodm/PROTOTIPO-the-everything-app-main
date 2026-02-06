/**
 * Routes: Formularios
 * Rotas da API de formulários (GridFS)
 */

import express from 'express';
const router = express.Router();
import fileController from '../controllers/fileController.js';
import multer from 'multer';

// multer em memória
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/formularios - Lista todos os formulários
router.get('/', fileController.getFiles);

// POST /api/formularios - Upload de formulário (campo 'arquivo')
router.post('/', upload.single('arquivo'), fileController.uploadFile);

// GET /api/formularios/:id/view - Visualizar formulário inline (PDF)
router.get('/:id/view', fileController.viewFile);

// GET /api/formularios/:id/download - Download de formulário
router.get('/:id/download', fileController.downloadFile);

// DELETE /api/formularios/:id - Deleta formulário
router.delete('/:id', fileController.deleteFile);

export default router;
