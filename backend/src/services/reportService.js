/**
 * Service: Report
 * Geração de relatórios em PDF e Excel
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import Product from '../models/Product.js';
import Movement from '../models/Movement.js';

/**
 * Gera relatório de estoque em PDF
 */
const generateStockPDF = async () => {
  const products = await Product.find({}).sort({ codigo: 1 }).limit(1000);

  // Obter a soma total de entradas por produto
  const entrySums = await Movement.aggregate([
    { $match: { tipo: 'entrada' } },
    {
      $group: {
        _id: '$produto_id',
        totalEntries: { $sum: '$quantidade' }
      }
    }
  ]);

  // Criar mapa de produto_id para soma total de entradas
  const entrySumMap = new Map();
  entrySums.forEach(sum => {
    entrySumMap.set(sum._id.toString(), sum.totalEntries);
  });

  // Criar documento PDF com jsPDF
  const doc = new jsPDF('p', 'mm', 'a4'); // Portrait para relatório de estoque

  // Cabeçalho
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('SCGES - Relatório de Estoque', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 105, 30, { align: 'center' });

  // Resumo
  const totalProducts = products.length;
  const lowStock = products.filter(p => {
    const totalEntries = entrySumMap.get(p._id.toString()) || 0;
    const threshold = totalEntries * 0.3; // 30% da soma total de entradas
    return p.quantidade <= threshold;
  }).length;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo:', 20, 45);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total de Produtos: ${totalProducts}`, 20, 52);
  doc.text(`Produtos com Estoque Baixo: ${lowStock}`, 20, 59);

  // Preparar dados da tabela
  const tableData = products.map(product => {
    const totalEntries = entrySumMap.get(product._id.toString()) || 0;
    const threshold = totalEntries * 0.3; // 30% da soma total de entradas
    const isLowStock = product.quantidade <= threshold;

    if (isLowStock) {
      return [
        {
          content: product.codigo.toString(),
          styles: {
            fillColor: [255, 204, 203], // Light red for low stock
            textColor: [139, 0, 0] // Dark red text for low stock
          }
        },
        {
          content: product.descricao.substring(0, 40),
          styles: {
            fillColor: [255, 204, 203], // Light red for low stock
            textColor: [139, 0, 0] // Dark red text for low stock
          }
        },
        {
          content: product.quantidade.toString(),
          styles: {
            fillColor: [255, 204, 203], // Light red for low stock
            textColor: [139, 0, 0] // Dark red text for low stock
          }
        },
        {
          content: product.unidade || '-',
          styles: {
            fillColor: [255, 204, 203], // Light red for low stock
            textColor: [139, 0, 0] // Dark red text for low stock
          }
        }
      ];
    } else {
      return [
        product.codigo.toString(),
        product.descricao.substring(0, 40),
        product.quantidade.toString(),
        product.unidade || '-'
      ];
    }
  });

  // Configurar autoTable
  autoTable(doc, {
    head: [['Código', 'Descrição', 'Qtd', 'Unidade']],
    body: tableData,
    startY: 70,
    styles: {
      fontSize: 8,
      cellPadding: 3
    },
    headStyles: {
      fillColor: [26, 65, 115],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    }
  });

  // Gerar buffer
  const buffer = Buffer.from(doc.output('arraybuffer'));
  const filename = `relatorio-estoque-${new Date().toISOString().split('T')[0]}.pdf`;

  return { filename, buffer };
};

/**
 * Gera relatório de histórico em PDF
 */
const generateHistoryPDF = async (filters = {}) => {
  const { type, startDate, endDate } = filters;

  let matchConditions = {};

  // Filtro por tipo
  if (type && type !== 'all') {
    matchConditions.tipo = type;
  }

  // Filtro por data
  if (startDate || endDate) {
    matchConditions.data = {};
    if (startDate) {
      matchConditions.data.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchConditions.data.$lte = end;
    }
  }

  // Usar a mesma lógica de filtragem do endpoint de movimentações
  let movements;
  if (!filters.search && Object.keys(matchConditions).length === 0) {
    // Query simples para melhor performance quando não há filtros
    movements = await Movement.find()
      .populate("produto_id", "codigo descricao")
      .sort({ data: -1, createdAt: -1 })
      .limit(1000);
  } else {
    // Pipeline de agregação para filtros complexos
    let pipeline = [
      {
        $lookup: {
          from: 'produtos',
          localField: 'produto_id',
          foreignField: '_id',
          as: 'produto_id'
        }
      },
      {
        $unwind: '$produto_id'
      }
    ];

    // Adicionar filtro de busca se fornecido
    if (filters.search) {
      pipeline.push({
        $match: {
          ...matchConditions,
          'produto_id.descricao': { $regex: filters.search, $options: 'i' }
        }
      });
    } else if (Object.keys(matchConditions).length > 0) {
      pipeline.push({
        $match: matchConditions
      });
    }

    // Ordenação
    pipeline.push({
      $sort: { data: -1, createdAt: -1 }
    });

    movements = await Movement.aggregate(pipeline);
  }

  // Criar documento PDF com jsPDF
  const doc = new jsPDF('p', 'mm', 'a4'); // Portrait para relatório de histórico

  // Cabeçalho
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('SCGES - Histórico de Movimentações', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 105, 30, { align: 'center' });

  // Resumo
  const entries = movements.filter(m => m.tipo === 'entrada');
  const exits = movements.filter(m => m.tipo === 'saida');
  const totalEntriesQty = entries.reduce((sum, m) => sum + m.quantidade, 0);
  const totalExitsQty = exits.reduce((sum, m) => sum + m.quantidade, 0);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo:', 20, 45);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total de Movimentações: ${movements.length}`, 20, 52);
  doc.text(`Entradas: ${entries.length} (${totalEntriesQty} unidades)`, 20, 59);
  doc.text(`Saídas: ${exits.length} (${totalExitsQty} unidades)`, 20, 66);
  doc.text(`Saldo: ${totalEntriesQty - totalExitsQty} unidades`, 20, 73);

  // Filtros Aplicados
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Filtros Aplicados:', 20, 85);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const appliedFilters = [];
  if (filters.search) {
    appliedFilters.push(`Busca: "${filters.search}"`);
  }
  if (type && type !== 'all') {
    appliedFilters.push(`Tipo: ${type === 'entrada' ? 'Entradas' : 'Saídas'}`);
  }
  if (startDate) {
    appliedFilters.push(`Data Inicial: ${new Date(startDate).toLocaleDateString('pt-BR')}`);
  }
  if (endDate) {
    appliedFilters.push(`Data Final: ${new Date(endDate).toLocaleDateString('pt-BR')}`);
  }

  let yPosition = 92;
  if (appliedFilters.length > 0) {
    appliedFilters.forEach(filter => {
      doc.text(`• ${filter}`, 20, yPosition);
      yPosition += 7;
    });
  } else {
    doc.text('• Nenhum', 20, yPosition);
    yPosition += 7;
  }

  // Preparar dados da tabela
  const tableData = movements.map(movement => {
    const date = new Date(movement.data).toLocaleDateString('pt-BR');
    const produtoDescricao = movement.produto_id && movement.produto_id.descricao ? movement.produto_id.descricao.substring(0, 30) : 'Produto não encontrado';
    const servidor = movement.servidor_almoxarifado ? movement.servidor_almoxarifado.substring(0, 18) : '-';

    return [
      date,
      {
        content: movement.tipo.toUpperCase(),
        styles: {
          textColor: movement.tipo === 'entrada' ? [0, 128, 0] : [255, 0, 0]
        }
      },
      produtoDescricao,
      `${movement.tipo === 'entrada' ? '+' : '-'}${movement.quantidade || 0}`,
      servidor
    ];
  });

  // Configurar autoTable
  autoTable(doc, {
    head: [['Data', 'Tipo', 'Produto', 'Qtd', 'Servidor']],
    body: tableData,
    startY: yPosition + 10,
    styles: {
      fontSize: 8,
      cellPadding: 3
    },
    headStyles: {
      fillColor: [26, 65, 115],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    }
  });

  // Gerar buffer
  const buffer = Buffer.from(doc.output('arraybuffer'));
  const filename = `relatorio-historico-${new Date().toISOString().split('T')[0]}.pdf`;

  return { filename, buffer };
};

/**
 * Gera relatório em Excel
 */
const generateExcelReport = async () => {
  const products = await Product.find({}).sort({ codigo: 1 }).limit(1000);
  const movements = await Movement.find({}).populate('produto_id', 'codigo descricao').sort({ data: -1 }).limit(1000);

  // Obter a soma total de entradas por produto
  const entrySums = await Movement.aggregate([
    { $match: { tipo: 'entrada' } },
    {
      $group: {
        _id: '$produto_id',
        totalEntries: { $sum: '$quantidade' }
      }
    }
  ]);

  // Criar mapa de produto_id para soma total de entradas
  const entrySumMap = new Map();
  entrySums.forEach(sum => {
    entrySumMap.set(sum._id.toString(), sum.totalEntries);
  });
  
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

    // Destaca estoque baixo na linha inteira
    const totalEntries = entrySumMap.get(product._id.toString()) || 0;
    const threshold = totalEntries * 0.3; // 30% da soma total de entradas
    if (product.quantidade <= threshold) {
      row.eachCell(cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFCCCB' }
        };
      });
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
