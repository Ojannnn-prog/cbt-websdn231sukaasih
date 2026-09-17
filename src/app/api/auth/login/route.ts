import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const parsed = loginSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Username dan password wajib diisi." }, { status: 400 });

    const { password } = parsed.data;
    const username = parsed.data.username.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { username } });
    const now = new Date();

    if (user && !user.isActive) return NextResponse.json({ error: "Akun ini sudah dinonaktifkan. Hubungi administrator." }, { status: 403 });

    if (user?.cooldownUntil && now < user.cooldownUntil) {
      const seconds = Math.ceil((user.cooldownUntil.getTime() - now.getTime()) / 1000);
      return NextResponse.json({ error: `Terlalu banyak percobaan. Coba lagi dalam ${seconds} detik.`, cooldownSeconds: seconds }, { status: 429 });
    }

    const valid = user ? await bcrypt.compare(password, user.password) : false;
    if (!user || !valid) {
      if (user) {
        const nextFailed = user.failedLogin + 1;
        if (nextFailed >= 3) {
          await prisma.user.update({ where: { id: user.id }, data: { failedLogin: 0, cooldownUntil: new Date(now.getTime() + 15_000) } });
          return NextResponse.json({ error: "3 percobaan gagal. Login dikunci selama 15 detik.", cooldownSeconds: 15 }, { status: 429 });
        }
        await prisma.user.update({ where: { id: user.id }, data: { failedLogin: nextFailed } });
      }
      return NextResponse.json({ error: "Username atau password salah." }, { status: 401 });
    }

    const updatedUser = await prisma.user.update({ where: { id: user.id }, data: { failedLogin: 0, cooldownUntil: null, lastActive: user.role === "STUDENT" ? now : user.lastActive } });
    await createSession({ id: updatedUser.id, username: updatedUser.username, role: updatedUser.role, name: updatedUser.name, absenNumber: updatedUser.absenNumber });
    return NextResponse.json({ user: { id: updatedUser.id, username: updatedUser.username, role: updatedUser.role, name: updatedUser.name, absenNumber: updatedUser.absenNumber } });
  } catch (error) {
    console.error("Login route error", error);
    return NextResponse.json({ error: "Terjadi gangguan pada server login." }, { status: 500 });
  }
}
