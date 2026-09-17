import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const studentSchema = z.object({ name: z.string().trim().min(2).max(150), absenNumber: z.number().int().min(1).max(200) });

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = studentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Nama dan nomor absen harus valid." }, { status: 400 });
  const { name, absenNumber } = parsed.data;
  const username = `siswa231${String(absenNumber).padStart(3, "0")}`;
  const password = process.env.STUDENT_DEFAULT_PASSWORD ?? process.env.ADMIN_PASSWORD;
  if (!password) return NextResponse.json({ error: "Password default siswa belum dikonfigurasi di server." }, { status: 500 });
  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return NextResponse.json({ error: "Nomor absen tersebut sudah memiliki akun." }, { status: 409 });
  const student = await prisma.user.create({ data: { username, name, absenNumber, password: await bcrypt.hash(password, 12), role: "STUDENT" }, select: { id: true, username: true, name: true, absenNumber: true } });
  return NextResponse.json({ student, passwordNotice: "Password awal mengikuti konfigurasi server." }, { status: 201 });
}
