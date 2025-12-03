import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

/**
 * Extended JWT payload used by the authentication middleware.
 */
export interface TokenPayload extends JwtPayload {
  nik: string;
  role: string;
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      res.status(401).json({ 
        success: false,
        message: "Token tidak ditemukan" 
      });
      return;
    }

    const token = header.split(" ")[1];

    if (!token) {
      res.status(401).json({ 
        success: false,
        message: "Token tidak valid" 
      });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }

    const decoded = jwt.verify(token, secret) as TokenPayload;

    if (!decoded.nik || !decoded.role) {
      res.status(401).json({ 
        success: false,
        message: "Token payload tidak valid" 
      });
      return;
    }

    // Type-safe assignment menggunakan declaration merging
    req.user = decoded;

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ 
        success: false,
        message: "Token sudah kadaluarsa" 
      });
      return;
    }
    
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ 
        success: false,
        message: "Token tidak valid" 
      });
      return;
    }

    res.status(500).json({ 
      success: false,
      message: "Terjadi kesalahan server" 
    });
  }
};
