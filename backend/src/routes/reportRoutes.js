/**
 * Routes: Report
 * Rotas da API de relatórios
 */

import express from 'express';
import reportController from '../controllers/reportController.js';

const router = express.Router();

// GET /api/reports/estoque/pdf - Relatório de estoque em PDF
router.get('/estoque/pdf', reportController.getStockPDF);

// GET /api/reports/historico/pdf - Relatório de histórico em PDF
router.get('/historico/pdf', reportController.getHistoryPDF);

// GET /api/reports/excel - Relatório completo em Excel
router.get('/excel', reportController.getExcelReport);

export default router;
