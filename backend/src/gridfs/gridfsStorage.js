/**
 * GridFS Storage
 * Configuração para armazenamento de arquivos no MongoDB
 */

import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

let bucket;

/**
 * Inicializa o GridFS bucket
 */
const initGridFS = () => {
  const db = mongoose.connection.db;
  bucket = new GridFSBucket(db, {
    bucketName: 'formularios'
  });
  console.log('✅ GridFS inicializado');
  return bucket;
};

/**
 * Obtém o bucket GridFS
 */
const getBucket = () => {
  if (!bucket) {
    return initGridFS();
  }
  return bucket;
};

/**
 * Salva um buffer no GridFS
 * @param {Buffer} buffer - Conteúdo do arquivo
 * @param {string} filename - Nome do arquivo
 * @param {object} metadata - Metadados adicionais
 * @returns {Promise<ObjectId>} - ID do arquivo salvo
 */
const saveToGridFS = (buffer, filename, metadata = {}) => {
  return new Promise((resolve, reject) => {
    const bucket = getBucket();
    
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: {
        ...metadata,
        uploadDate: new Date(),
      }
    });

    uploadStream.on('error', (error) => {
      console.error('❌ Erro ao salvar no GridFS:', error);
      reject(error);
    });

    uploadStream.on('finish', () => {
      console.log(`✅ Arquivo salvo no GridFS: ${filename} (ID: ${uploadStream.id})`);
      resolve(uploadStream.id);
    });

    uploadStream.end(buffer);
  });
};

/**
 * Obtém um arquivo do GridFS por ID
 * @param {ObjectId|string} fileId - ID do arquivo
 * @returns {Promise<{stream: ReadableStream, file: object}>}
 */
const getFromGridFS = async (fileId) => {
  const bucket = getBucket();
  const _id = new mongoose.Types.ObjectId(fileId);
  
  // Busca informações do arquivo
  const files = await bucket.find({ _id }).toArray();
  
  if (files.length === 0) {
    throw new Error('Arquivo não encontrado');
  }

  const file = files[0];
  const stream = bucket.openDownloadStream(_id);
  
  return { stream, file };
};

/**
 * Lista todos os arquivos do GridFS
 * @returns {Promise<Array>}
 */
const listFiles = async () => {
  const bucket = getBucket();
  const files = await bucket.find({}).sort({ uploadDate: -1 }).toArray();
  return files;
};

/**
 * Deleta um arquivo do GridFS
 * @param {ObjectId|string} fileId - ID do arquivo
 */
const deleteFromGridFS = async (fileId) => {
  const bucket = getBucket();
  const _id = new mongoose.Types.ObjectId(fileId);
  await bucket.delete(_id);
  console.log(`🗑️ Arquivo deletado do GridFS: ${fileId}`);
};

export default {
  initGridFS,
  getBucket,
  saveToGridFS,
  getFromGridFS,
  listFiles,
  deleteFromGridFS,
};
