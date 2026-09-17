import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fisherYates } from "@/lib/shuffle";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const exam = await prisma.exam.findUnique({ where: { id }, include: { questions: { select: { id: true } } } });
  if (!exam || !exam.isPublished) return NextResponse.json({ error: "Ujian tidak ditemukan." }, { status: 404 });
  if (exam.expiresAt && exam.expiresAt <= new Date()) return NextResponse.json({ error: "Ujian ini sudah expired." }, { status: 410 });

  const existing = await prisma.examAttempt.findFirst({ where: { userId: session.id, examId: exam.id, endTime: null }, orderBy: { startTime: "desc" } });
  if (existing) return NextResponse.json({ attemptId: existing.id });

  const questionOrder = fisherYates(exam.questions.map((question) => question.id));
  const attempt = await prisma.examAttempt.create({ data: { userId: session.id, examId: exam.id, questionOrder } });
  await prisma.user.update({ where: { id: session.id }, data: { lastActive: new Date() } });
  return NextResponse.json({ attemptId: attempt.id }, { status: 201 });
}
