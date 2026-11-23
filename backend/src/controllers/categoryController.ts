import { Request, Response } from 'express';
import { pool } from '../config/db';
import { sendResponse } from '../utils/respone';

// GET /api/categories
export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories');
    return sendResponse(res, 200, true, 'Berhasil mengambil data kategori', rows);
  } catch (error) {
    return sendResponse(res, 500, false, 'Terjadi kesalahan pada server');
  }
};

// POST /api/categories
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) return sendResponse(res, 400, false, 'Nama kategori wajib diisi');

    const [result]: any = await pool.query('INSERT INTO categories (name) VALUES (?)', [name]);
    return sendResponse(res, 201, true, 'Kategori berhasil ditambahkan', { id: result.insertId, name });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') return sendResponse(res, 409, false, 'Nama kategori sudah ada');
    return sendResponse(res, 500, false, 'Terjadi kesalahan pada server');
  }
};

// PUT /api/categories/:id
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const [result]: any = await pool.query('UPDATE categories SET name = ? WHERE id = ?', [name, id]);
    if (result.affectedRows === 0) return sendResponse(res, 404, false, 'Kategori tidak ditemukan');

    return sendResponse(res, 200, true, 'Kategori berhasil diupdate', { id, name });
  } catch (error) {
    return sendResponse(res, 500, false, 'Terjadi kesalahan pada server');
  }
};

// DELETE /api/categories/:id
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Karena FK menggunakan RESTRICT, jika kategori masih dipakai produk, akan error
    const [result]: any = await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    if (result.affectedRows === 0) return sendResponse(res, 404, false, 'Kategori tidak ditemukan');

    return sendResponse(res, 200, true, 'Kategori berhasil dihapus');
  } catch (error: any) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return sendResponse(res, 409, false, 'Gagal menghapus. Kategori ini masih digunakan oleh produk.');
    }
    return sendResponse(res, 500, false, 'Terjadi kesalahan pada server');
  }
};