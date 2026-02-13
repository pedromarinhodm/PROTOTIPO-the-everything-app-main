import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import productService from './productService.js';
import movementService from './movementService.js';

const generateStockPDF = async () => {
  const products = await productService.getAllProducts();
  const sortedProducts = products.sort((a, b) => String(a.codigo).localeCompare(String(b.codigo), 'pt-BR'));

  const doc = new jsPDF('p', 'mm', 'a4');

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('SCGES - Relatorio de Estoque', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 105, 30, { align: 'center' });

  const totalProducts = sortedProducts.length;
  const lowStock = sortedProducts.filter((product) => Number(product.quantidade || 0) <= Number(product.totalEntradas || 0) * 0.3).length;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo:', 20, 45);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total de Produtos: ${totalProducts}`, 20, 52);
  doc.text(`Produtos com Estoque Baixo: ${lowStock}`, 20, 59);

  const tableData = sortedProducts.map((product) => {
    const isLowStock = Number(product.quantidade || 0) <= Number(product.totalEntradas || 0) * 0.3;

    const row = [
      String(product.codigo),
      String(product.descricao || '').substring(0, 40),
      String(product.quantidade || 0),
      product.unidade || '-',
    ];

    if (!isLowStock) return row;

    return row.map((cell) => ({
      content: cell,
      styles: {
        fillColor: [255, 204, 203],
        textColor: [139, 0, 0],
      },
    }));
  });

  autoTable(doc, {
    head: [['Codigo', 'Descricao', 'Qtd', 'Unidade']],
    body: tableData,
    startY: 70,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: {
      fillColor: [26, 65, 115],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
  });

  const buffer = Buffer.from(doc.output('arraybuffer'));
  const filename = `relatorio-estoque-${new Date().toISOString().split('T')[0]}.pdf`;

  return { filename, buffer };
};

const generateHistoryPDF = async (filters = {}) => {
  const movements = await movementService.getMovements({
    search: filters.search,
    tipo: filters.type,
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  const doc = new jsPDF('p', 'mm', 'a4');

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('SCGES - Historico de Movimentacoes', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 105, 30, { align: 'center' });

  const entries = movements.filter((movement) => movement.tipo === 'entrada');
  const exits = movements.filter((movement) => movement.tipo === 'saida');
  const totalEntriesQty = entries.reduce((sum, movement) => sum + Number(movement.quantidade || 0), 0);
  const totalExitsQty = exits.reduce((sum, movement) => sum + Number(movement.quantidade || 0), 0);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo:', 20, 45);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total de Movimentacoes: ${movements.length}`, 20, 52);
  doc.text(`Entradas: ${entries.length} (${totalEntriesQty} unidades)`, 20, 59);
  doc.text(`Saidas: ${exits.length} (${totalExitsQty} unidades)`, 20, 66);
  doc.text(`Saldo: ${totalEntriesQty - totalExitsQty} unidades`, 20, 73);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Filtros Aplicados:', 20, 85);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const appliedFilters = [];
  if (filters.search) appliedFilters.push(`Busca: "${filters.search}"`);
  if (filters.type && filters.type !== 'all') appliedFilters.push(`Tipo: ${filters.type === 'entrada' ? 'Entradas' : 'Saidas'}`);
  if (filters.startDate) appliedFilters.push(`Data Inicial: ${new Date(filters.startDate).toLocaleDateString('pt-BR')}`);
  if (filters.endDate) appliedFilters.push(`Data Final: ${new Date(filters.endDate).toLocaleDateString('pt-BR')}`);

  let yPosition = 92;
  if (appliedFilters.length > 0) {
    for (const filter of appliedFilters) {
      doc.text(`- ${filter}`, 20, yPosition);
      yPosition += 7;
    }
  } else {
    doc.text('- Nenhum', 20, yPosition);
    yPosition += 7;
  }

  const tableData = movements.map((movement) => {
    const date = new Date(movement.data).toLocaleDateString('pt-BR');
    const produtoDescricao = movement.produto_id?.descricao ? movement.produto_id.descricao.substring(0, 30) : 'Produto nao encontrado';
    const servidor = movement.servidor_almoxarifado ? String(movement.servidor_almoxarifado).substring(0, 18) : '-';

    return [
      date,
      {
        content: movement.tipo.toUpperCase(),
        styles: {
          textColor: movement.tipo === 'entrada' ? [0, 128, 0] : [255, 0, 0],
        },
      },
      produtoDescricao,
      `${movement.tipo === 'entrada' ? '+' : '-'}${movement.quantidade || 0}`,
      servidor,
    ];
  });

  autoTable(doc, {
    head: [['Data', 'Tipo', 'Produto', 'Qtd', 'Servidor']],
    body: tableData,
    startY: yPosition + 10,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: {
      fillColor: [26, 65, 115],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
  });

  const buffer = Buffer.from(doc.output('arraybuffer'));
  const filename = `relatorio-historico-${new Date().toISOString().split('T')[0]}.pdf`;

  return { filename, buffer };
};

const generateExcelReport = async () => {
  const products = await productService.getAllProducts();
  const movements = await movementService.getMovements();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SCGES';
  workbook.created = new Date();

  const productsSheet = workbook.addWorksheet('Produtos');
  productsSheet.columns = [
    { header: 'Codigo', key: 'codigo', width: 10 },
    { header: 'Descricao', key: 'descricao', width: 40 },
    { header: 'Quantidade', key: 'quantidade', width: 12 },
    { header: 'Unidade', key: 'unidade', width: 10 },
    { header: 'Fornecedor', key: 'fornecedor', width: 25 },
    { header: 'N Processo', key: 'numero_processo', width: 15 },
    { header: 'Data Cadastro', key: 'createdAt', width: 15 },
  ];

  productsSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1351B4' },
  };
  productsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };

  for (const product of products) {
    const row = productsSheet.addRow({
      codigo: product.codigo,
      descricao: product.descricao,
      quantidade: product.quantidade,
      unidade: product.unidade || '',
      fornecedor: product.fornecedor || '',
      numero_processo: product.numero_processo || '',
      createdAt: new Date(product.createdAt).toLocaleDateString('pt-BR'),
    });

    if (Number(product.quantidade || 0) <= Number(product.totalEntradas || 0) * 0.3) {
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFCCCB' },
        };
      });
    }
  }

  const movementsSheet = workbook.addWorksheet('Movimentacoes');
  movementsSheet.columns = [
    { header: 'Data', key: 'data', width: 12 },
    { header: 'Tipo', key: 'tipo', width: 10 },
    { header: 'Produto', key: 'produto', width: 40 },
    { header: 'Quantidade', key: 'quantidade', width: 12 },
    { header: 'Servidor Almox.', key: 'servidor_almoxarifado', width: 20 },
    { header: 'Setor Req.', key: 'setor_responsavel', width: 20 },
    { header: 'Servidor Req.', key: 'servidor_retirada', width: 20 },
  ];

  movementsSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '168821' },
  };
  movementsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };

  for (const movement of movements) {
    movementsSheet.addRow({
      data: new Date(movement.data).toLocaleDateString('pt-BR'),
      tipo: movement.tipo.toUpperCase(),
      produto: movement.produto_id.descricao,
      quantidade: movement.quantidade,
      servidor_almoxarifado: movement.servidor_almoxarifado || '',
      setor_responsavel: movement.setor_responsavel || '',
      servidor_retirada: movement.servidor_retirada || '',
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `relatorio-completo-${new Date().toISOString().split('T')[0]}.xlsx`;

  return { filename, buffer: Buffer.from(buffer) };
};

export default {
  generateStockPDF,
  generateHistoryPDF,
  generateExcelReport,
};
