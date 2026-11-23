export interface IUser {
  id?: number;
  name: string;
  email: string;
  password_hash?: string;
  role: 'admin' | 'customer';
  phone?: string;
}

// Menambahkan deklarasi global untuk request agar bisa menyimpan data user dari JWT
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}