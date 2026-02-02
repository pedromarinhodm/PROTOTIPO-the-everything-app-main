/**
 * Service: Report
 * Geração de relatórios em PDF e Excel
 */

import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import Product from '../models/Product.js';
import Movement from '../models/Movement.js';
import gridfs from '../gridfs/gridfsStorage.js';

/**
 * Gera relatório de estoque em PDF
 */
const generateStockPDF = async () => {
  const products = await Product.find({}).sort({ codigo: 1 });
  
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', async () => {
      const buffer = Buffer.concat(chunks);

      const filename = `relatorio-estoque-${new Date().toISOString().split('T')[0]}.pdf`;

      resolve({ filename, buffer });
    });
    doc.on('error', reject);

    // Cabeçalho
    doc.fontSize(20).font('Helvetica-Bold')
       .text('SCGES - Relatório de Estoque', { align: 'center' });
    
    doc.fontSize(10).font('Helvetica')
       .text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
    
    doc.moveDown(2);

    // Resumo
    const totalProducts = products.length;
    const lowStock = products.filter(p => p.quantidade <= 5).length;

    doc.fontSize(12).font('Helvetica-Bold').text('Resumo:');
    doc.fontSize(10).font('Helvetica')
       .text(`Total de Produtos: ${totalProducts}`)
       .text(`Produtos com Estoque Baixo: ${lowStock}`);
    
    doc.moveDown(2);

    // Tabela de produtos
    doc.fontSize(12).font('Helvetica-Bold').text('Produtos em Estoque:');
    doc.moveDown();

    // Cabeçalho da tabela
    const tableTop = doc.y;
    const columns = [
      { header: 'Código', width: 60, x: 50 },
      { header: 'Descrição', width: 250, x: 110 },
      { header: 'Qtd', width: 50, x: 360 },
      { header: 'Unidade', width: 60, x: 410 },
    ];

    doc.fontSize(9).font('Helvetica-Bold');
    columns.forEach(col => {
      doc.text(col.header, col.x, tableTop, { width: col.width });
    });

    doc.moveTo(50, tableTop + 15).lineTo(540, tableTop + 15).stroke();
    
    // Dados
    let y = tableTop + 20;
    doc.font('Helvetica').fontSize(8);

    products.forEach((product, index) => {
      // Nova página se necessário
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      const isLowStock = product.quantidade <= 5;

      doc.text(product.codigo, 50, y, { width: 60 });
      doc.text(product.descricao.substring(0, 40), 110, y, { width: 250 });
      doc.fillColor(isLowStock ? 'red' : 'black')
         .text(product.quantidade.toString(), 360, y, { width: 50 });
      doc.fillColor('black')
         .text(product.unidade, 410, y, { width: 60 });

      y += 15;
    });

    doc.end();
  });
};

/**
 * Gera relatório de histórico em PDF
 */
const generateHistoryPDF = async (filters = {}) => {
  let query = {};

  if (filters.type && filters.type !== 'all') {
    query.tipo = filters.type;
  }
  if (filters.startDate) {
    query.data = { $gte: new Date(filters.startDate) };
  }
  if (filters.endDate) {
    const end = new Date(filters.endDate);
    end.setHours(23, 59, 59, 999);
    query.data = { ...query.data, $lte: end };
  }

  const movements = await Movement.find(query).populate('produto_id', 'codigo descricao').sort({ data: -1 });
  
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', async () => {
      const buffer = Buffer.concat(chunks);

      const filename = `relatorio-historico-${new Date().toISOString().split('T')[0]}.pdf`;

      resolve({ filename, buffer });
    });
    doc.on('error', reject);

    // Cabeçalho
    doc.fontSize(20).font('Helvetica-Bold')
       .text('SCGES - Histórico de Movimentações', { align: 'center' });
    
    doc.fontSize(10).font('Helvetica')
       .text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
    
    doc.moveDown(2);

    // Resumo
    const entries = movements.filter(m => m.tipo === 'entrada');
    const exits = movements.filter(m => m.tipo === 'saida');
    const totalEntriesQty = entries.reduce((sum, m) => sum + m.quantidade, 0);
    const totalExitsQty = exits.reduce((sum, m) => sum + m.quantidade, 0);

    doc.fontSize(12).font('Helvetica-Bold').text('Resumo:');
    doc.fontSize(10).font('Helvetica')
       .text(`Total de Movimentações: ${movements.length}`)
       .text(`Entradas: ${entries.length} (${totalEntriesQty} unidades)`)
       .text(`Saídas: ${exits.length} (${totalExitsQty} unidades)`)
       .text(`Saldo: ${totalEntriesQty - totalExitsQty} unidades`);
    
    doc.moveDown(2);

    // Lista de movimentações
    doc.fontSize(12).font('Helvetica-Bold').text('Movimentações:');
    doc.moveDown();

    // Cabeçalho da tabela
    const tableTop = doc.y;
    const columns = [
      { header: 'Data', width: 70, x: 50 },
      { header: 'Tipo', width: 50, x: 120 },
      { header: 'Produto', width: 180, x: 170 },
      { header: 'Qtd', width: 40, x: 350 },
      { header: 'Servidor', width: 100, x: 390 },
    ];

    doc.fontSize(9).font('Helvetica-Bold');
    columns.forEach(col => {
      doc.text(col.header, col.x, tableTop, { width: col.width });
    });

    doc.moveTo(50, tableTop + 15).lineTo(540, tableTop + 15).stroke();
    
    // Dados
    let y = tableTop + 20;
    doc.font('Helvetica').fontSize(8);

    movements.forEach((movement) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      const date = new Date(movement.data).toLocaleDateString('pt-BR');
      const produtoDescricao = movement.produto_id && movement.produto_id.descricao ? movement.produto_id.descricao.substring(0, 30) : 'Produto não encontrado';
      const servidor = movement.servidor_almoxarifado ? movement.servidor_almoxarifado.substring(0, 18) : '-';

      doc.text(date, 50, y, { width: 70 });
      doc.fillColor(movement.tipo === 'entrada' ? 'green' : 'blue')
         .text(movement.tipo.toUpperCase(), 120, y, { width: 50 });
      doc.fillColor('black')
         .text(produtoDescricao, 170, y, { width: 180 });
      doc.text(`${movement.tipo === 'entrada' ? '+' : '-'}${movement.quantidade || 0}`, 350, y, { width: 40 });
      doc.text(servidor, 390, y, { width: 100 });

      y += 15;
    });

    doc.end();
  });
};

/**
 * Gera relatório em Excel
 */
const generateExcelReport = async () => {
  const products = await Product.find({}).sort({ codigo: 1 });
  const movements = await Movement.find({}).populate('produto_id', 'codigo descricao').sort({ data: -1 });
  
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SCGES';
  workbook.created = new Date();

  // Aba de Produtos
  const productsSheet = workbook.addWorksheet('Produtos');
  productsSheet.columns = [
    { header: 'Código', key: 'code', width: 10 },
    { header: 'Descrição', key: 'description', width: 40 },
    { header: 'Quantidade', key: 'quantity', width: 12 },
    { header: 'Unidade', key: 'unit', width: 10 },
    { header: 'Fornecedor', key: 'supplier', width: 25 },
    { header: 'Nº Processo', key: 'processNumber', width: 15 },
    { header: 'Data Cadastro', key: 'createdAt', width: 15 },
  ];

  // Estilo do cabeçalho
  productsSheet.getRow(1).font = { bold: true };
  productsSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1351B4' }
  };
  productsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };

  products.forEach(product => {
    const row = productsSheet.addRow({
      codigo: product.codigo,
      descricao: product.descricao,
      quantidade: product.quantidade,
      unidade: product.unidade || '',
      fornecedor: product.fornecedor || '',
      numero_processo: product.numero_processo || '',
      createdAt: new Date(product.createdAt).toLocaleDateString('pt-BR'),
    });

    // Destaca estoque baixo
    if (product.quantidade <= 5) {
      row.getCell('quantidade').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCCCB' }
      };
    }
  });

  // Aba de Movimentações
  const movementsSheet = workbook.addWorksheet('Movimentações');
  movementsSheet.columns = [
    { header: 'Data', key: 'data', width: 12 },
    { header: 'Tipo', key: 'tipo', width: 10 },
    { header: 'Produto', key: 'produto', width: 40 },
    { header: 'Quantidade', key: 'quantidade', width: 12 },
    { header: 'Servidor Almox.', key: 'servidor_almoxarifado', width: 20 },
    { header: 'Setor Req.', key: 'setor_responsavel', width: 20 },
    { header: 'Servidor Req.', key: 'servidor_retirada', width: 20 },
  ];

  movementsSheet.getRow(1).font = { bold: true };
  movementsSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '168821' }
  };
  movementsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };

  movements.forEach(movement => {
    movementsSheet.addRow({
      data: new Date(movement.data).toLocaleDateString('pt-BR'),
      tipo: movement.tipo.toUpperCase(),
      produto: movement.produto_id.descricao,
      quantidade: movement.quantidade,
      servidor_almoxarifado: movement.servidor_almoxarifado,
      setor_responsavel: movement.setor_responsavel || '',
      servidor_retirada: movement.servidor_retirada || '',
    });
  });

  // Gera buffer
  const buffer = await workbook.xlsx.writeBuffer();

  const filename = `relatorio-completo-${new Date().toISOString().split('T')[0]}.xlsx`;

  return { filename, buffer: Buffer.from(buffer) };
};

export default {
  generateStockPDF,
  generateHistoryPDF,
  generateExcelReport,
};
