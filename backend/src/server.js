import express from "express"
import cors from "cors"
import bodyParser from "body-parser"
import mongoose from "mongoose"
import multer from "multer"
import path from "path"
import { fileURLToPath } from "url"

// Import GridFS
import { initGridFS } from './gridfs/gridfsStorage.js';

// Import controllers
import productController from './controllers/productController.js';
import movementController from './controllers/movementController.js';

// Import routes
import reportRoutes from './routes/reportRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import fileRoutes from './routes/fileRoutes.js';

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
app.put('/api/produtos/:id', productController.updateProduct);
app.delete('/api/produtos/:id', productController.deleteProduct);

// =====================================
// 🟠 Rotas de Movimentações
// =====================================
app.get('/api/movimentacoes', movementController.getMovements);
app.post('/api/entrada', movementController.createEntry);
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
app.listen(PORT, () => console.log(`🚀 Servidor rodando em http://localhost:${PORT}`))
