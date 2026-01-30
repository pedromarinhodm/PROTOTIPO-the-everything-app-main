/**
 * Routes: Movement
 * Rotas da API de movimentações
 */

const express = require('express');
const router = express.Router();
const movementController = require('../controllers/movementController');

// GET /api/movements - Lista movimentações com filtros
router.get('/', movementController.getMovements);

// POST /api/movements/entry - Registra entrada
router.post('/entry', movementController.createSimplifiedEntry);

// POST /api/movements/exit - Registra saída
router.post('/exit', movementController.createSaida);

module.exports = router;
