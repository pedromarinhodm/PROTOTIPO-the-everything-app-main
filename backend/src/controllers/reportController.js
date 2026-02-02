/**
 * Controller: Report
 * Endpoints para geração de relatórios
 */

import reportService from '../services/reportService.js';

/**
 * GET /api/reports/estoque/pdf
 * Gera relatório de estoque em PDF
 */
const getStockPDF = async (req, res) => {
  try {
    const { filename, buffer } = await reportService.generateStockPDF();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.send(buffer);
  } catch (error) {
    console.error('Erro ao gerar relatório de estoque:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar relatório',
      message: error.message,
    });
  }
};

/**
 * GET /api/reports/historico/pdf
 * Gera relatório de histórico em PDF
 */
const getHistoryPDF = async (req, res) => {
  try {
    const { type, startDate, endDate, search } = req.query;

    const { filename, buffer } = await reportService.generateHistoryPDF({
      type,
      startDate,
      endDate,
      search,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.send(buffer);
  } catch (error) {
    console.error('Erro ao gerar relatório de histórico:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar relatório',
      message: error.message,
    });
  }
};

/**
 * GET /api/reports/excel
 * Gera relatório completo em Excel
 */
const getExcelReport = async (req, res) => {
  try {
    const { filename, buffer } = await reportService.generateExcelReport();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.send(buffer);
  } catch (error) {
    console.error('Erro ao gerar relatório Excel:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar relatório',
      message: error.message,
    });
  }
};

export default {
  getStockPDF,
  getHistoryPDF,
  getExcelReport,
};
