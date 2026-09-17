import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ExamRunner } from "@/components/ExamRunner";

export default async function ExamPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") redirect("/login");
  const { attemptId } = await params;
  return <ExamRunner attemptId={attemptId} user={session} />;
}
