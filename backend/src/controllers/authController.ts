import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';
import { sendResponse } from '../utils/respone';
import dotenv from 'dotenv';

dotenv.config();

// --- FITUR REGISTER ---
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;

    // 1. Validasi Input (Sesuai syarat soal)
    if (!name || !email || !password) {
      return sendResponse(res, 400, false, 'Nama, email, dan password wajib diisi');
    }

    // 2. Cek apakah email sudah terdaftar
    const [existingUsers]: any = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return sendResponse(res, 409, false, 'Email sudah terdaftar'); // 409 Conflict
    }

    // 3. Hash Password menggunakan bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Simpan ke Database (Role default: customer)
    const [result]: any = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, 'customer', phone || null]
    );

    // 5. Kembalikan Response Sukses (Status 201 Created)
    return sendResponse(res, 201, true, 'Registrasi berhasil', {
      id: result.insertId,
      name,
      email,
      role: 'customer'
    });

  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, false, 'Terjadi kesalahan pada server');
  }
};

// --- FITUR LOGIN ---
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. Validasi Input
    if (!email || !password) {
      return sendResponse(res, 400, false, 'Email dan password wajib diisi');
    }

    // 2. Cari user berdasarkan email
    const [users]: any = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return sendResponse(res, 401, false, 'Email atau password salah'); // 401 Unauthorized
    }

    const user = users[0];

    // 3. Cek Password menggunakan bcrypt (bandingkan input dengan hash di DB)
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return sendResponse(res, 401, false, 'Email atau password salah');
    }

    // 4. Buat Token JWT (Berisi id, email, dan role)
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' } // Sesuai perencanaan: JWT berumur 1 hari
    );

    // 5. Kembalikan Response Sukses (Status 200 OK)
    return sendResponse(res, 200, true, 'Login berhasil', {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, false, 'Terjadi kesalahan pada server');
  }
};