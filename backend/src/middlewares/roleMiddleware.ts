import { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/respone';

// Fungsi ini menerima parameter "roles" yang diizinkan
// Contoh pemakaian: allowRoles('admin') atau allowRoles('admin', 'customer')
export const allowRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // req.user didapat dari authMiddleware
    if (!req.user) {
      return sendResponse(res, 401, false, 'User tidak terautentikasi.');
    }

    // Cek apakah role user ada di dalam daftar roles yang diizinkan
    if (!roles.includes(req.user.role)) {
      return sendResponse(res, 403, false, 'Akses ditolak. Anda tidak memiliki izin (Role salah).');
    }

    // Jika role cocok, persilakan masuk
    next();
  };
};