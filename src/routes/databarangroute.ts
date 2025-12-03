import { Router } from "express";
import { dataBarangController } from "../controllers/databarangcontroller";
import { authMiddleware } from "../middleware/authmiddleware";
import { authorize } from "../middleware/authorize";
import { body, param } from "express-validator";
import { validate } from "../middleware/validate";
import { Role } from "../../generated/prisma";

const router = Router();

// POST: Hanya Staff yang boleh membuat item baru
router.post(
    "/", 
    authMiddleware, 
    authorize([Role.staff]),
    [
      body("kode_barang")
        .notEmpty()
        .withMessage("Kode barang wajib diisi")
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage("Kode barang harus 3-50 karakter"),
      body("jenis_barang")
        .notEmpty()
        .withMessage("Jenis barang wajib diisi")
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage("Jenis barang harus 3-100 karakter"),
      body("merek")
        .notEmpty()
        .withMessage("Merek wajib diisi")
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("Merek harus 2-100 karakter"),
    ],
    validate, // Middleware untuk handle validation errors
    dataBarangController.create
);

// GET All: Semua Staff yang terautentikasi boleh melihat data master
router.get(
    "/", 
    authMiddleware, 
    authorize([Role.staff, Role.staff_prodi, Role.kepala_bagian_akademik]), 
    dataBarangController.findAll
);

// GET One: Semua Staff yang terautentikasi boleh melihat detail
router.get(
    "/:kode", 
    authMiddleware, 
    authorize([Role.staff, Role.staff_prodi, Role.kepala_bagian_akademik]),
    [
      param("kode")
        .notEmpty()
        .withMessage("Kode barang wajib diisi")
        .trim()
    ],
    validate,
    dataBarangController.findOne
);

// PUT: Hanya Kepala Bagian Akademik yang boleh mengubah
router.put(
    "/:kode", 
    authMiddleware, 
    authorize([Role.kepala_bagian_akademik]),
    [
      param("kode")
        .notEmpty()
        .withMessage("Kode barang wajib diisi")
        .trim(),
      body("jenis_barang")
        .optional()
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage("Jenis barang harus 3-100 karakter"),
      body("merek")
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("Merek harus 2-100 karakter"),
    ],
    validate,
    dataBarangController.update
);

// DELETE: Hanya Kepala Bagian Akademik yang boleh menghapus
router.delete(
    "/:kode", 
    authMiddleware, 
    authorize([Role.kepala_bagian_akademik]),
    [
      param("kode")
        .notEmpty()
        .withMessage("Kode barang wajib diisi")
        .trim()
    ],
    validate,
    dataBarangController.remove
);

export default router;
