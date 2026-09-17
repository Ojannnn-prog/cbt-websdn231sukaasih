import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const exam = await prisma.exam.findUnique({ where: { id }, select: { id: true, title: true, questions: { orderBy: { createdAt: "asc" }, select: { id: true, text: true, optionA: true, optionB: true, optionC: true, optionD: true, correctOption: true } } } });
  if (!exam) return NextResponse.json({ error: "Ujian tidak ditemukan." }, { status: 404 });
  const attempts = await prisma.examAttempt.findMany({ where: { examId: id, endTime: { not: null } }, orderBy: { endTime: "desc" }, select: { userId: true, answers: { select: { questionId: true, selectedOption: true, isCorrect: true } } } });
  const latestByStudent = new Map<string, typeof attempts[number]>();
  for (const attempt of attempts) if (!latestByStudent.has(attempt.userId)) latestByStudent.set(attempt.userId, attempt);
  const students = [...latestByStudent.values()];
  const stats = new Map(exam.questions.map((question) => [question.id, { correctCount: 0, wrongCount: 0 }]));
  for (const attempt of students) for (const answer of attempt.answers) { const stat = stats.get(answer.questionId); if (!stat) continue; if (answer.selectedOption && answer.isCorrect) stat.correctCount += 1; else if (answer.selectedOption) stat.wrongCount += 1; }
  return NextResponse.json({ analysis: { examTitle: exam.title, totalStudents: students.length, questions: exam.questions.map((question, index) => { const stat = stats.get(question.id)!; const unansweredCount = Math.max(0, students.length - stat.correctCount - stat.wrongCount); const answeredCount = stat.correctCount + stat.wrongCount; return { number: index + 1, id: question.id, text: question.text, options: { A: question.optionA, B: question.optionB, C: question.optionC, D: question.optionD }, correctOption: question.correctOption, correctCount: stat.correctCount, wrongCount: stat.wrongCount, unansweredCount, answeredCount, correctRate: students.length ? Math.round((stat.correctCount / students.length) * 100) : 0 }; }) } });
}
