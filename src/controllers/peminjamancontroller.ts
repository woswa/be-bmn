import { Request, Response } from "express";
import { peminjamanService } from "../services/peminjamanservice";
import { generateQR } from "../utils/generateQR";
import { StatusBooking, StatusP, Role } from "../../generated/prisma";

export const peminjamanController = {
  create: async (req: Request, res: Response): Promise<void> => {
    try {
      const userNik = req.user?.nik;

      if (!userNik) {
        res.status(401).json({
          success: false,
          message: "User tidak terautentikasi",
        });
        return;
      }

      const {
        kodeLokasi,
        lokasiTambahan,
        no_hp,
        Agenda,
        waktuMulai,
        waktuSelesai,
        barangList,
      } = req.body;

      const data = await peminjamanService.create({
        userNik,
        kodeLokasi: kodeLokasi || undefined,
        lokasiTambahan: lokasiTambahan || undefined,
        no_hp,
        Agenda,
        waktuMulai: new Date(waktuMulai),
        waktuSelesai: new Date(waktuSelesai),
        barangList,
      });

      const qr = await generateQR(`PINJAM-${data.id}`);

      res.status(201).json({
        success: true,
        message: "Peminjaman berhasil dibuat. Menunggu verifikasi staff",
        data: {
          peminjaman: data,
          qrCode: qr,
        },
      });
    } catch (err: any) {
      console.error("Create peminjaman error:", err);
      res.status(400).json({
        success: false,
        message: err.message || "Terjadi kesalahan saat membuat peminjaman",
      });
    }
  },

  findAll: async (req: Request, res: Response): Promise<void> => {
    try {
      const userRole = req.user?.role;
      const userNik = req.user?.nik;
      const { status, verifikasi } = req.query;

      const filters: {
        userNik?: string;
        status?: StatusP;
        verifikasi?: StatusBooking;
      } = {};

      if (userRole === Role.civitas_faste && userNik) {
        filters.userNik = userNik;
      }

      if (status && Object.values(StatusP).includes(status as StatusP)) {
        filters.status = status as StatusP;
      }

      if (
        verifikasi &&
        Object.values(StatusBooking).includes(verifikasi as StatusBooking)
      ) {
        filters.verifikasi = verifikasi as StatusBooking;
      }

      const data = await peminjamanService.findAll(filters);

      res.json({
        success: true,
        message: "Data peminjaman berhasil diambil",
        data,
        total: data.length,
        filters: Object.keys(filters).length > 0 ? filters : null,
      });
    } catch (err: any) {
      console.error("Find all peminjaman error:", err);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  },

  findOne: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const userRole = req.user?.role;
      const userNik = req.user?.nik;

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: "ID peminjaman tidak valid",
        });
        return;
      }

      const data = await peminjamanService.findOne(id);

      if (!data) {
        res.status(404).json({
          success: false,
          message: `Peminjaman dengan ID ${id} tidak ditemukan`,
        });
        return;
      }

      if (userRole === Role.civitas_faste && data.userNik !== userNik) {
        res.status(403).json({
          success: false,
          message: "Anda tidak memiliki akses untuk melihat peminjaman ini",
        });
        return;
      }

      res.json({
        success: true,
        message: "Data peminjaman berhasil diambil",
        data,
      });
    } catch (err: any) {
      console.error("Find one peminjaman error:", err);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  },

  cancel: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const userNik = req.user?.nik;

      if (!userNik) {
        res.status(401).json({
          success: false,
          message: "User tidak terautentikasi",
        });
        return;
      }

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: "ID peminjaman tidak valid",
        });
        return;
      }

      const data = await peminjamanService.cancel(id, userNik);

      res.json({
        success: true,
        message: "Peminjaman berhasil dibatalkan",
        data,
      });
    } catch (err: any) {
      console.error("Cancel peminjaman error:", err);
      res.status(400).json({
        success: false,
        message: err.message || "Terjadi kesalahan saat membatalkan peminjaman",
      });
    }
  },

  verify: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const { verifikasi } = req.body;
      const userRole = req.user?.role as Role | undefined;

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: "ID peminjaman tidak valid",
        });
        return;
      }

      if (!verifikasi || !Object.values(StatusBooking).includes(verifikasi)) {
        res.status(400).json({
          success: false,
          message: `Verifikasi harus salah satu dari: ${Object.values(
            StatusBooking
          ).join(", ")}`,
        });
        return;
      }

      if (!userRole) {
        res.status(401).json({
          success: false,
          message: "User tidak terautentikasi",
        });
        return;
      }

      const data = await peminjamanService.verify(
        id,
        verifikasi as StatusBooking,
        userRole
      );

      res.json({
        success: true,
        message: `Peminjaman berhasil ${
          verifikasi === StatusBooking.diterima ? "diverifikasi" : "ditolak"
        }`,
        data,
      });
    } catch (err: any) {
      console.error("Verify peminjaman error:", err);
      res.status(400).json({
        success: false,
        message: err.message || "Terjadi kesalahan saat verifikasi peminjaman",
      });
    }
  },

  activate: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: "ID peminjaman tidak valid",
        });
        return;
      }

      const data = await peminjamanService.activate(id);

      res.json({
        success: true,
        message: "Peminjaman berhasil diaktifkan",
        data,
      });
    } catch (err: any) {
      console.error("Activate peminjaman error:", err);
      res.status(400).json({
        success: false,
        message: err.message || "Terjadi kesalahan saat mengaktifkan peminjaman",
      });
    }
  },

  returnBarang: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: "ID peminjaman tidak valid",
        });
        return;
      }

      const data = await peminjamanService.returnBarang(id);

      res.json({
        success: true,
        message: "Barang berhasil dikembalikan",
        data,
      });
    } catch (err: any) {
      console.error("Return barang error:", err);
      res.status(400).json({
        success: false,
        message: err.message || "Terjadi kesalahan saat mengembalikan barang",
      });
    }
  },

  // SCAN PICKUP (QR) – hanya staff/staff_prodi
  scanPickup: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const petugasNik = req.user?.nik;

      if (!petugasNik) {
        res.status(401).json({
          success: false,
          message: "User tidak terautentikasi",
        });
        return;
      }

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: "ID peminjaman tidak valid",
        });
        return;
      }

      const data = await peminjamanService.scanPickup(id, petugasNik);

      res.json({
        success: true,
        message: "Scan pickup berhasil dicatat",
        data,
      });
    } catch (err: any) {
      console.error("Scan pickup error:", err);
      res.status(400).json({
        success: false,
        message: err.message || "Terjadi kesalahan saat scan pickup",
      });
    }
  },

  // SCAN RETURN (QR) – hanya staff/staff_prodi
  scanReturn: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const petugasNik = req.user?.nik;

      if (!petugasNik) {
        res.status(401).json({
          success: false,
          message: "User tidak terautentikasi",
        });
        return;
      }

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: "ID peminjaman tidak valid",
        });
        return;
      }

      const data = await peminjamanService.scanReturn(id, petugasNik);

      res.json({
        success: true,
        message: "Scan return berhasil dicatat",
        data,
      });
    } catch (err: any) {
      console.error("Scan return error:", err);
      res.status(400).json({
        success: false,
        message: err.message || "Terjadi kesalahan saat scan return",
      });
    }
  },
};
