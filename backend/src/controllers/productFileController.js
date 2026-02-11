/**
 * Controller: Product File
 * Endpoints para gerenciamento de arquivos de produtos no GridFS
 */

import { 
  saveToProductFilesGridFS, 
  getFromProductFilesGridFS, 
  deleteFromProductFilesGridFS 
} from '../gridfs/gridfsStorage.js';

/**
 * POST /api/product-files
 * Upload de nota fiscal de produto (PDF)
 */
const uploadProductFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    // Aceita somente PDF
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Apenas arquivos PDF são permitidos' });
    }

    const { produto_id, tipo } = req.body;
    const filename = Date.now() + '-' + req.file.originalname;

    const fileId = await saveToProductFilesGridFS(req.file.buffer, filename, {
      produto_id: produto_id || null,
      tipo: tipo || 'nota_fiscal',
      uploadDate: new Date(),
    });

    res.json({
      _id: fileId.toString(),
      fileId: fileId.toString(),
      filename: filename,
      length: req.file.buffer.length,
      uploadDate: new Date(),
      produto_id: produto_id || null,
      tipo: tipo || 'nota_fiscal',
    });
  } catch (error) {
    console.error('Erro ao fazer upload de arquivo de produto:', error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};

/**
 * GET /api/product-files/:id/view
 * Visualiza arquivo de produto inline (PDF)
 */
const viewProductFile = async (req, res) => {
  try {
    const { stream, file } = await getFromProductFilesGridFS(req.params.id);

    // Apenas PDFs suportados para visualização inline
    const isPDF = (file.contentType && file.contentType === 'application/pdf') || (file.filename && file.filename.toLowerCase().endsWith('.pdf'));
    if (!isPDF) {
      return res.status(400).json({ error: 'Visualização apenas suportada para PDFs' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="' + file.filename + '"');

    stream.pipe(res);

    stream.on('error', (err) => {
      console.error('Erro no stream:', err);
      if (!res.headersSent) res.status(500).json({ error: 'Erro ao transmitir arquivo' });
    });
  } catch (error) {
    console.error('Erro ao visualizar arquivo de produto:', error);
    if (error.message === 'Arquivo não encontrado') {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }
    res.status(500).json({ error: 'Erro ao visualizar arquivo de produto' });
  }
};

/**
 * GET /api/product-files/:id/download
 * Download de um arquivo de produto por ID
 */
const downloadProductFile = async (req, res) => {
  try {
    const { stream, file } = await getFromProductFilesGridFS(req.params.id);

    // Define headers para download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.setHeader('Content-Length', file.length);

    // Stream do arquivo
    stream.pipe(res);

    stream.on('error', (error) => {
      console.error('Erro no stream:', error);
      res.status(500).json({ error: 'Erro ao baixar arquivo' });
    });
  } catch (error) {
    console.error('Erro ao baixar arquivo de produto:', error);

    if (error.message === 'Arquivo não encontrado') {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    res.status(500).json({ error: 'Erro ao baixar arquivo de produto' });
  }
};

/**
 * DELETE /api/product-files/:id
 * Deleta um arquivo de produto
 */
const deleteProductFile = async (req, res) => {
  try {
    await deleteFromProductFilesGridFS(req.params.id);
    
    res.json({
      success: true,
      message: 'Arquivo deletado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar arquivo de produto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar arquivo',
      message: error.message,
    });
  }
};

export default {
  uploadProductFile,
  viewProductFile,
  downloadProductFile,
  deleteProductFile,
};
