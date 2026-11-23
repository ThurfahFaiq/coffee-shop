import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { readFileSync } from 'node:fs';

dotenv.config();

const caCertificatePath = process.env.DB_SSL_CA_PATH;
if (!caCertificatePath) {
  throw new Error('DB_SSL_CA_PATH belum diatur di .env');
}

export const pool = mysql.createPool({
  host: process.env.DB_HOST,       // Contoh: mysql-xxxx.aivencloud.com
  user: process.env.DB_USER,       // Contoh: avnadmin
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,   // Biasanya: defaultdb
  port: Number(process.env.DB_PORT) || 3306, // Aiven biasanya kasih port random, cek di dashboard
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
  ssl: {
    ca: readFileSync(caCertificatePath)
  }
});

export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Berhasil terhubung ke database Aiven MySQL!');
    connection.release();
  } catch (error) {
    console.error('❌ Gagal terhubung ke database:', error);
  }
};