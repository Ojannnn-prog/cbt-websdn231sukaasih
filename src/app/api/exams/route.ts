import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { examSchema } from "@/lib/validation";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const exams = await prisma.exam.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { questions: true, attempts: true } } } });
  const now = new Date();
  return NextResponse.json({ exams: exams.map((exam) => ({ ...exam, isExpired: !!exam.expiresAt && exam.expiresAt <= now })) });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = examSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data ujian tidak valid. Minimal 5 dan maksimal 50 soal." }, { status: 400 });
  const expiresAt = parsed.data.expiresAt ? new Date(`${parsed.data.expiresAt}T23:59:59.999`) : null;
  const exam = await prisma.exam.create({ data: { title: parsed.data.title, description: parsed.data.description, duration: parsed.data.duration, expiresAt } });
  for (const question of parsed.data.questions) {
    await prisma.question.create({ data: { ...question, examId: exam.id } });
  }
  const createdExam = await prisma.exam.findUnique({ where: { id: exam.id }, include: { _count: { select: { questions: true } } } });
  return NextResponse.json({ exam: createdExam }, { status: 201 });
}
