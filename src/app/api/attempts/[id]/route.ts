import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const attempt = await prisma.examAttempt.findUnique({ where: { id }, include: { exam: true, user: { select: { id: true, name: true, username: true, absenNumber: true } }, answers: true } });
  if (!attempt || (session.role === "STUDENT" && attempt.userId !== session.id)) return NextResponse.json({ error: "Attempt tidak ditemukan." }, { status: 404 });

  const questions = await prisma.question.findMany({ where: { id: { in: attempt.questionOrder } }, select: { id: true, text: true, optionA: true, optionB: true, optionC: true, optionD: true, imageData: true } });
  const questionMap = new Map(questions.map((question) => [question.id, question]));
  const orderedQuestions = attempt.questionOrder.map((questionId) => questionMap.get(questionId)).filter(Boolean);
  return NextResponse.json({ attempt: { id: attempt.id, startTime: attempt.startTime, endTime: attempt.endTime, score: attempt.score, totalCorrect: attempt.totalCorrect, totalQuestions: attempt.totalQuestions, exam: { id: attempt.exam.id, title: attempt.exam.title, duration: attempt.exam.duration }, questions: orderedQuestions, answers: attempt.answers.map((answer) => ({ questionId: answer.questionId, selectedOption: answer.selectedOption })) } });
}
