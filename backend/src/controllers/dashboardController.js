/**
 * Controller: Dashboard
 * Endpoints para estatísticas do dashboard
 */

import productService from '../services/productService.js';
import movementService from '../services/movementService.js';

/**
 * GET /api/dashboard/stats
 * Obtém estatísticas consolidadas para o dashboard
 */
const getStats = async (req, res) => {
  try {
    const stockStats = await productService.getStockStats();
    const movementStats = await movementService.getMovementStats();

    res.json({
      success: true,
      data: {
        totalProducts: stockStats.totalProducts,
        totalEntries: movementStats.totalEntries,
        totalExits: movementStats.totalExits,
        lowStockProducts: stockStats.lowStockProducts,
        totalMovements: movementStats.totalMovements,
      },
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter estatísticas',
      message: error.message,
    });
  }
};

/**
 * GET /api/dashboard/recent-movements
 * Obtém movimentações recentes
 */
const getRecentMovements = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const movements = await movementService.getMovements({ limit });

    res.json({
      success: true,
      data: movements,
    });
  } catch (error) {
    console.error('Erro ao obter movimentações recentes:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter movimentações recentes',
      message: error.message,
    });
  }
};

/**
 * GET /api/dashboard/low-stock
 * Obtém produtos com estoque baixo
 */
const getLowStockProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const products = await productService.getLowStockProducts(limit);

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Erro ao obter produtos com estoque baixo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter produtos com estoque baixo',
      message: error.message,
    });
  }
};

export default {
  getStats,
  getRecentMovements,
  getLowStockProducts,
};
