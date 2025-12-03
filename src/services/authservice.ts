import prisma from "../prismaClient";
import { Role } from "../../generated/prisma"; // Import dari generated folder custom

export const authService = {
  findByEmail: (email: string) =>
    prisma.user.findUnique({
      where: { email },
      select: {
        nik: true,
        nomor_identitas_tunggal: true,
        email: true,
        password: true,
        nama: true,
        role: true,
        createdAt: true,
      }
    }),

  findByNik: (nik: string) =>
    prisma.user.findUnique({
      where: { nik },
      select: {
        nik: true,
        email: true,
        nama: true,
        role: true,
      }
    }),

  createUser: (data: {
    nik: string;
    nomor_identitas_tunggal: string;
    email: string;
    password: string;
    nama: string;
    role?: Role;
  }) =>
    prisma.user.create({ 
      data,
      select: {
        nik: true,
        nomor_identitas_tunggal: true,
        email: true,
        nama: true,
        role: true,
        createdAt: true,
      }
    }),
};
