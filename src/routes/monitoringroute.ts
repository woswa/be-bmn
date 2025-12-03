import { Router } from "express";
import { monitoringController } from "../controllers/monitoringcontroller";
import { authMiddleware } from "../middleware/authmiddleware";
import { authorize } from "../middleware/authorize";
import { body, param, query } from "express-validator";
import { validate } from "../middleware/validate";
import { Role, KondisiBarangM } from "../../generated/prisma";

const router = Router();

// POST: Hanya Staff yang boleh membuat log monitoring
router.post(
    "/",
    authMiddleware,
    authorize([Role.staff, Role.staff_prodi]),
    [
      body("nupBarang")
        .notEmpty()
        .withMessage("NUP barang wajib diisi")
        .trim(),
      body("waktu")
        .notEmpty()
        .withMessage("Waktu wajib diisi")
        .isISO8601()
        .withMessage("Format waktu tidak valid"),
      body("plt")
        .notEmpty()
        .withMessage("PLT (Penanggung Jawab) wajib diisi")
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage("PLT harus 3-100 karakter"),
      body("kondisiBarang")
        .notEmpty()
        .withMessage("Kondisi barang wajib diisi")
        .isIn(Object.values(KondisiBarangM))
        .withMessage(`Kondisi barang harus salah satu dari: ${Object.values(KondisiBarangM).join(", ")}`),
      body("lokasiBarang")
        .optional()
        .trim(),
      body("lokasiTambahan")
        .optional()
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage("Lokasi tambahan harus 5-200 karakter"),
      body("foto")
        .notEmpty()
        .withMessage("Foto wajib diisi (base64 atau URL)"),
      body("keterangan")
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Keterangan maksimal 500 karakter"),
    ],
    validate,
    monitoringController.create
);

// GET All: Semua Staff berhak melihat audit log dengan filter
router.get(
    "/",
    authMiddleware,
    authorize([Role.staff, Role.staff_prodi, Role.kepala_bagian_akademik]),
    [
      query("nupBarang")
        .optional()
        .trim(),
      query("kondisiBarang")
        .optional()
        .isIn(Object.values(KondisiBarangM))
        .withMessage(`Kondisi barang harus salah satu dari: ${Object.values(KondisiBarangM).join(", ")}`),
      query("lokasiBarang")
        .optional()
        .trim(),
      query("startDate")
        .optional()
        .isISO8601()
        .withMessage("Format start date tidak valid"),
      query("endDate")
        .optional()
        .isISO8601()
        .withMessage("Format end date tidak valid"),
    ],
    validate,
    monitoringController.findAll
);

// GET History by Barang: Riwayat monitoring suatu barang
router.get(
    "/barang/:nup",
    authMiddleware,
    authorize([Role.staff, Role.staff_prodi, Role.kepala_bagian_akademik]),
    [
      param("nup")
        .notEmpty()
        .withMessage("NUP barang wajib diisi")
        .trim()
    ],
    validate,
    monitoringController.findByBarang
);

// GET One: Detail monitoring
router.get(
    "/:id",
    authMiddleware,
    authorize([Role.staff, Role.staff_prodi, Role.kepala_bagian_akademik]),
    [
      param("id")
        .notEmpty()
        .withMessage("ID monitoring wajib diisi")
        .trim()
    ],
    validate,
    monitoringController.findOne
);

// PUT: Hanya Kepala Bagian Akademik yang boleh mengubah log
router.put(
    "/:id",
    authMiddleware,
    authorize([Role.kepala_bagian_akademik]),
    [
      param("id")
        .notEmpty()
        .withMessage("ID monitoring wajib diisi")
        .trim(),
      body("waktu")
        .optional()
        .isISO8601()
        .withMessage("Format waktu tidak valid"),
      body("plt")
        .optional()
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage("PLT harus 3-100 karakter"),
      body("kondisiBarang")
        .optional()
        .isIn(Object.values(KondisiBarangM))
        .withMessage(`Kondisi barang harus salah satu dari: ${Object.values(KondisiBarangM).join(", ")}`),
      body("keterangan")
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Keterangan maksimal 500 karakter"),
    ],
    validate,
    monitoringController.update
);

// DELETE: Hanya Kepala Bagian Akademik yang boleh menghapus log
router.delete(
    "/:id",
    authMiddleware,
    authorize([Role.kepala_bagian_akademik]),
    [
      param("id")
        .notEmpty()
        .withMessage("ID monitoring wajib diisi")
        .trim()
    ],
    validate,
    monitoringController.delete
);

export default router;
