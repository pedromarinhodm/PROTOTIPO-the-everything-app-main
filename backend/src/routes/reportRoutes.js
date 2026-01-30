/**
 * Routes: Report
 * Rotas da API de relatórios
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// GET /api/reports/estoque/pdf - Relatório de estoque em PDF
router.get('/estoque/pdf', reportController.getStockPDF);

// GET /api/reports/historico/pdf - Relatório de histórico em PDF
router.get('/historico/pdf', reportController.getHistoryPDF);

// GET /api/reports/excel - Relatório completo em Excel
router.get('/excel', reportController.getExcelReport);

module.exports = router;
