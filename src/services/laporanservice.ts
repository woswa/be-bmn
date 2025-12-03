import prisma from "../prismaClient";
import { Prisma, StatusP, StatusBooking } from "../../generated/prisma";
import ExcelJS from "exceljs";

export const laporanService = {
  exportPeminjamanToExcel: async (filters?: {
    verifikasi?: StatusBooking;
    startDate?: Date;
    endDate?: Date;
  }) => {
    // Ambil data peminjaman dengan filters
    // WAJIB status = selesai
    const where: Prisma.PeminjamanPWhereInput = {
      status: StatusP.selesai, // HANYA SELESAI
    };

    if (filters?.verifikasi) where.verifikasi = filters.verifikasi;

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const data = await prisma.peminjamanP.findMany({
      where,
      include: {
        items: {
          include: {
            barangUnit: {
              include: {
                dataBarang: true,
              },
            },
          },
        },
        user: {
          select: {
            nik: true,
            nama: true,
            email: true,
            role: true,
          },
        },
        lokasi: {
          select: {
            kode_lokasi: true,
            lokasi: true,
          },
        },
        logScanBMN: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Buat workbook Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Laporan Peminjaman Selesai");

    // Set kolom header
    worksheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "ID Peminjaman", key: "id", width: 12 },
      { header: "Nama Peminjam", key: "nama_peminjam", width: 20 },
      { header: "NIK", key: "nik", width: 15 },
      { header: "Email", key: "email", width: 25 },
      { header: "Agenda", key: "agenda", width: 30 },
      { header: "Daftar Barang", key: "barang", width: 40 },
      { header: "Lokasi", key: "lokasi", width: 20 },
      { header: "Waktu Mulai", key: "waktu_mulai", width: 18 },
      { header: "Waktu Selesai", key: "waktu_selesai", width: 18 },
      { header: "Verifikasi", key: "verifikasi", width: 12 },
      { header: "Log Scan Pickup", key: "log_pickup", width: 28 },
      { header: "Log Scan Return", key: "log_return", width: 28 },
      { header: "Tgl Dibuat", key: "created_at", width: 18 },
    ];

    // Style header
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    headerRow.alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    // Isi data
    data.forEach((peminjaman, index) => {
      const barangList = peminjaman.items
        .map(
          (item) =>
            `${item.barangUnit.nup} (${item.barangUnit.dataBarang.jenis_barang})`
        )
        .join(", ");

      const lokasiDisplay = peminjaman.lokasi
        ? `${peminjaman.lokasi.kode_lokasi} - ${peminjaman.lokasi.lokasi}`
        : peminjaman.lokasiTambahan || "-";

      const pickupLogs = peminjaman.logScanBMN
        .filter((log) => log.jenis === "pickup")
        .map((log) => new Date(log.waktuScan).toLocaleString("id-ID"))
        .join(" | ");

      const returnLogs = peminjaman.logScanBMN
        .filter((log) => log.jenis === "return")
        .map((log) => new Date(log.waktuScan).toLocaleString("id-ID"))
        .join(" | ");

      worksheet.addRow({
        no: index + 1,
        id: peminjaman.id,
        nama_peminjam: peminjaman.user.nama,
        nik: peminjaman.user.nik,
        email: peminjaman.user.email,
        agenda: peminjaman.Agenda,
        barang: barangList,
        lokasi: lokasiDisplay,
        waktu_mulai: peminjaman.waktuMulai.toLocaleString("id-ID"),
        waktu_selesai: peminjaman.waktuSelesai.toLocaleString("id-ID"),
        verifikasi: peminjaman.verifikasi,
        log_pickup: pickupLogs || "-",
        log_return: returnLogs || "-",
        created_at: peminjaman.createdAt.toLocaleString("id-ID"),
      });
    });

    // Auto-fit kolom default
    worksheet.columns.forEach((column) => {
      if (!column.width) column.width = 15;
    });

    // Return buffer (file Excel)
    return await workbook.xlsx.writeBuffer();
  },
};
