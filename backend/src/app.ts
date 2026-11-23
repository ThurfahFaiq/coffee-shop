import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/authRoutes';
import categoryRoutes from './routes/categoryRoutes'; // Import baru
import productRoutes from './routes/productRoutes';   // Import baru
import orderRoutes from './routes/orderRoutes'; 
import reportRoutes from './routes/reportRoutes';
const app: Application = express();

app.use(cors());
app.use(express.json());

// Menyajikan folder 'uploads' sebagai file statis
// Agar gambar bisa diakses di http://localhost:port/uploads/namafile.jpg
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'API Coffee Shop berjalan!' });
});

// Daftarkan Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes); // Daftarkan kategori
app.use('/api/products', productRoutes);   // Daftarkan produk
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportRoutes);

export default app;