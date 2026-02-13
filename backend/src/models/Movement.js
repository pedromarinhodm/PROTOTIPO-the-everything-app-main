/**
 * Model: Movement
 * Representa as movimentações de estoque (entradas e saídas)
 */

import mongoose from 'mongoose';

const movementSchema = new mongoose.Schema(
  {
    tipo: { type: String, enum: ["entrada", "saida"], required: true },
    quantidade: { type: Number, required: true },
    servidor_almoxarifado: { type: String, required: true },
    setor_responsavel: { type: String },
    servidor_retirada: { type: String },
    matricula: { type: String, required: true },
    // ✅ Correção: grava data local ajustada para fuso horário
    data: {
      type: Date,
      default: Date.now,
    },
    produto_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Produto",
      required: true,
    },
  },
  { timestamps: true },
)

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

export default mongoose.model('Movimentacao', movementSchema);
