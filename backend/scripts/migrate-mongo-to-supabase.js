import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createClient } from '@supabase/supabase-js';
import { GridFSBucket, ObjectId } from 'mongodb';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/controle_estoque';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no backend/.env');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ensureBucket = async (bucketName) => {
  const { data, error } = await supabase.storage.getBucket(bucketName);
  if (!error && data) return;

  const { error: createError } = await supabase.storage.createBucket(bucketName, {
    public: false,
    fileSizeLimit: 10485760,
    allowedMimeTypes: ['application/pdf'],
  });

  if (createError && !String(createError.message || '').toLowerCase().includes('already')) {
    throw createError;
  }
};

const streamToBuffer = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });

const sanitizeFilename = (filename) => {
  return filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_');
};

const migrateProducts = async (db) => {
  const products = await db.collection('produtos').find({}).toArray();
  if (!products.length) {
    console.log('Nenhum produto encontrado no MongoDB.');
    return;
  }

  const payload = products.map((product) => ({
    id: String(product._id),
    codigo: product.codigo ? String(product.codigo) : '000',
    descricao: product.descricao || 'Sem descricao',
    unidade: product.unidade || '',
    descricao_complementar: product.descricao_complementar || '',
    validade: product.validade || '',
    fornecedor: product.fornecedor || '',
    numero_processo: product.numero_processo || '',
    observacoes: product.observacoes || '',
    nota_fiscal_id: product.nota_fiscal_id ? String(product.nota_fiscal_id) : null,
    nota_fiscal_filename: product.nota_fiscal_filename || null,
    setor: product.setor || '',
    created_at: product.createdAt || new Date().toISOString(),
    updated_at: product.updatedAt || new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('products')
    .upsert(payload, { onConflict: 'id' });

  if (error) throw error;

  console.log(`Produtos migrados: ${payload.length}`);
};

const migrateMovements = async (db) => {
  const movements = await db.collection('movimentacaos').find({}).toArray();
  if (!movements.length) {
    console.log('Nenhuma movimentacao encontrada no MongoDB.');
    return;
  }

  const payload = movements
    .filter((movement) => movement.produto_id)
    .map((movement) => ({
      id: String(movement._id),
      produto_id: String(movement.produto_id),
      tipo: movement.tipo,
      quantidade: Number(movement.quantidade || 0),
      data: movement.data || movement.createdAt || new Date().toISOString(),
      servidor_almoxarifado: movement.servidor_almoxarifado || 'Sistema',
      setor_responsavel: movement.setor_responsavel || null,
      servidor_retirada: movement.servidor_retirada || null,
      observacoes: movement.observacoes || null,
      setor: movement.setor || null,
      created_at: movement.createdAt || new Date().toISOString(),
      updated_at: movement.updatedAt || new Date().toISOString(),
    }));

  const { error } = await supabase
    .from('movements')
    .upsert(payload, { onConflict: 'id' });

  if (error) throw error;

  console.log(`Movimentacoes migradas: ${payload.length}`);
};

const migrateGridFSBucket = async ({ db, bucketName, tableName, mapMetadata }) => {
  const files = await db.collection(`${bucketName}.files`).find({}).toArray();

  if (!files.length) {
    console.log(`Nenhum arquivo encontrado em ${bucketName}.`);
    return;
  }

  await ensureBucket(bucketName === 'product_files' ? 'product-files' : 'formularios');

  const bucket = new GridFSBucket(db, { bucketName });
  const targetBucket = bucketName === 'product_files' ? 'product-files' : 'formularios';

  for (const file of files) {
    const fileId = String(file._id);
    const filename = sanitizeFilename(file.filename || `${fileId}.pdf`);
    const storagePath = `${fileId}/${filename}`;

    const downloadStream = bucket.openDownloadStream(new ObjectId(file._id));
    const buffer = await streamToBuffer(downloadStream);

    const { error: storageError } = await supabase.storage
      .from(targetBucket)
      .upload(storagePath, buffer, {
        contentType: file.contentType || 'application/pdf',
        upsert: true,
      });

    if (storageError) throw storageError;

    const payload = {
      id: fileId,
      storage_path: storagePath,
      filename,
      content_type: file.contentType || 'application/pdf',
      size_bytes: Number(file.length || buffer.length),
      created_at: file.uploadDate || new Date().toISOString(),
      ...mapMetadata(file.metadata || {}),
    };

    const { error: dbError } = await supabase
      .from(tableName)
      .upsert(payload, { onConflict: 'id' });

    if (dbError) throw dbError;
  }

  console.log(`Arquivos migrados (${bucketName}): ${files.length}`);
};

const run = async () => {
  try {
    console.log('Conectando ao MongoDB...');
    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;

    console.log('Iniciando migracao para Supabase...');

    await migrateProducts(db);
    await migrateMovements(db);

    await migrateGridFSBucket({
      db,
      bucketName: 'formularios',
      tableName: 'formularios_files',
      mapMetadata: (metadata) => ({
        data_inicial: metadata.data_inicial || null,
        data_final: metadata.data_final || null,
      }),
    });

    await migrateGridFSBucket({
      db,
      bucketName: 'product_files',
      tableName: 'product_files',
      mapMetadata: (metadata) => ({
        produto_id: metadata.produto_id ? String(metadata.produto_id) : null,
        tipo: metadata.tipo || 'nota_fiscal',
      }),
    });

    console.log('Migracao concluida com sucesso.');
  } catch (error) {
    console.error('Erro na migracao:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
