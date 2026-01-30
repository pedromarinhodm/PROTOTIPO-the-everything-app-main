import mongoose from 'mongoose';

const produtoSchema = new mongoose.Schema(
  {
    codigo: { type: Number, unique: true },
    descricao: { type: String, required: true, trim: true },
    quantidade: { type: Number, required: true, default: 0 },
    unidade: { type: String, default: "" },
    descricao_complementar: { type: String, default: "" },
    validade: { type: String, default: "" },
    fornecedor: { type: String, default: "" },
    numero_processo: { type: String, default: "" },
    observacoes: { type: String, default: "" },
  },
  { timestamps: true },
)

const Produto = mongoose.model("Produto", produtoSchema)
export default Produto
