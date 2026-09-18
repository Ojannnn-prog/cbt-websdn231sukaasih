import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";

loadEnvConfig(process.cwd());
const sql = neon(process.env.DATABASE_URL!);

const statements = [
  `DO $$ BEGIN CREATE TYPE "Role" AS ENUM ('ADMIN', 'STUDENT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `CREATE TABLE IF NOT EXISTS "User" ("id" TEXT PRIMARY KEY, "username" TEXT NOT NULL UNIQUE, "password" TEXT NOT NULL, "role" "Role" NOT NULL DEFAULT 'STUDENT', "name" TEXT, "absenNumber" INTEGER, "lastActive" TIMESTAMP(3), "failedLogin" INTEGER NOT NULL DEFAULT 0, "cooldownUntil" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT TRUE;`,
  `CREATE TABLE IF NOT EXISTS "Exam" ("id" TEXT PRIMARY KEY, "title" TEXT NOT NULL, "description" TEXT, "duration" INTEGER NOT NULL DEFAULT 90, "isPublished" BOOLEAN NOT NULL DEFAULT TRUE, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);`,
  `ALTER TABLE "Exam" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);`,
  `DO $$ BEGIN IF to_regclass('"Question"') IS NOT NULL THEN ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "imageData" TEXT; END IF; END $$;`,
  `CREATE TABLE IF NOT EXISTS "Question" ("id" TEXT PRIMARY KEY, "examId" TEXT NOT NULL, "text" TEXT NOT NULL, "optionA" TEXT NOT NULL, "optionB" TEXT NOT NULL, "optionC" TEXT NOT NULL, "optionD" TEXT NOT NULL, "correctOption" TEXT NOT NULL, "imageData" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Question_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE);`,
  `CREATE TABLE IF NOT EXISTS "ExamAttempt" ("id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL, "examId" TEXT NOT NULL, "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "endTime" TIMESTAMP(3), "score" DOUBLE PRECISION, "totalCorrect" INTEGER, "totalQuestions" INTEGER, "questionOrder" TEXT[] NOT NULL, CONSTRAINT "ExamAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "ExamAttempt_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE);`,
  `CREATE TABLE IF NOT EXISTS "Answer" ("id" TEXT PRIMARY KEY, "attemptId" TEXT NOT NULL, "questionId" TEXT NOT NULL, "selectedOption" TEXT, "isCorrect" BOOLEAN NOT NULL DEFAULT FALSE, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Answer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ExamAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "Answer_attemptId_questionId_key" UNIQUE ("attemptId", "questionId"));`,
  `CREATE INDEX IF NOT EXISTS "ExamAttempt_userId_examId_idx" ON "ExamAttempt" ("userId", "examId");`,
];

async function main() {
  for (const statement of statements) await sql.query(statement);
  console.log("Database schema initialized");
}

main().catch((error) => { console.error(error); process.exit(1); });
