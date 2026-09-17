import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const attempt = await prisma.examAttempt.findUnique({ where: { id }, include: { answers: true } });
  if (!attempt || attempt.userId !== session.id) return NextResponse.json({ error: "Attempt tidak ditemukan." }, { status: 404 });
  if (attempt.endTime) return NextResponse.json({ score: attempt.score, totalCorrect: attempt.totalCorrect, totalQuestions: attempt.totalQuestions });

  const totalQuestions = attempt.questionOrder.length;
  const totalCorrect = attempt.answers.filter((answer) => answer.isCorrect).length;
  const score = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 10000) / 100 : 0;
  const finished = await prisma.examAttempt.update({ where: { id }, data: { endTime: new Date(), score, totalCorrect, totalQuestions } });
  await prisma.user.update({ where: { id: session.id }, data: { lastActive: new Date() } });
  return NextResponse.json({ score: finished.score, totalCorrect: finished.totalCorrect, totalQuestions: finished.totalQuestions });
}
