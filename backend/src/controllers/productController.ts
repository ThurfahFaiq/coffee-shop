import { Request, Response } from 'express';
import { pool } from '../config/db';
import { sendResponse } from '../utils/respone';

// GET /api/products
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    // Join dengan kategori untuk mendapatkan nama kategori
    const query = `
      SELECT p.*, c.name AS category_name 
      FROM products p 
      JOIN categories c ON p.category_id = c.id
    `;
    const [rows] = await pool.query(query);
    return sendResponse(res, 200, true, 'Berhasil mengambil data produk', rows);
  } catch (error) {
    return sendResponse(res, 500, false, 'Terjadi kesalahan pada server');
  }
};

// POST /api/products
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { category_id, name, description, price, is_available } = req.body;
    const image_path = req.file ? `/uploads/${req.file.filename}` : null;

    if (!category_id || !name || !price) {
      return sendResponse(res, 400, false, 'Kategori, Nama, dan Harga wajib diisi');
    }

    const [result]: any = await pool.query(
      'INSERT INTO products (category_id, name, description, price, image_path, is_available) VALUES (?, ?, ?, ?, ?, ?)',
      [category_id, name, description || null, price, image_path, is_available === 'true' ? 1 : 0]
    );

    return sendResponse(res, 201, true, 'Produk berhasil ditambahkan', {
      id: result.insertId, name, image_path
    });
  } catch (error) {
    return sendResponse(res, 500, false, 'Terjadi kesalahan pada server');
  }
};

// PUT /api/products/:id
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { category_id, name, description, price, is_available } = req.body;
    
    // Cek apakah produk ada
    const [existing]: any = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (existing.length === 0) return sendResponse(res, 404, false, 'Produk tidak ditemukan');

    // Jika upload gambar baru, pakai path baru. Jika tidak, pakai path lama.
    const image_path = req.file ? `/uploads/${req.file.filename}` : existing[0].image_path;

    await pool.query(
      'UPDATE products SET category_id=?, name=?, description=?, price=?, image_path=?, is_available=? WHERE id=?',
      [category_id, name, description, price, image_path, is_available === 'true' ? 1 : 0, id]
    );

    return sendResponse(res, 200, true, 'Produk berhasil diupdate');
  } catch (error) {
    return sendResponse(res, 500, false, 'Terjadi kesalahan pada server');
  }
};

// DELETE /api/products/:id
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [result]: any = await pool.query('DELETE FROM products WHERE id = ?', [id]);
    if (result.affectedRows === 0) return sendResponse(res, 404, false, 'Produk tidak ditemukan');

    return sendResponse(res, 200, true, 'Produk berhasil dihapus');
  } catch (error: any) {
    // Karena FK order_items -> products menggunakan RESTRICT
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return sendResponse(res, 409, false, 'Gagal menghapus. Produk ini sudah pernah dipesan. Tandai tidak tersedia saja.');
    }
    return sendResponse(res, 500, false, 'Terjadi kesalahan pada server');
  }
};