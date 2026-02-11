import mongoose from 'mongoose';

const produtoSchema = new mongoose.Schema(
  {
    codigo: { type: String, unique: true },

    descricao: { type: String, required: true, trim: true },
    unidade: { type: String, default: "" },

    descricao_complementar: { type: String, default: "" },
    validade: { type: String, default: "" },
    fornecedor: { type: String, default: "" },
    numero_processo: { type: String, default: "" },
    observacoes: { type: String, default: "" },
    nota_fiscal_id: { type: String, default: null },
    nota_fiscal_filename: { type: String, default: null },
  },

  { timestamps: true },
)

const Produto = mongoose.model("Produto", produtoSchema)
export default Produto
