import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const exam = await prisma.exam.findUnique({ where: { id }, include: { questions: { orderBy: { createdAt: "asc" } }, _count: { select: { attempts: true } } } });
  if (!exam) return NextResponse.json({ error: "Ujian tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ exam: { ...exam, isExpired: !!exam.expiresAt && exam.expiresAt <= new Date() } });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const exam = await prisma.exam.findUnique({ where: { id }, select: { id: true } });
  if (!exam) return NextResponse.json({ error: "Ujian tidak ditemukan." }, { status: 404 });
  await prisma.exam.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
