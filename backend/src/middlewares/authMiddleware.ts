import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendResponse } from '../utils/respone';
import dotenv from 'dotenv';

dotenv.config();

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  // 1. Ambil token dari header Authorization (Format: Bearer <token>)
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendResponse(res, 401, false, 'Akses ditolak. Token tidak ditemukan.');
  }

  const token = authHeader.split(' ')[1]; // Ambil bagian setelah kata "Bearer "

  try {
    // 2. Verifikasi token menggunakan JWT_SECRET dari .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    
    // 3. Simpan data user (id, email, role) ke dalam req.user
    // Agar bisa dipakai oleh controller atau middleware selanjutnya
    req.user = decoded as any;
    
    // 4. Lanjutkan ke proses berikutnya (controller)
    next();
  } catch (error) {
    // Jika token expired atau palsu
    return sendResponse(res, 401, false, 'Token tidak valid atau sudah kedaluwarsa.');
  }
};