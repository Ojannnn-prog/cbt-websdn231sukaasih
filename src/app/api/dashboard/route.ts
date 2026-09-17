import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const now = Date.now();
  const students = await prisma.user.findMany({ where: { role: "STUDENT" }, orderBy: [{ absenNumber: "asc" }, { name: "asc" }], include: { attempts: { orderBy: { startTime: "desc" }, take: 1, include: { exam: { select: { title: true } } } } } });
  const attempts = await prisma.examAttempt.findMany({ orderBy: { startTime: "desc" }, include: { user: { select: { name: true, username: true, absenNumber: true } }, exam: { select: { title: true } } } });
  return NextResponse.json({ students: students.map((student) => ({ id: student.id, username: student.username, name: student.name, absenNumber: student.absenNumber, isActive: student.isActive, isOnline: student.isActive && !!student.lastActive && now - student.lastActive.getTime() < 60_000, lastActive: student.lastActive, latestAttempt: student.attempts[0] ? { score: student.attempts[0].score, endTime: student.attempts[0].endTime, examTitle: student.attempts[0].exam.title } : null })), attempts });
}
