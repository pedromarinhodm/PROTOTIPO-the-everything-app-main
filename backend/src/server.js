import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

import { initGridFS, getFromProductFilesGridFS } from './gridfs/gridfsStorage.js';

import productController from './controllers/productController.js';
import movementController from './controllers/movementController.js';

import productService from './services/productService.js';

import reportRoutes from './routes/reportRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import productFileRoutes from './routes/productFileRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use((req, res, next) => {
  if (!req.path.includes('/formularios/')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
  }
  next();
});

app.get('/api/produtos', productController.getProducts);
app.get('/api/produtos/next-code', productController.getNextCode);
app.get('/api/produtos/setores', productController.getSetores);
app.get('/api/produtos/:id', productController.getProduct);
app.post('/api/produtos', productController.createProduct);
app.put('/api/produtos/:id', upload.single('nota_fiscal'), productController.updateProduct);
app.delete('/api/produtos/:id', productController.deleteProduct);

app.get('/api/produtos/:id/nota-fiscal/view', async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product || !product.nota_fiscal_id) {
      return res.status(404).json({ error: 'Nota fiscal nao encontrada' });
    }

    const { stream, file } = await getFromProductFilesGridFS(product.nota_fiscal_id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
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
      return res.status(404).json({ error: 'Nota fiscal nao encontrada' });
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

app.use('/api/product-files', productFileRoutes);

app.get('/api/movimentacoes', movementController.getMovements);
app.post('/api/entrada', upload.single('nota_fiscal'), movementController.createEntry);
app.post('/api/saida', movementController.createExit);

app.use('/api/formularios', fileRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);

const PORT = Number(process.env.PORT || 3000);

initGridFS()
  .then(() => {
    app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
  })
  .catch((error) => {
    console.error('Falha ao inicializar o backend:', error);
    process.exit(1);
  });
