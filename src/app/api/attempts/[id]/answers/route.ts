import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { answerSchema } from "@/lib/validation";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const parsed = answerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Jawaban tidak valid." }, { status: 400 });
  const attempt = await prisma.examAttempt.findUnique({ where: { id } });
  if (!attempt || attempt.userId !== session.id || attempt.endTime) return NextResponse.json({ error: "Attempt sudah selesai atau tidak ditemukan." }, { status: 400 });
  if (!attempt.questionOrder.includes(parsed.data.questionId)) return NextResponse.json({ error: "Soal tidak termasuk dalam attempt." }, { status: 400 });
  const question = await prisma.question.findUnique({ where: { id: parsed.data.questionId }, select: { correctOption: true } });
  await prisma.answer.upsert({ where: { attemptId_questionId: { attemptId: id, questionId: parsed.data.questionId } }, update: { selectedOption: parsed.data.selectedOption, isCorrect: parsed.data.selectedOption === question?.correctOption }, create: { attemptId: id, questionId: parsed.data.questionId, selectedOption: parsed.data.selectedOption, isCorrect: parsed.data.selectedOption === question?.correctOption } });
  await prisma.user.update({ where: { id: session.id }, data: { lastActive: new Date() } });
  return NextResponse.json({ ok: true });
}
