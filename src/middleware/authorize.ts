import { Request, Response, NextFunction } from 'express';

export type UserRole = 
    | 'civitas_faste'
    | 'staff'
    | 'kepala_bagian_akademik'
    | 'staff_prodi';

/**
 * Middleware untuk membatasi akses berdasarkan role pengguna.
 * Harus digunakan SETELAH authMiddleware.
 */
export const authorize = (allowedRoles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const userRole = req.user?.role;

        if (!userRole) {
            res.status(403).json({ 
                success: false,
                message: "Informasi role pengguna tidak ditemukan" 
            });
            return;
        }

        if (allowedRoles.includes(userRole as UserRole)) {
            next();
        } else {
            res.status(403).json({ 
                success: false,
                message: "Anda tidak memiliki izin untuk mengakses resource ini" 
            });
        }
    };
};
