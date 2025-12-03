import { body } from "express-validator";

export const createBookingValidator = [
  body("userNik").notEmpty().withMessage("NIK wajib diisi"),

  body("no_hp")
    .notEmpty().withMessage("No HP wajib diisi")
    .isLength({ min: 10 }).withMessage("Nomor HP minimal 10 digit"),

  body("Agenda")
    .notEmpty().withMessage("Agenda wajib diisi")
    .isLength({ min: 5 }).withMessage("Agenda minimal 5 karakter"),

  body("waktuMulai")
    .isISO8601().withMessage("Format waktu mulai salah"),

  body("waktuSelesai")
    .isISO8601().withMessage("Format waktu selesai salah")
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.waktuMulai)) {
        throw new Error("Waktu selesai harus lebih besar dari waktu mulai");
      }
      return true;
    }),

  // Jika booking BMN → barang[] wajib
  body("barang")
    .if(body("barang").exists())
    .isArray().withMessage("Barang harus berupa array")
    .notEmpty().withMessage("Barang tidak boleh kosong"),

  // Jika pakai lokasi tambahan → kodeLokasi harus kosong
  body("lokasiTambahan")
    .optional()
    .custom((value, { req }) => {
      if (value && req.body.kodeLokasi) {
        throw new Error("Tidak boleh mengisi lokasiTambahan dan kodeLokasi bersamaan");
      }
      return true;
    }),
];
