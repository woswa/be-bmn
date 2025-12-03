import { Router } from "express";
import { laporanController } from "../controllers/laporancontroller";
import { authMiddleware } from "../middleware/authmiddleware";
import { authorize } from "../middleware/authorize";
import { query } from "express-validator";
import { validate } from "../middleware/validate";
import { Role, StatusBooking } from "../../generated/prisma";

const router = Router();

// GET: Export Laporan Peminjaman Selesai ke Excel
router.get(
  "/peminjaman/export",
  authMiddleware,
  authorize([Role.staff, Role.staff_prodi, Role.kepala_bagian_akademik]),
  [
    query("verifikasi")
      .optional()
      .isIn(Object.values(StatusBooking))
      .withMessage("Verifikasi tidak valid"),
    query("startDate")
      .optional()
      .isISO8601()
      .withMessage("Format startDate tidak valid"),
    query("endDate")
      .optional()
      .isISO8601()
      .withMessage("Format endDate tidak valid"),
  ],
  validate,
  laporanController.exportPeminjamanExcel
);

export default router;
