import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const exams = await prisma.exam.findMany({
    where: { isPublished: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true } }, attempts: { where: { userId: session.id }, orderBy: { startTime: "desc" }, take: 1 } },
  });

  return NextResponse.json({ exams: exams.map((exam) => ({ id: exam.id, title: exam.title, description: exam.description, duration: exam.duration, expiresAt: exam.expiresAt, questionCount: exam._count.questions, latestAttempt: exam.attempts[0] ? { id: exam.attempts[0].id, score: exam.attempts[0].score, endTime: exam.attempts[0].endTime } : null })) });
}
