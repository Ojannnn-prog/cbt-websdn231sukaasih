import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { StudentPortal } from "@/components/StudentPortal";

export default async function StudentPage() {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") redirect("/login");
  return <StudentPortal user={session} />;
}
