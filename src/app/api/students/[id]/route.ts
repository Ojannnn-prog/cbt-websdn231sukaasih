import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const studentUpdateSchema = z.object({ name: z.string().trim().min(2).max(150), password: z.string().min(8).max(200).optional(), isActive: z.boolean().optional() });

async function requireAdmin() {
  const session = await getSession();
  return session?.role === "ADMIN" ? session : null;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const student = await prisma.user.findFirst({ where: { id, role: "STUDENT" }, select: { id: true, username: true, name: true, absenNumber: true, isActive: true, lastActive: true, createdAt: true, attempts: { orderBy: { startTime: "desc" }, take: 10, select: { id: true, startTime: true, endTime: true, score: true, totalCorrect: true, totalQuestions: true, exam: { select: { title: true } } } } } });
  if (!student) return NextResponse.json({ error: "Siswa tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ student: { ...student, isOnline: student.isActive && !!student.lastActive && Date.now() - student.lastActive.getTime() < 60_000 } });
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const parsed = studentUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Nama wajib diisi dan password baru minimal 8 karakter." }, { status: 400 });
  const { name, password: newPassword, isActive } = parsed.data;
  const data: { name: string; isActive?: boolean; password?: string } = { name };
  if (typeof isActive === "boolean") data.isActive = isActive;
  if (newPassword) data.password = await bcrypt.hash(newPassword, 12);
  const existing = await prisma.user.findFirst({ where: { id, role: "STUDENT" }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Siswa tidak ditemukan." }, { status: 404 });
  await prisma.user.update({ where: { id: existing.id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const student = await prisma.user.findFirst({ where: { id, role: "STUDENT" }, select: { id: true } });
  if (!student) return NextResponse.json({ error: "Siswa tidak ditemukan." }, { status: 404 });
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
