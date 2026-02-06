/**
 * Controller: File
 * Endpoints para gerenciamento de arquivos no GridFS
 */

import { listFiles, getFromGridFS, deleteFromGridFS, saveToGridFS } from '../gridfs/gridfsStorage.js';

/**
 * GET /api/formularios
 * Lista todos os formulários armazenados
 */
const getFiles = async (req, res) => {
  try {
    const files = await listFiles();

    const formattedFiles = files.map(file => ({
      _id: file._id.toString(),
      fileId: file._id.toString(),
      filename: file.filename,
      data_inicial: file.metadata.data_inicial,
      data_final: file.metadata.data_final,
      uploadDate: file.metadata.uploadDate || file.uploadDate,
    }));

    res.json(formattedFiles);
  } catch (error) {
    console.error('Erro ao listar formulários:', error);
    res.status(500).json({ error: 'Erro ao listar formulários' });
  }
};

/**
 * POST /api/formularios
 * Upload de formulário (PDF) com metadata `data_inicial` e `data_final`
 */
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    // Aceita somente PDF
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Apenas arquivos PDF são permitidos' });
    }

    const { data_inicial, data_final } = req.body;
    const filename = Date.now() + '-' + req.file.originalname;

    const fileId = await saveToGridFS(req.file.buffer, filename, {
      data_inicial: data_inicial || null,
      data_final: data_final || null,
      uploadDate: new Date(),
    });

    res.json({
      message: 'Formulário salvo com sucesso',
      id: fileId.toString()
    });
  } catch (error) {
    console.error('Erro ao fazer upload de formulário:', error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};

/**
 * GET /api/formularios/:id/view
 * Visualiza formulário inline (PDF)
 */
const viewFile = async (req, res) => {
  try {
    const { stream, file } = await getFromGridFS(req.params.id);

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
    console.error('Erro ao visualizar formulário:', error);
    if (error.message === 'Arquivo não encontrado') {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }
    res.status(500).json({ error: 'Erro ao visualizar formulário' });
  }
};
/**
 * GET /api/formularios/:id/download
 * Download de um formulário por ID
 */
const downloadFile = async (req, res) => {
  try {
    const { stream, file } = await getFromGridFS(req.params.id);

    // Define headers para download
    res.setHeader('Content-Type', getContentType(file.filename));
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.setHeader('Content-Length', file.length);

    // Stream do arquivo
    stream.pipe(res);

    stream.on('error', (error) => {
      console.error('Erro no stream:', error);
      res.status(500).json({ error: 'Erro ao baixar arquivo' });
    });
  } catch (error) {
    console.error('Erro ao baixar formulário:', error);

    if (error.message === 'Arquivo não encontrado') {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    res.status(500).json({ error: 'Erro ao baixar formulário' });
  }
};

/**
 * DELETE /api/files/:id
 * Deleta um arquivo
 */
const deleteFile = async (req, res) => {
  try {
    await deleteFromGridFS(req.params.id);
    
    res.json({
      success: true,
      message: 'Arquivo deletado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar arquivo',
      message: error.message,
    });
  }
};

/**
 * Determina o Content-Type baseado na extensão
 */
const getContentType = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  
  const types = {
    pdf: 'application/pdf',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };

  return types[ext] || 'application/octet-stream';
};

export default {
  getFiles,
  uploadFile,
  viewFile,
  downloadFile,
  deleteFile,
};
