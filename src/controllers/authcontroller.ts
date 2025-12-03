import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import { authService } from "../services/authservice";
import { Role } from "../../generated/prisma"; // Import dari generated folder custom

export const authController = {
  register: async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
      return;
    }

    try {
      const {
        nik,
        nomor_identitas_tunggal,
        email,
        password,
        nama,
        role
      } = req.body;

      const existEmail = await authService.findByEmail(email);
      if (existEmail) {
        res.status(409).json({ 
          success: false,
          message: "Email sudah terdaftar" 
        });
        return;
      }

      const existNik = await authService.findByNik(nik);
      if (existNik) {
        res.status(409).json({ 
          success: false,
          message: "NIK sudah terdaftar" 
        });
        return;
      }

      const hashed = await bcrypt.hash(password, 12);

      // Validasi role jika dikirim dari request
      let userRole: Role = Role.civitas_faste;
      if (role && Object.values(Role).includes(role)) {
        userRole = role as Role;
      }

      const newUser = await authService.createUser({
        nik,
        nomor_identitas_tunggal,
        email,
        password: hashed,
        nama,
        role: userRole,
      });

      res.status(201).json({
        success: true,
        message: "Registrasi berhasil",
        data: {
          nik: newUser.nik,
          email: newUser.email,
          nama: newUser.nama,
          role: newUser.role
        }
      });
    } catch (err) {
      console.error("Register error:", err);
      res.status(500).json({ 
        success: false,
        message: "Terjadi kesalahan server" 
      });
    }
  },

  login: async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
      return;
    }

    try {
      const { email, password } = req.body;

      const user = await authService.findByEmail(email);
      
      if (!user) {
        res.status(401).json({ 
          success: false,
          message: "Email atau password tidak valid" 
        });
        return;
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        res.status(401).json({ 
          success: false,
          message: "Email atau password tidak valid" 
        });
        return;
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error("JWT_SECRET is not defined");
      }

      const accessToken = jwt.sign(
        {
          nik: user.nik,
          role: user.role
        },
        secret,
        { expiresIn: "1h" }
      );

      res.json({
        success: true,
        message: "Login berhasil",
        data: {
          accessToken,
          user: {
            nik: user.nik,
            email: user.email,
            nama: user.nama,
            role: user.role
          }
        }
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ 
        success: false,
        message: "Terjadi kesalahan server" 
      });
    }
  }
};
