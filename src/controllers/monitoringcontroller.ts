import { Request, Response } from "express";
import { monitoringService } from "../services/monitoringservice";
import { Prisma, KondisiBarangM } from "../../generated/prisma";
import { v4 as uuidv4 } from "uuid";

export const monitoringController = {
  create: async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        nupBarang,
        waktu,
        plt,
        kondisiBarang,
        lokasiBarang,
        lokasiTambahan,
        foto,
        keterangan,
      } = req.body;

      // Validasi input wajib
      if (!nupBarang || !waktu || !plt || !kondisiBarang || !foto) {
        res.status(400).json({
          success: false,
          message: "NUP barang, waktu, PLT, kondisi barang, dan foto wajib diisi"
        });
        return;
      }

      // Validasi kondisi barang
      if (!Object.values(KondisiBarangM).includes(kondisiBarang)) {
        res.status(400).json({
          success: false,
          message: `Kondisi barang harus salah satu dari: ${Object.values(KondisiBarangM).join(", ")}`
        });
        return;
      }

      // Cek apakah barang exists
      const barangExists = await monitoringService.checkBarangExists(nupBarang);
      if (!barangExists) {
        res.status(404).json({
          success: false,
          message: `Barang dengan NUP ${nupBarang} tidak ditemukan`
        });
        return;
      }

      // Validasi lokasi jika menggunakan lokasiBarang
      if (lokasiBarang) {
        const lokasiExists = await monitoringService.checkLokasiExists(lokasiBarang);
        if (!lokasiExists) {
          res.status(404).json({
            success: false,
            message: `Lokasi dengan kode ${lokasiBarang} tidak ditemukan`
          });
          return;
        }
      }

      // Validasi tidak boleh isi lokasiBarang dan lokasiTambahan bersamaan
      if (lokasiBarang && lokasiTambahan) {
        res.status(400).json({
          success: false,
          message: "Tidak boleh mengisi lokasiBarang dan lokasiTambahan bersamaan"
        });
        return;
      }

      // Generate ID untuk monitoring
      const monitoringId = uuidv4();

      const data = await monitoringService.create({
        id: monitoringId,
        nupBarang,
        waktu: new Date(waktu),
        plt,
        kondisiBarang: kondisiBarang as KondisiBarangM,
        lokasiBarang: lokasiBarang || undefined,
        lokasiTambahan: lokasiTambahan || undefined,
        foto,
        keterangan: keterangan || undefined,
      });

      res.status(201).json({
        success: true,
        message: "Log monitoring berhasil ditambahkan",
        data
      });
    } catch (err: any) {
      console.error("Create monitoring error:", err);

      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2003') {
          res.status(400).json({
            success: false,
            message: "Foreign key constraint gagal. Pastikan NUP barang dan kode lokasi valid"
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server"
      });
    }
  },

  findAll: async (req: Request, res: Response): Promise<void> => {
    try {
      const { nupBarang, kondisiBarang, lokasiBarang, startDate, endDate } = req.query;

      // Build filters
      const filters: {
        nupBarang?: string;
        kondisiBarang?: KondisiBarangM;
        lokasiBarang?: string;
        startDate?: Date;
        endDate?: Date;
      } = {};

      if (nupBarang && typeof nupBarang === 'string') {
        filters.nupBarang = nupBarang;
      }

      if (kondisiBarang && Object.values(KondisiBarangM).includes(kondisiBarang as KondisiBarangM)) {
        filters.kondisiBarang = kondisiBarang as KondisiBarangM;
      }

      if (lokasiBarang && typeof lokasiBarang === 'string') {
        filters.lokasiBarang = lokasiBarang;
      }

      if (startDate && typeof startDate === 'string') {
        filters.startDate = new Date(startDate);
      }

      if (endDate && typeof endDate === 'string') {
        filters.endDate = new Date(endDate);
      }

      const data = await monitoringService.findAll(filters);

      res.json({
        success: true,
        message: "Data monitoring berhasil diambil",
        data,
        total: data.length,
        filters: Object.keys(filters).length > 0 ? filters : null
      });
    } catch (err: any) {
      console.error("Find all monitoring error:", err);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server"
      });
    }
  },

  findOne: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: "ID monitoring wajib diisi"
        });
        return;
      }

      const data = await monitoringService.findOne(id);

      if (!data) {
        res.status(404).json({
          success: false,
          message: `Monitoring dengan ID ${id} tidak ditemukan`
        });
        return;
      }

      res.json({
        success: true,
        message: "Data monitoring berhasil diambil",
        data
      });
    } catch (err: any) {
      console.error("Find one monitoring error:", err);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server"
      });
    }
  },

  update: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        waktu,
        plt,
        kondisiBarang,
        lokasiBarang,
        lokasiTambahan,
        foto,
        keterangan,
      } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message: "ID monitoring wajib diisi"
        });
        return;
      }

      // Validasi minimal ada satu field untuk update
      if (!waktu && !plt && !kondisiBarang && !lokasiBarang && !lokasiTambahan && !foto && !keterangan) {
        res.status(400).json({
          success: false,
          message: "Minimal satu field harus diisi untuk update"
        });
        return;
      }

      // Cek apakah monitoring exists
      const exists = await monitoringService.checkExists(id);
      if (!exists) {
        res.status(404).json({
          success: false,
          message: `Monitoring dengan ID ${id} tidak ditemukan`
        });
        return;
      }

      // Build update data
      const updateData: Prisma.MonitoringUpdateInput = {};

      if (waktu) updateData.waktu = new Date(waktu);
      if (plt) updateData.plt = plt;
      if (kondisiBarang && Object.values(KondisiBarangM).includes(kondisiBarang)) {
        updateData.kondisiBarang = kondisiBarang as KondisiBarangM;
      }
      if (lokasiBarang) {
        const lokasiExists = await monitoringService.checkLokasiExists(lokasiBarang);
        if (!lokasiExists) {
          res.status(404).json({
            success: false,
            message: `Lokasi dengan kode ${lokasiBarang} tidak ditemukan`
          });
          return;
        }
        updateData.dataLokasi = { connect: { kode_lokasi: lokasiBarang } };
      }
      if (lokasiTambahan !== undefined) updateData.lokasiTambahan = lokasiTambahan || null;
      if (foto) updateData.foto = foto;
      if (keterangan !== undefined) updateData.keterangan = keterangan || null;

      const data = await monitoringService.update(id, updateData);

      res.json({
        success: true,
        message: "Data monitoring berhasil diupdate",
        data
      });
    } catch (err: any) {
      console.error("Update monitoring error:", err);

      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2025') {
          res.status(404).json({
            success: false,
            message: "Monitoring tidak ditemukan"
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server"
      });
    }
  },

  delete: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: "ID monitoring wajib diisi"
        });
        return;
      }

      // Cek apakah monitoring exists
      const exists = await monitoringService.checkExists(id);
      if (!exists) {
        res.status(404).json({
          success: false,
          message: `Monitoring dengan ID ${id} tidak ditemukan`
        });
        return;
      }

      const data = await monitoringService.delete(id);

      res.json({
        success: true,
        message: "Data monitoring berhasil dihapus",
        data
      });
    } catch (err: any) {
      console.error("Delete monitoring error:", err);

      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2025') {
          res.status(404).json({
            success: false,
            message: "Monitoring tidak ditemukan"
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server"
      });
    }
  },

  findByBarang: async (req: Request, res: Response): Promise<void> => {
    try {
      const { nup } = req.params;

      if (!nup) {
        res.status(400).json({
          success: false,
          message: "NUP barang wajib diisi"
        });
        return;
      }

      const barangExists = await monitoringService.checkBarangExists(nup);
      if (!barangExists) {
        res.status(404).json({
          success: false,
          message: `Barang dengan NUP ${nup} tidak ditemukan`
        });
        return;
      }

      const data = await monitoringService.findByBarang(nup);

      res.json({
        success: true,
        message: "Riwayat monitoring barang berhasil diambil",
        data,
        total: data.length
      });
    } catch (err: any) {
      console.error("Find by barang error:", err);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server"
      });
    }
  }
};
