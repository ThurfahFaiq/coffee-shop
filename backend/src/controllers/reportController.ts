import { Request, Response } from 'express';
import { pool } from '../config/db';
import { sendResponse } from '../utils/respone';

export const getDailyReport = async (req: Request, res: Response) => {
  try {
    // Ambil tanggal dari URL (?date=YYYY-MM-DD), jika kosong pakai hari ini
    const date = req.query.date || new Date().toISOString().slice(0, 10);

    // 1. Hitung total pesanan dan total uang masuk (abaikan yang dibatalkan)
    const [report]: any = await pool.query(
      `SELECT 
        COUNT(id) AS total_orders,
        COALESCE(SUM(total_price), 0) AS total_revenue
       FROM orders 
       WHERE DATE(created_at) = ? AND status != 'dibatalkan'`,
      [date]
    );

    // 2. Hitung menu apa saja yang terjual beserta jumlahnya
    const [topProducts]: any = await pool.query(
      `SELECT p.name, SUM(oi.quantity) AS total_sold
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN products p ON oi.product_id = p.id
       WHERE DATE(o.created_at) = ? AND o.status != 'dibatalkan'
       GROUP BY p.id
       ORDER BY total_sold DESC`,
      [date]
    );

    return sendResponse(res, 200, true, `Laporan penjualan tanggal ${date}`, {
      date,
      summary: {
        total_orders: report[0].total_orders,
        total_revenue: Number(report[0].total_revenue)
      },
      products_sold: topProducts
    });

  } catch (error) {
    return sendResponse(res, 500, false, 'Terjadi kesalahan pada server');
  }
};