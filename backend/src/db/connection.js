/**
 * Conexão com MongoDB
 * Configura a conexão com o banco de dados local
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/controle_estoque';
    
    const conn = await mongoose.connect(mongoURI, {
      // Opções de conexão modernas
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    console.log(`📦 Banco de dados: ${conn.connection.name}`);
    
    // Eventos de conexão
    mongoose.connection.on('error', (err) => {
      console.error('❌ Erro na conexão MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB desconectado');
    });

    return conn;
  } catch (error) {
    console.error('❌ Erro ao conectar com MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
