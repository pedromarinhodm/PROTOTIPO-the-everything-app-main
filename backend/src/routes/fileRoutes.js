/**
 * Routes: File
 * Rotas da API de arquivos (GridFS)
 */

const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const multer = require('multer');

// multer em memória
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/files - Lista todos os arquivos
router.get('/', fileController.getFiles);

// POST /api/files - Upload de arquivo (campo 'arquivo')
router.post('/', upload.single('arquivo'), fileController.uploadFile);

// GET /api/files/:id/view - Visualizar arquivo inline (PDF)
router.get('/:id/view', fileController.viewFile);

// GET /api/files/:id - Download de arquivo
router.get('/:id', fileController.downloadFile);

// DELETE /api/files/:id - Deleta arquivo
router.delete('/:id', fileController.deleteFile);

module.exports = router;
