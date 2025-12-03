import { Router } from "express";
import { peminjamanController } from "../controllers/peminjamancontroller";
import { authMiddleware } from "../middleware/authmiddleware";
import { authorize } from "../middleware/authorize";
import { body, param, query } from "express-validator";
import { validate } from "../middleware/validate";
import { Role, StatusP, StatusBooking } from "../../generated/prisma";

const router = Router();

// POST create
router.post(
  "/",
  authMiddleware,
  authorize([Role.civitas_faste]),
  [
    body("kodeLokasi").optional().trim(),
    body("lokasiTambahan")
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage("Lokasi tambahan harus 5-200 karakter"),
    body("no_hp")
      .notEmpty()
      .withMessage("Nomor HP wajib diisi")
      .isMobilePhone("id-ID")
      .withMessage("Format nomor HP tidak valid"),
    body("Agenda")
      .notEmpty()
      .withMessage("Agenda wajib diisi")
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage("Agenda harus 5-500 karakter"),
    body("waktuMulai")
      .notEmpty()
      .withMessage("Waktu mulai wajib diisi")
      .isISO8601()
      .withMessage("Format waktu mulai tidak valid")
      .custom((value) => {
        const date = new Date(value);
        if (date < new Date()) {
          throw new Error("Waktu mulai tidak boleh di masa lalu");
        }
        return true;
      }),
    body("waktuSelesai")
      .notEmpty()
      .withMessage("Waktu selesai wajib diisi")
      .isISO8601()
      .withMessage("Format waktu selesai tidak valid")
      .custom((value, { req }) => {
        if (new Date(value) <= new Date(req.body.waktuMulai)) {
          throw new Error("Waktu selesai harus lebih besar dari waktu mulai");
        }
        return true;
      }),
    body("barangList")
      .isArray({ min: 1 })
      .withMessage("Barang list harus berupa array dengan minimal 1 item"),
    body("barangList.*")
      .notEmpty()
      .withMessage("NUP barang tidak boleh kosong")
      .trim(),
  ],
  validate,
  peminjamanController.create
);

// GET All
router.get(
  "/",
  authMiddleware,
  authorize([
    Role.civitas_faste,
    Role.staff,
    Role.staff_prodi,
    Role.kepala_bagian_akademik,
  ]),
  [
    query("status")
      .optional()
      .isIn(Object.values(StatusP))
      .withMessage("Status harus salah satu dari nilai enum StatusP"),
    query("verifikasi")
      .optional()
      .isIn(Object.values(StatusBooking))
      .withMessage(
        "Verifikasi harus salah satu dari nilai enum StatusBooking"
      ),
  ],
  validate,
  peminjamanController.findAll
);

// GET One
router.get(
  "/:id",
  authMiddleware,
  authorize([
    Role.civitas_faste,
    Role.staff,
    Role.staff_prodi,
    Role.kepala_bagian_akademik,
  ]),
  [param("id").isInt({ min: 1 }).withMessage("ID harus berupa angka positif")],
  validate,
  peminjamanController.findOne
);

// PUT Cancel (civitas)
router.put(
  "/cancel/:id",
  authMiddleware,
  authorize([Role.civitas_faste]),
  [param("id").isInt({ min: 1 }).withMessage("ID harus berupa angka positif")],
  validate,
  peminjamanController.cancel
);

// PUT Verify
router.put(
  "/verify/:id",
  authMiddleware,
  authorize([Role.kepala_bagian_akademik, Role.staff_prodi]),
  [
    param("id").isInt({ min: 1 }).withMessage("ID harus berupa angka positif"),
    body("verifikasi")
      .notEmpty()
      .withMessage("Status verifikasi wajib diisi")
      .isIn(Object.values(StatusBooking))
      .withMessage(
        "Verifikasi harus salah satu dari nilai enum StatusBooking"
      ),
  ],
  validate,
  peminjamanController.verify
);

// PUT Activate (manual, masih disediakan)
router.put(
  "/activate/:id",
  authMiddleware,
  authorize([Role.staff, Role.staff_prodi]),
  [param("id").isInt({ min: 1 }).withMessage("ID harus berupa angka positif")],
  validate,
  peminjamanController.activate
);

// PUT Return (manual, selain QR)
router.put(
  "/return/:id",
  authMiddleware,
  authorize([Role.staff, Role.staff_prodi]),
  [param("id").isInt({ min: 1 }).withMessage("ID harus berupa angka positif")],
  validate,
  peminjamanController.returnBarang
);

// POST Scan Pickup (QR)
router.post(
  "/scan-pickup/:id",
  authMiddleware,
  authorize([Role.staff, Role.staff_prodi]),
  [param("id").isInt({ min: 1 }).withMessage("ID harus berupa angka positif")],
  validate,
  peminjamanController.scanPickup
);

// POST Scan Return (QR)
router.post(
  "/scan-return/:id",
  authMiddleware,
  authorize([Role.staff, Role.staff_prodi]),
  [param("id").isInt({ min: 1 }).withMessage("ID harus berupa angka positif")],
  validate,
  peminjamanController.scanReturn
);

export default router;
