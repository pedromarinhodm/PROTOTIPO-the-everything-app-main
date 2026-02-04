/**
 * Routes: Dashboard
 * Rotas da API do dashboard
 */

import express from 'express';
const router = express.Router();
import dashboardController from '../controllers/dashboardController.js';

// GET /api/dashboard/stats - Estatísticas consolidadas
router.get('/stats', dashboardController.getStats);

// GET /api/dashboard/recent-movements - Movimentações recentes
router.get('/recent-movements', dashboardController.getRecentMovements);

// GET /api/dashboard/low-stock - Produtos com estoque baixo
router.get('/low-stock', dashboardController.getLowStockProducts);

export default router;
