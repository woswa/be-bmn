import { Request, Response } from "express";
import { laporanService } from "../services/laporanservice";
import { StatusBooking } from "../../generated/prisma";

export const laporanController = {
  exportPeminjamanExcel: async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { verifikasi, startDate, endDate } = req.query;

      const filters: {
        verifikasi?: StatusBooking;
        startDate?: Date;
        endDate?: Date;
      } = {};

      if (
        verifikasi &&
        Object.values(StatusBooking).includes(verifikasi as StatusBooking)
      ) {
        filters.verifikasi = verifikasi as StatusBooking;
      }

      if (startDate && typeof startDate === "string") {
        filters.startDate = new Date(startDate);
      }

      if (endDate && typeof endDate === "string") {
        filters.endDate = new Date(endDate);
      }

      const buffer = await laporanService.exportPeminjamanToExcel(filters);

      res.setHeader(
        "Content-Disposition",
        'attachment; filename="Laporan_Peminjaman_Selesai.xlsx"'
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      res.send(buffer);
    } catch (err: any) {
      console.error("Export Excel error:", err);
      res.status(500).json({
        success: false,
        message: err.message || "Terjadi kesalahan saat export Excel",
      });
    }
  },
};
