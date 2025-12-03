import express from "express";
import { authController } from "../controllers/authcontroller";
import { body } from "express-validator";
import rateLimit from "express-rate-limit";
import { Role } from "../../generated/prisma"; // Import dari generated folder custom

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: "Terlalu banyak percobaan registrasi. Silakan coba lagi nanti"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  "/register",
  registerLimiter,
  [
    body("nik")
      .notEmpty()
      .withMessage("NIK wajib diisi")
      .isLength({ min: 16, max: 16 })
      .withMessage("NIK harus 16 karakter"),
    body("nomor_identitas_tunggal")
      .notEmpty()
      .withMessage("Nomor identitas tunggal wajib diisi"),
    body("email")
      .isEmail()
      .withMessage("Format email tidak valid")
      .normalizeEmail(),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password minimal 8 karakter")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("Password harus mengandung huruf besar, huruf kecil, dan angka"),
    body("nama")
      .notEmpty()
      .withMessage("Nama wajib diisi")
      .trim(),
    body("role")
      .optional()
      .isIn(Object.values(Role))
      .withMessage(`Role harus salah satu dari: ${Object.values(Role).join(", ")}`),
  ],
  authController.register
);
// LOGIN

router.post(
  "/login",
  loginLimiter,
  [
    body("email")
      .isEmail()
      .withMessage("Format email tidak valid")
      .normalizeEmail(),
    body("password")
      .notEmpty()
      .withMessage("Password wajib diisi"),
  ],
  authController.login
);

export default router;
