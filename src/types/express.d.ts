// src/types/express.d.ts

// Sesuaikan path import ini agar menunjuk ke TokenPayload di authMiddleware Anda
import { TokenPayload } from '../middleware/authMiddleware'; 

// Ini memperluas tipe Request global yang digunakan oleh Express
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload; // Menambahkan user dengan tipe TokenPayload
        }
    }
}