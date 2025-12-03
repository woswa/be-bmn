import { Router } from "express";
import { lokasiController } from "../controllers/lokasicontroller";
import { authMiddleware } from "../middleware/authmiddleware";
import { authorize } from "../middleware/authorize";
import { body, param, query } from "express-validator";
import { validate } from "../middleware/validate";
import { Role, StatusLokasi } from "../../generated/prisma";

const router = Router();

// POST: Hanya Staff yang boleh membuat lokasi baru
router.post(
    "/", 
    authMiddleware, 
    authorize([Role.staff]),
    [
      body("kode_lokasi")
        .notEmpty()
        .withMessage("Kode lokasi wajib diisi")
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage("Kode lokasi harus 3-50 karakter"),
      body("lokasi")
        .notEmpty()
        .withMessage("Nama lokasi wajib diisi")
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage("Nama lokasi harus 3-200 karakter"),
      body("status")
        .optional()
        .isIn(Object.values(StatusLokasi))
        .withMessage(`Status harus salah satu dari: ${Object.values(StatusLokasi).join(", ")}`),
    ],
    validate,
    lokasiController.create
);

// GET All: Semua Staff yang terautentikasi boleh melihat data master
router.get(
    "/", 
    authMiddleware, 
    authorize([Role.staff, Role.staff_prodi, Role.kepala_bagian_akademik, Role.civitas_faste]),
    [
      query("status")
        .optional()
        .isIn(Object.values(StatusLokasi))
        .withMessage(`Status harus salah satu dari: ${Object.values(StatusLokasi).join(", ")}`),
    ],
    validate,
    lokasiController.findAll
);

// GET Available: Lokasi yang tersedia untuk peminjaman (untuk civitas)
router.get(
    "/available",
    authMiddleware,
    authorize([Role.civitas_faste, Role.staff, Role.staff_prodi]),
    lokasiController.findAvailable
);

// GET One: Semua Staff yang terautentikasi boleh melihat detail
router.get(
    "/:kode", 
    authMiddleware, 
    authorize([Role.staff, Role.staff_prodi, Role.kepala_bagian_akademik]),
    [
      param("kode")
        .notEmpty()
        .withMessage("Kode lokasi wajib diisi")
        .trim()
    ],
    validate,
    lokasiController.findOne
);

// PUT: Hanya Kepala Bagian Akademik yang boleh mengubah
router.put(
    "/:kode", 
    authMiddleware, 
    authorize([Role.kepala_bagian_akademik]),
    [
      param("kode")
        .notEmpty()
        .withMessage("Kode lokasi wajib diisi")
        .trim(),
      body("lokasi")
        .optional()
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage("Nama lokasi harus 3-200 karakter"),
      body("status")
        .optional()
        .isIn(Object.values(StatusLokasi))
        .withMessage(`Status harus salah satu dari: ${Object.values(StatusLokasi).join(", ")}`),
    ],
    validate,
    lokasiController.update
);

// PATCH: Update status saja (untuk staff ketika proses peminjaman)
router.patch(
    "/:kode/status",
    authMiddleware,
    authorize([Role.staff, Role.staff_prodi]),
    [
      param("kode")
        .notEmpty()
        .withMessage("Kode lokasi wajib diisi")
        .trim(),
      body("status")
        .notEmpty()
        .withMessage("Status wajib diisi")
        .isIn(Object.values(StatusLokasi))
        .withMessage(`Status harus salah satu dari: ${Object.values(StatusLokasi).join(", ")}`),
    ],
    validate,
    lokasiController.updateStatus
);

// DELETE: Hanya Kepala Bagian Akademik yang boleh menghapus
router.delete(
    "/:kode", 
    authMiddleware, 
    authorize([Role.kepala_bagian_akademik]),
    [
      param("kode")
        .notEmpty()
        .withMessage("Kode lokasi wajib diisi")
        .trim()
    ],
    validate,
    lokasiController.delete
);

export default router;
