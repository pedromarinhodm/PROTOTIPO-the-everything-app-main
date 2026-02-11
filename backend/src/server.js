import express from "express"
import cors from "cors"
import bodyParser from "body-parser"
import mongoose from "mongoose"
import multer from "multer"
import path from "path"
import { fileURLToPath } from "url"

// Import GridFS
import { initGridFS, getFromProductFilesGridFS } from './gridfs/gridfsStorage.js';

// Import controllers
import productController from './controllers/productController.js';
import movementController from './controllers/movementController.js';

// Import services
import productService from './services/productService.js';

// Import routes
import reportRoutes from './routes/reportRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import productFileRoutes from './routes/productFileRoutes.js';

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// multer recebe arquivo em memória (buffer)
const upload = multer({ storage: multer.memoryStorage() });

// =====================================
// 🔗 Conexão com o MongoDB local
// =====================================
const mongoURI = "mongodb://127.0.0.1:27017/controle_estoque"

mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("✅ Conectado ao MongoDB (controle_estoque)")
    // Inicializar GridFS após conexão
    initGridFS();
  })
  .catch((err) => console.error("❌ Erro ao conectar ao MongoDB:", err))

// =====================================
// ⚙️ Configurações do servidor
// =====================================
const app = express()
app.use(cors())
app.use(bodyParser.json())

// Middleware global — permite streaming de PDF sem sobrescrever headers
app.use((req, res, next) => {
  // Só altera o header se a rota NÃO for PDF
  if (!req.path.includes("/formularios/")) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
  }
  next();
});

// =====================================
// 🟢 Rotas de Produtos
// =====================================
app.get('/api/produtos', productController.getProducts);
app.get('/api/produtos/next-code', productController.getNextCode);
app.get('/api/produtos/:id', productController.getProduct);
app.post('/api/produtos', productController.createProduct);
app.put('/api/produtos/:id', upload.single('nota_fiscal'), productController.updateProduct);
app.delete('/api/produtos/:id', productController.deleteProduct);

// =====================================
// 📄 Rotas de Nota Fiscal (Visualizar/Baixar) - Usando bucket product_files
// =====================================
app.get('/api/produtos/:id/nota-fiscal/view', async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product || !product.nota_fiscal_id) {
      return res.status(404).json({ error: 'Nota fiscal não encontrada' });
    }
    
    const { stream, file } = await getFromProductFilesGridFS(product.nota_fiscal_id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="' + file.filename + '"');
    stream.pipe(res);
  } catch (error) {
    console.error('Erro ao visualizar nota fiscal:', error);
    res.status(500).json({ error: 'Erro ao visualizar nota fiscal' });
  }
});

app.get('/api/produtos/:id/nota-fiscal/download', async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product || !product.nota_fiscal_id) {
      return res.status(404).json({ error: 'Nota fiscal não encontrada' });
    }
    
    const { stream, file } = await getFromProductFilesGridFS(product.nota_fiscal_id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${product.nota_fiscal_filename || file.filename}"`);
    res.setHeader('Content-Length', file.length);
    stream.pipe(res);
  } catch (error) {
    console.error('Erro ao baixar nota fiscal:', error);
    res.status(500).json({ error: 'Erro ao baixar nota fiscal' });
  }
});

// =====================================
// 📦 Rotas de Arquivos de Produtos (GridFS - product_files)
// =====================================
app.use('/api/product-files', productFileRoutes);

// =====================================
// 🟠 Rotas de Movimentações
// =====================================
app.get('/api/movimentacoes', movementController.getMovements);
app.post('/api/entrada', upload.single('nota_fiscal'), movementController.createEntry);
app.post('/api/saida', movementController.createExit);

// =====================================
// 🗂️ Rotas de Formulários (GridFS)
// =====================================
app.use('/api/formularios', fileRoutes);

// =====================================
// 📊 Rotas de Relatórios
// =====================================
app.use('/api/reports', reportRoutes);

// =====================================
// 📊 Rotas do Dashboard
// =====================================
app.use('/api/dashboard', dashboardRoutes);

// =====================================
// 🚀 Servidor
// =====================================
const PORT = 3000
app.listen(PORT, () => console.log(`� Servidor rodando em http://localhost:${PORT}`))
