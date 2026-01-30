/**
 * Routes: Dashboard
 * Rotas da API do dashboard
 */

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// GET /api/dashboard/stats - Estatísticas consolidadas
router.get('/stats', dashboardController.getStats);

// GET /api/dashboard/recent-movements - Movimentações recentes
router.get('/recent-movements', dashboardController.getRecentMovements);

// GET /api/dashboard/low-stock - Produtos com estoque baixo
router.get('/low-stock', dashboardController.getLowStockProducts);

module.exports = router;
