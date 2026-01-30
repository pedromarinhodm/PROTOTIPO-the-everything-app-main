/**
 * Controller: Movement
 * Endpoints REST para movimentações
 */

const movementService = require('../services/movementService');

/**
 * GET /api/movements
 * Lista movimentações com filtros
 */
const getMovements = async (req, res) => {
  try {
    const { search, tipo, startDate, endDate, limit } = req.query;
    
    const movements = await movementService.getMovements({
      search,
      tipo,
      startDate,
      endDate,
      limit: limit ? parseInt(limit) : undefined,
    });

    res.json({
      success: true,
      data: movements,
      count: movements.length,
    });
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
 * POST /api/entrada
 * Registra uma entrada simplificada (como no SCGES)
 */
const createSimplifiedEntry = async (req, res) => {
  try {
    const { produto, quantidade, data, observacoes } = req.body;

    if (!produto || !quantidade) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes." });
    }

    // Verifica se o produto já existe
    let existingProduct = await require('../models/Product').findOne({ descricao: { $regex: `^${produto}$`, $options: "i" } });

    if (existingProduct) {
      // Se já existe, apenas incrementa a quantidade
      existingProduct.quantidade += quantidade;
      await existingProduct.save();
    } else {
      // Se não existe, cria novo produto com código sequencial
      const ultimo = await require('../models/Product').findOne().sort({ codigo: -1 }).select("codigo");
      const proximoCodigo = ultimo && ultimo.codigo ? ultimo.codigo + 1 : 1;

      existingProduct = new (require('../models/Product'))({ codigo: proximoCodigo, descricao: produto, quantidade });
      await existingProduct.save();
    }

    // Parse data as local date (yyyy-mm-dd) to avoid timezone issues
    let dataMovimentacao = new Date();
    if (data) {
      const [ano, mes, dia] = data.split('-').map(Number);
      dataMovimentacao = new Date(ano, mes - 1, dia, 12, 0, 0); // Set to noon to avoid DST issues
    }

    // Registra movimentação de entrada
    const novaMovimentacao = new (require('../models/Movement'))({
      tipo: "entrada",
      produto,
      quantidade,
      data: dataMovimentacao,
      observacoes: observacoes || '',
    });
    await novaMovimentacao.save();

    res.json({ success: true, message: "Entrada registrada com sucesso!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/saida
 * Registra uma saída (como no SCGES)
 */
const createSaida = async (req, res) => {
  try {
    const { produto, quantidade, data, observacoes } = req.body;

    if (!produto || !quantidade) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes." });
    }

    // Find product by description
    const existingProduct = await require('../models/Product').findOne({
      descricao: { $regex: new RegExp(`^${produto}$`, 'i') }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: "Produto não encontrado." });
    }

    if (existingProduct.quantidade < quantidade) {
      return res.status(400).json({ error: "Quantidade insuficiente em estoque." });
    }

    existingProduct.quantidade -= quantidade;
    await existingProduct.save();

    // Parse data as local date (yyyy-mm-dd) to avoid timezone issues
    let dataMovimentacao = new Date();
    if (data) {
      const [ano, mes, dia] = data.split('-').map(Number);
      dataMovimentacao = new Date(ano, mes - 1, dia, 12, 0, 0); // Set to noon to avoid DST issues
    }

    const novaMovimentacao = new (require('../models/Movement'))({
      produto,
      tipo: "saida",
      quantidade,
      data: dataMovimentacao,
      observacoes: observacoes || '',
    });
    await novaMovimentacao.save();

    res.json({ success: true, message: "Saída registrada com sucesso!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getMovements,
  createSimplifiedEntry,
  createSaida,
};
