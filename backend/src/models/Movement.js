/**
 * Model: Movement
 * Representa as movimentações de estoque (entradas e saídas)
 */

const mongoose = require('mongoose');

const movementSchema = new mongoose.Schema({
  // Tipo de movimentação
  tipo: {
    type: String,
    enum: ['entrada', 'saida'],
    required: true,
  },
  // Produto (nome ou descrição)
  produto: {
    type: String,
    required: true,
  },
  // Quantidade movimentada
  quantidade: {
    type: Number,
    required: true,
  },
  // Data da movimentação
  data: {
    type: Date,
    default: Date.now,
  },
  // Observações
  observacoes: {
    type: String,
    default: "",
  },
}, {
  timestamps: true,
});

// Índices para melhorar a performance
movementSchema.index({ produto_id: 1 });
movementSchema.index({ tipo: 1 });
movementSchema.index({ data: -1 });
movementSchema.index({ createdAt: -1 });

// Virtual para formatar data
movementSchema.virtual('formattedDate').get(function() {
  return this.data.toISOString().split('T')[0];
});

// Garantir que virtuals sejam incluídos no JSON
movementSchema.set('toJSON', { virtuals: true });
movementSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Movimentacao', movementSchema);
