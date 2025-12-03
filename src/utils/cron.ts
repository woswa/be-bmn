import cron from "node-cron";
import prisma from "../prismaClient";
import dayjs from "dayjs";
import { StatusP, StatusB, StatusBooking, StatusLokasi } from "../../generated/prisma";

/**
 * CRON JOB 1: Auto-activate peminjaman ketika waktu mulai tiba
 */
export const autoActivateBookings = cron.schedule("*/1 * * * *", async () => {
  try {
    const now = new Date();

    const bookings = await prisma.peminjamanP.findMany({
      where: {
        status: StatusP.booking,
        verifikasi: StatusBooking.diterima,
        waktuMulai: { lte: now },
      },
      include: { 
        items: true,
        lokasi: true,
      },
    });

    if (bookings.length === 0) return;

    console.log(`[CRON] Found ${bookings.length} booking(s) to activate`);

    for (const booking of bookings) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.peminjamanP.update({
            where: { id: booking.id },
            data: { status: StatusP.aktif },
          });

          const nupList = booking.items.map(item => item.nupBarang);
          await tx.barangUnit.updateMany({
            where: { nup: { in: nupList } },
            data: { status: StatusB.TidakTersedia },
          });

          if (booking.kodeLokasi) {
            await tx.dataLokasi.update({
              where: { kode_lokasi: booking.kodeLokasi },
              data: { status: StatusLokasi.dipinjam },
            });
          }
        });

        console.log(`[CRON] ✓ Booking ${booking.id} activated`);
      } catch (error) {
        console.error(`[CRON] ✗ Failed to activate booking ${booking.id}:`, error);
      }
    }
  } catch (error) {
    console.error("[CRON] Auto-activate error:", error);
  }
});

/**
 * CRON JOB 2: Auto-complete peminjaman ketika waktu selesai
 */
export const autoCompleteBookings = cron.schedule("*/1 * * * *", async () => {
  try {
    const now = new Date();

    const activeBookings = await prisma.peminjamanP.findMany({
      where: {
        status: StatusP.aktif,
        waktuSelesai: { lte: now },
      },
      include: {
        items: true,
        lokasi: true,
      }
    });

    if (activeBookings.length === 0) return;

    console.log(`[CRON] Found ${activeBookings.length} active booking(s) to complete`);

    for (const booking of activeBookings) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.peminjamanP.update({
            where: { id: booking.id },
            data: { status: StatusP.selesai },
          });

          const nupList = booking.items.map(item => item.nupBarang);
          await tx.barangUnit.updateMany({
            where: { nup: { in: nupList } },
            data: { status: StatusB.Tersedia },
          });

          if (booking.kodeLokasi) {
            await tx.dataLokasi.update({
              where: { kode_lokasi: booking.kodeLokasi },
              data: { status: StatusLokasi.tidakDipinjam },
            });
          }
        });

        console.log(`[CRON] ✓ Booking ${booking.id} completed`);
      } catch (error) {
        console.error(`[CRON] ✗ Failed to complete booking ${booking.id}:`, error);
      }
    }
  } catch (error) {
    console.error("[CRON] Auto-complete error:", error);
  }
});

/**
 * CRON JOB 3: Auto-cancel pending peminjaman
 */
export const autoCancelPendingBookings = cron.schedule("*/5 * * * *", async () => {
  try {
    const cutoffTime = dayjs().subtract(30, "minute").toDate();

    const pendingBookings = await prisma.peminjamanP.findMany({
      where: {
        verifikasi: StatusBooking.pending,
        status: StatusP.booking,
        createdAt: { lte: cutoffTime },
      },
      include: { 
        items: true,
        lokasi: true,
      },
    });

    if (pendingBookings.length === 0) return;

    console.log(`[CRON] Found ${pendingBookings.length} pending booking(s) to cancel`);

    for (const booking of pendingBookings) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.peminjamanP.update({
            where: { id: booking.id },
            data: { 
              status: StatusP.batal,
              verifikasi: StatusBooking.ditolak 
            },
          });

          const nupList = booking.items.map(item => item.nupBarang);
          await tx.barangUnit.updateMany({
            where: { nup: { in: nupList } },
            data: { status: StatusB.Tersedia },
          });

          if (booking.kodeLokasi) {
            await tx.dataLokasi.update({
              where: { kode_lokasi: booking.kodeLokasi },
              data: { status: StatusLokasi.tidakDipinjam },
            });
          }
        });

        console.log(`[CRON] ✓ Pending booking ${booking.id} auto-cancelled`);
      } catch (error) {
        console.error(`[CRON] ✗ Failed to cancel booking ${booking.id}:`, error);
      }
    }
  } catch (error) {
    console.error("[CRON] Auto-cancel error:", error);
  }
});

/**
 * Start all cron jobs (mereka sudah auto-start, ini untuk logging saja)
 */
export const startCronJobs = () => {
  console.log("[CRON] Cron jobs are running");
};

/**
 * Stop all cron jobs
 */
export const stopCronJobs = () => {
  console.log("[CRON] Stopping cron jobs...");
  autoActivateBookings.stop();
  autoCompleteBookings.stop();
  autoCancelPendingBookings.stop();
  console.log("[CRON] All cron jobs stopped");
};
