import { Router } from "express";
import { barangUnitController } from "../controllers/barangunitcontroller";
import { authMiddleware } from "../middleware/authmiddleware"; 
import { authorize } from "../middleware/authorize";
import { body, param, query } from "express-validator";
import { validate } from "../middleware/validate";
import { Role, StatusB } from "../../generated/prisma";

const router = Router();

// POST: Hanya Staff yang boleh membuat barang unit baru
router.post(
    "/",
    authMiddleware,
    authorize([Role.staff]),
    [
      body("nup")
        .notEmpty()
        .withMessage("NUP wajib diisi")
        .trim()
        .isLength({ min: 5, max: 50 })
        .withMessage("NUP harus 5-50 karakter"),
      body("kodeBarang")
        .notEmpty()
        .withMessage("Kode barang wajib diisi")
        .trim(),
      body("lokasi")
        .notEmpty()
        .withMessage("Lokasi wajib diisi")
        .trim(),
      body("nikUser")
        .notEmpty()
        .withMessage("NIK user wajib diisi")
        .trim(),
      body("status")
        .optional()
        .isIn(Object.values(StatusB))
        .withMessage(`Status harus salah satu dari: ${Object.values(StatusB).join(", ")}`),
    ],
    validate,
    barangUnitController.create
);

// GET All: Staff boleh melihat semua barang unit dengan filter
router.get(
    "/",
    authMiddleware,
    authorize([Role.staff, Role.staff_prodi, Role.kepala_bagian_akademik]),
    [
      query("status")
        .optional()
        .isIn(Object.values(StatusB))
        .withMessage(`Status harus salah satu dari: ${Object.values(StatusB).join(", ")}`),
      query("lokasi")
        .optional()
        .trim(),
      query("kodeBarang")
        .optional()
        .trim(),
    ],
    validate,
    barangUnitController.findAll
);

// GET One: Staff boleh melihat detail barang unit
router.get(
    "/:nup",
    authMiddleware,
    authorize([Role.civitas_faste, Role.staff, Role.staff_prodi, Role.kepala_bagian_akademik]),
    [
      param("nup")
        .notEmpty()
        .withMessage("NUP wajib diisi")
        .trim()
    ],
    validate,
    barangUnitController.findOne
);

// PUT: Staff dan Staff Prodi boleh update barang unit
router.put(
    "/:nup",
    authMiddleware,
    authorize([Role.staff, Role.staff_prodi]),
    [
      param("nup")
        .notEmpty()
        .withMessage("NUP wajib diisi")
        .trim(),
      body("kodeBarang")
        .optional()
        .trim(),
      body("lokasi")
        .optional()
        .trim(),
      body("nikUser")
        .optional()
        .trim(),
      body("status")
        .optional()
        .isIn(Object.values(StatusB))
        .withMessage(`Status harus salah satu dari: ${Object.values(StatusB).join(", ")}`),
    ],
    validate,
    barangUnitController.update
);

// PATCH: Update status saja (untuk proses peminjaman/pengembalian)
router.patch(
    "/:nup/status",
    authMiddleware,
    authorize([Role.staff, Role.staff_prodi]),
    [
      param("nup")
        .notEmpty()
        .withMessage("NUP wajib diisi")
        .trim(),
      body("status")
        .notEmpty()
        .withMessage("Status wajib diisi")
        .isIn(Object.values(StatusB))
        .withMessage(`Status harus salah satu dari: ${Object.values(StatusB).join(", ")}`),
    ],
    validate,
    barangUnitController.updateStatus
);

// DELETE: Hanya Staff yang boleh menghapus barang unit
router.delete(
    "/:nup",
    authMiddleware,
    authorize([Role.staff]),
    [
      param("nup")
        .notEmpty()
        .withMessage("NUP wajib diisi")
        .trim()
    ],
    validate,
    barangUnitController.delete
);

export default router;
