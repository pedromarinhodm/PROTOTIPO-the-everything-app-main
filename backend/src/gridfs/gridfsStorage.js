/**
 * GridFS Storage
 * Configuração para armazenamento de arquivos no MongoDB
 */

import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

let formulariosBucket;
let productFilesBucket;

/**
 * Inicializa os buckets GridFS
 */
const initGridFS = () => {
  const db = mongoose.connection.db;
  
  // Bucket para formulários
  formulariosBucket = new GridFSBucket(db, {
    bucketName: 'formularios'
  });
  
  // Bucket para arquivos de produtos (notas fiscais)
  productFilesBucket = new GridFSBucket(db, {
    bucketName: 'product_files'
  });
  
  console.log('✅ GridFS inicializado (formularios + product_files)');
  return { formulariosBucket, productFilesBucket };
};

/**
 * Obtém o bucket de formulários
 */
const getFormulariosBucket = () => {
  if (!formulariosBucket) {
    initGridFS();
  }
  return formulariosBucket;
};

/**
 * Obtém o bucket de arquivos de produtos
 */
const getProductFilesBucket = () => {
  if (!productFilesBucket) {
    initGridFS();
  }
  return productFilesBucket;
};

/**
 * Obtém o bucket GridFS (padrão: formularios)
 */
const getBucket = () => {
  return getFormulariosBucket();
};

/**
 * Salva um buffer no GridFS (bucket de formulários)
 * @param {Buffer} buffer - Conteúdo do arquivo
 * @param {string} filename - Nome do arquivo
 * @param {object} metadata - Metadados adicionais
 * @returns {Promise<ObjectId>} - ID do arquivo salvo
 */
const saveToGridFS = (buffer, filename, metadata = {}) => {
  return new Promise((resolve, reject) => {
    const bucket = getFormulariosBucket();
    
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
      console.log(`✅ Arquivo salvo no GridFS (formularios): ${filename} (ID: ${uploadStream.id})`);
      resolve(uploadStream.id);
    });

    uploadStream.end(buffer);
  });
};

/**
 * Salva um buffer no GridFS (bucket de arquivos de produtos)
 * @param {Buffer} buffer - Conteúdo do arquivo
 * @param {string} filename - Nome do arquivo
 * @param {object} metadata - Metadados adicionais
 * @returns {Promise<ObjectId>} - ID do arquivo salvo
 */
const saveToProductFilesGridFS = (buffer, filename, metadata = {}) => {
  return new Promise((resolve, reject) => {
    const bucket = getProductFilesBucket();
    
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: {
        ...metadata,
        uploadDate: new Date(),
      }
    });

    uploadStream.on('error', (error) => {
      console.error('❌ Erro ao salvar no GridFS (product_files):', error);
      reject(error);
    });

    uploadStream.on('finish', () => {
      console.log(`✅ Arquivo salvo no GridFS (product_files): ${filename} (ID: ${uploadStream.id})`);
      resolve(uploadStream.id);
    });

    uploadStream.end(buffer);
  });
};

/**
 * Obtém um arquivo do GridFS por ID (bucket de formulários)
 * @param {ObjectId|string} fileId - ID do arquivo
 * @returns {Promise<{stream: ReadableStream, file: object}>}
 */
const getFromGridFS = async (fileId) => {
  const bucket = getFormulariosBucket();
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
 * Obtém um arquivo do GridFS por ID (bucket de arquivos de produtos)
 * @param {ObjectId|string} fileId - ID do arquivo
 * @returns {Promise<{stream: ReadableStream, file: object}>}
 */
const getFromProductFilesGridFS = async (fileId) => {
  const bucket = getProductFilesBucket();
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
 * Lista todos os arquivos do GridFS (bucket de formulários)
 * @returns {Promise<Array>}
 */
const listFiles = async () => {
  const bucket = getFormulariosBucket();
  const files = await bucket.find({}).sort({ uploadDate: -1 }).toArray();
  return files;
};

/**
 * Lista todos os arquivos do GridFS (bucket de arquivos de produtos)
 * @returns {Promise<Array>}
 */
const listProductFiles = async () => {
  const bucket = getProductFilesBucket();
  const files = await bucket.find({}).sort({ uploadDate: -1 }).toArray();
  return files;
};

/**
 * Deleta um arquivo do GridFS (bucket de formulários)
 * @param {ObjectId|string} fileId - ID do arquivo
 */
const deleteFromGridFS = async (fileId) => {
  const bucket = getFormulariosBucket();
  const _id = new mongoose.Types.ObjectId(fileId);
  await bucket.delete(_id);
  console.log(`🗑️ Arquivo deletado do GridFS (formularios): ${fileId}`);
};

/**
 * Deleta um arquivo do GridFS (bucket de arquivos de produtos)
 * @param {ObjectId|string} fileId - ID do arquivo
 */
const deleteFromProductFilesGridFS = async (fileId) => {
  const bucket = getProductFilesBucket();
  const _id = new mongoose.Types.ObjectId(fileId);
  await bucket.delete(_id);
  console.log(`🗑️ Arquivo deletado do GridFS (product_files): ${fileId}`);
};

export {
  initGridFS,
  getBucket,
  getFormulariosBucket,
  getProductFilesBucket,
  saveToGridFS,
  saveToProductFilesGridFS,
  getFromGridFS,
  getFromProductFilesGridFS,
  listFiles,
  listProductFiles,
  deleteFromGridFS,
  deleteFromProductFilesGridFS,
};
