/**
 * Controller: Movement
 * Endpoints REST para movimentações
 */

import movementService from '../services/movementService.js';
import { saveToProductFilesGridFS } from '../gridfs/gridfsStorage.js';

/**
 * GET /api/movements
 * Lista todas as movimentações com filtros
 */
const getMovements = async (req, res) => {
  try {
    const { search, tipo, startDate, endDate, limit } = req.query;

    const filters = {
      search,
      tipo,
      startDate,
      endDate,
      limit: limit ? parseInt(limit) : undefined,
    };

    const movements = await movementService.getMovements(filters);

    res.json(movements);
  } catch (error) {
    console.error('Erro ao listar movimentações:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar movimentações',
      message: error.message,
    });
  }
};

/**
 * POST /api/movements/entry
 * Registra uma entrada de estoque (com suporte a nota fiscal)
 */
const createEntry = async (req, res) => {
  try {
    const entryData = req.body;
    
    // Se há arquivo de nota fiscal, processa o upload
    if (req.file) {
      // Valida tipo do arquivo (apenas PDF)
      if (req.file.mimetype !== 'application/pdf') {
        return res.status(400).json({
          success: false,
          error: 'Apenas arquivos PDF são permitidos para nota fiscal',
        });
      }

      // Salva nota fiscal no GridFS (bucket product_files)
      const filename = Date.now() + '-' + req.file.originalname;
      const fileId = await saveToProductFilesGridFS(req.file.buffer, filename, {
        tipo: 'nota_fiscal',
        uploadDate: new Date(),
      });

      // Adiciona referência da nota fiscal aos dados da entrada
      entryData.nota_fiscal_id = fileId.toString();
      entryData.nota_fiscal_filename = req.file.originalname;
    }

    const movement = await movementService.createEntry(entryData);

    res.status(201).json({
      success: true,
      data: movement,
      message: 'Entrada registrada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao registrar entrada:', error);
    res.status(400).json({
      success: false,
      error: 'Erro ao registrar entrada',
      message: error.message,
    });
  }
};

/**
 * POST /api/movements/exit
 * Registra uma saída de estoque
 */
const createExit = async (req, res) => {
  try {
    const exitData = req.body;
    const movement = await movementService.createExit(exitData);

    res.status(201).json({
      success: true,
      data: movement,
      message: 'Saída registrada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao registrar saída:', error);
    res.status(400).json({
      success: false,
      error: 'Erro ao registrar saída',
      message: error.message,
    });
  }
};

export default {
  getMovements,
  createEntry,
  createExit,
};
