import { Request, Response } from 'express';
import { pool } from '../config/db';
import { sendResponse } from '../utils/respone';

// ==========================================
// FITUR CUSTOMER: MEMBUAT PESANAN BARU
// ==========================================
export const createOrder = async (req: Request, res: Response) => {
  const connection = await pool.getConnection(); // Ambil koneksi khusus untuk transaksi
  try {
    const { order_type, table_number, notes, payment_method_id, items } = req.body;
    const userId = req.user?.id;

    // 1. Validasi Input Dasar
    if (!items || items.length === 0) {
      return sendResponse(res, 400, false, 'Pesanan minimal harus berisi 1 item');
    }
    if (order_type === 'dine_in' && !table_number) {
      return sendResponse(res, 400, false, 'Nomor meja wajib diisi untuk pesanan Dine In');
    }

    await connection.beginTransaction(); // MULAI TRANSAKSI

    // 2. Hitung Total Harga & Validasi Produk
    let totalPrice = 0;
    const orderItemsData = [];

    for (const item of items) {
      // Ambil harga produk langsung dari database (jangan percaya harga dari Flutter)
      const [products]: any = await connection.query(
        'SELECT price, is_available FROM products WHERE id = ?', 
        [item.product_id]
      );

      if (products.length === 0) throw new Error(`Produk dengan ID ${item.product_id} tidak ditemukan`);
      if (!products[0].is_available) throw new Error(`Produk dengan ID ${item.product_id} sedang habis`);

      const unitPrice = products[0].price;
      const subtotal = unitPrice * item.quantity;
      totalPrice += subtotal;

      orderItemsData.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        subtotal: subtotal,
        note: item.note || null
      });
    }

    // 3. Generate Kode Pesanan Unik (Contoh: CF-20261123-001)
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const [countOrders]: any = await connection.query(
      'SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURDATE()'
    );
    const sequence = String(countOrders[0].count + 1).padStart(3, '0');
    const orderCode = `CF-${today}-${sequence}`;

    // 4. Simpan ke tabel `orders`
    const [orderResult]: any = await connection.query(
      `INSERT INTO orders 
      (user_id, payment_method_id, order_code, order_type, table_number, status, total_price, notes) 
      VALUES (?, ?, ?, ?, ?, 'menunggu', ?, ?)`,
      [userId, payment_method_id || null, orderCode, order_type, table_number || null, totalPrice, notes || null]
    );
    const orderId = orderResult.insertId;

    // 5. Simpan ke tabel `order_items`
    for (const itemData of orderItemsData) {
      await connection.query(
        `INSERT INTO order_items 
        (order_id, product_id, quantity, unit_price, subtotal, note) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, itemData.product_id, itemData.quantity, itemData.unit_price, itemData.subtotal, itemData.note]
      );
    }

    await connection.commit(); // SIMPAN SEMUA DATA (BERHASIL)

    return sendResponse(res, 201, true, 'Pesanan berhasil dibuat', {
      order_id: orderId,
      order_code: orderCode,
      total_price: totalPrice
    });

  } catch (error: any) {
    await connection.rollback(); // BATALKAN SEMUA JIKA ADA ERROR
    return sendResponse(res, 400, false, error.message || 'Gagal membuat pesanan');
  } finally {
    connection.release(); // Kembalikan koneksi ke pool
  }
};

// ==========================================
// FITUR: MELIHAT DAFTAR PESANAN
// ==========================================
export const getOrders = async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.id;

    let query = `
      SELECT o.*, u.name AS customer_name 
      FROM orders o 
      JOIN users u ON o.user_id = u.id
    `;
    const params: any[] = [];

    // Jika yang minta adalah customer, batasi hanya pesanannya sendiri
    if (userRole !== 'admin') {
      query += ' WHERE o.user_id = ?';
      params.push(userId);
    }

    query += ' ORDER BY o.created_at DESC';

    const [orders]: any = await pool.query(query, params);

    // Ambil item pesanan untuk masing-masing order
    for (let order of orders) {
      const [items]: any = await pool.query(`
        SELECT oi.*, p.name AS product_name, p.image_path 
        FROM order_items oi 
        JOIN products p ON oi.product_id = p.id 
        WHERE oi.order_id = ?
      `, [order.id]);
      order.items = items;
    }

    return sendResponse(res, 200, true, 'Berhasil mengambil data pesanan', orders);
  } catch (error) {
    return sendResponse(res, 500, false, 'Terjadi kesalahan pada server');
  }
};

// ==========================================
// FITUR ADMIN: MENGUBAH STATUS PESANAN
// ==========================================
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'diproses', 'siap', 'selesai'

    // Validasi Enum Status
    const validStatuses = ['menunggu', 'diproses', 'siap', 'selesai', 'dibatalkan'];
    if (!validStatuses.includes(status)) {
      return sendResponse(res, 400, false, 'Status tidak valid');
    }

    const [result]: any = await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    if (result.affectedRows === 0) return sendResponse(res, 404, false, 'Pesanan tidak ditemukan');

    return sendResponse(res, 200, true, `Status pesanan berhasil diubah menjadi ${status}`);
  } catch (error) {
    return sendResponse(res, 500, false, 'Terjadi kesalahan pada server');
  }
};

// ==========================================
// FITUR CUSTOMER/ADMIN: MEMBATALKAN PESANAN
// ==========================================
export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    // Cek pesanan ada dan milik siapa
    const [orders]: any = await pool.query('SELECT user_id, status FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) return sendResponse(res, 404, false, 'Pesanan tidak ditemukan');

    const order = orders[0];

    // Validasi: Hanya pemilik pesanan (customer) atau admin yang bisa membatalkan
    if (userRole !== 'admin' && order.user_id !== userId) {
      return sendResponse(res, 403, false, 'Anda tidak berhak membatalkan pesanan ini');
    }

    // Validasi: Hanya bisa batal jika status masih 'menunggu'
    if (order.status !== 'menunggu') {
      return sendResponse(res, 400, false, 'Pesanan hanya bisa dibatalkan saat status masih "menunggu"');
    }

    await pool.query('UPDATE orders SET status = "dibatalkan" WHERE id = ?', [id]);
    return sendResponse(res, 200, true, 'Pesanan berhasil dibatalkan');
  } catch (error) {
    return sendResponse(res, 500, false, 'Terjadi kesalahan pada server');
  }
};