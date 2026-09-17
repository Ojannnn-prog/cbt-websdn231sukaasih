import { PrismaClient, Role } from "@prisma/client";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({ adapter: new PrismaNeonHTTP(process.env.DATABASE_URL!, { fullResults: true, arrayMode: true }) });

async function main() {
  const adminUsername = process.env.ADMIN_USERNAME ?? "admin";
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) throw new Error("ADMIN_PASSWORD wajib dikonfigurasi sebelum seed.");
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { username: adminUsername },
    update: { password: passwordHash, role: Role.ADMIN, name: "Guru Administrator" },
    create: { username: adminUsername, password: passwordHash, role: Role.ADMIN, name: "Guru Administrator" },
  });

  const examCount = await prisma.exam.count();
  if (examCount === 0) {
    const exam = await prisma.exam.create({
      data: {
        title: "Latihan CBT Matematika",
        description: "Contoh ujian awal untuk menguji alur NextCBT.",
        duration: 90,
      },
    });
    for (const question of [
            { text: "Berapakah hasil dari 12 × 8?", optionA: "86", optionB: "96", optionC: "108", optionD: "112", correctOption: "B" },
            { text: "Jika x + 7 = 15, nilai x adalah...", optionA: "6", optionB: "7", optionC: "8", optionD: "9", correctOption: "C" },
            { text: "Bentuk desimal dari 3/4 adalah...", optionA: "0,25", optionB: "0,5", optionC: "0,75", optionD: "1,25", correctOption: "C" },
            { text: "Bangun yang memiliki tiga sisi disebut...", optionA: "Segitiga", optionB: "Persegi", optionC: "Lingkaran", optionD: "Trapesium", correctOption: "A" },
            { text: "KPK dari 6 dan 8 adalah...", optionA: "12", optionB: "18", optionC: "24", optionD: "48", correctOption: "C" },
    ]) {
      await prisma.question.create({ data: { ...question, examId: exam.id } });
    }
  }

  console.log("Seed completed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
