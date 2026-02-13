import { Readable } from 'stream';
import { supabase, STORAGE_BUCKETS } from '../db/supabaseClient.js';

const FORMULARIOS_TABLE = 'formularios_files';
const PRODUCT_FILES_TABLE = 'product_files';

const initGridFS = async () => {
  await ensureBucket(STORAGE_BUCKETS.FORMULARIOS);
  await ensureBucket(STORAGE_BUCKETS.PRODUCT_FILES);
  return {
    formulariosBucket: STORAGE_BUCKETS.FORMULARIOS,
    productFilesBucket: STORAGE_BUCKETS.PRODUCT_FILES,
  };
};

const ensureBucket = async (bucket) => {
  const { data, error } = await supabase.storage.getBucket(bucket);

  if (!error && data) return;

  const { error: createError } = await supabase.storage.createBucket(bucket, {
    public: false,
    fileSizeLimit: 10485760,
    allowedMimeTypes: ['application/pdf'],
  });

  if (createError && !String(createError.message || '').toLowerCase().includes('already')) {
    throw createError;
  }
};

const insertFileRow = async (table, values) => {
  const { data, error } = await supabase
    .from(table)
    .insert(values)
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

const getFileRow = async (table, fileId) => {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', fileId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Arquivo nao encontrado');

  return data;
};

const uploadToBucket = async (bucket, path, buffer) => {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) throw error;
};

const saveToGridFS = async (buffer, filename, metadata = {}) => {
  await ensureBucket(STORAGE_BUCKETS.FORMULARIOS);

  const row = await insertFileRow(FORMULARIOS_TABLE, {
    filename,
    data_inicial: metadata.data_inicial || null,
    data_final: metadata.data_final || null,
    content_type: 'application/pdf',
    size_bytes: buffer.length,
  });

  const storagePath = `${row.id}/${filename}`;

  await uploadToBucket(STORAGE_BUCKETS.FORMULARIOS, storagePath, buffer);

  const { error } = await supabase
    .from(FORMULARIOS_TABLE)
    .update({ storage_path: storagePath })
    .eq('id', row.id);

  if (error) throw error;

  return row.id;
};

const saveToProductFilesGridFS = async (buffer, filename, metadata = {}) => {
  await ensureBucket(STORAGE_BUCKETS.PRODUCT_FILES);

  const row = await insertFileRow(PRODUCT_FILES_TABLE, {
    filename,
    produto_id: metadata.produto_id || null,
    tipo: metadata.tipo || 'nota_fiscal',
    content_type: 'application/pdf',
    size_bytes: buffer.length,
  });

  const storagePath = `${row.id}/${filename}`;

  await uploadToBucket(STORAGE_BUCKETS.PRODUCT_FILES, storagePath, buffer);

  const { error } = await supabase
    .from(PRODUCT_FILES_TABLE)
    .update({ storage_path: storagePath })
    .eq('id', row.id);

  if (error) throw error;

  return row.id;
};

const buildFileResponse = async (bucket, row) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(row.storage_path);

  if (error) throw error;

  const buffer = Buffer.from(await data.arrayBuffer());

  return {
    stream: Readable.from(buffer),
    file: {
      _id: row.id,
      filename: row.filename,
      length: row.size_bytes,
      contentType: row.content_type,
      uploadDate: row.created_at,
      metadata: {
        data_inicial: row.data_inicial,
        data_final: row.data_final,
        produto_id: row.produto_id,
        tipo: row.tipo,
        uploadDate: row.created_at,
      },
    },
  };
};

const getFromGridFS = async (fileId) => {
  const row = await getFileRow(FORMULARIOS_TABLE, fileId);
  return buildFileResponse(STORAGE_BUCKETS.FORMULARIOS, row);
};

const getFromProductFilesGridFS = async (fileId) => {
  const row = await getFileRow(PRODUCT_FILES_TABLE, fileId);
  return buildFileResponse(STORAGE_BUCKETS.PRODUCT_FILES, row);
};

const listFiles = async () => {
  const { data, error } = await supabase
    .from(FORMULARIOS_TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row) => ({
    _id: row.id,
    filename: row.filename,
    uploadDate: row.created_at,
    metadata: {
      data_inicial: row.data_inicial,
      data_final: row.data_final,
      uploadDate: row.created_at,
    },
  }));
};

const listProductFiles = async () => {
  const { data, error } = await supabase
    .from(PRODUCT_FILES_TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

const deleteFileById = async (table, bucket, fileId) => {
  const row = await getFileRow(table, fileId);

  if (row.storage_path) {
    const { error: storageError } = await supabase.storage
      .from(bucket)
      .remove([row.storage_path]);

    if (storageError) throw storageError;
  }

  const { error: dbError } = await supabase
    .from(table)
    .delete()
    .eq('id', fileId);

  if (dbError) throw dbError;
};

const deleteFromGridFS = async (fileId) => {
  await deleteFileById(FORMULARIOS_TABLE, STORAGE_BUCKETS.FORMULARIOS, fileId);
};

const deleteFromProductFilesGridFS = async (fileId) => {
  await deleteFileById(PRODUCT_FILES_TABLE, STORAGE_BUCKETS.PRODUCT_FILES, fileId);
};

const getBucket = () => STORAGE_BUCKETS.FORMULARIOS;
const getFormulariosBucket = () => STORAGE_BUCKETS.FORMULARIOS;
const getProductFilesBucket = () => STORAGE_BUCKETS.PRODUCT_FILES;

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
