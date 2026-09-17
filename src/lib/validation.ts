import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1).max(80),
  password: z.string().min(1).max(200),
});

export const questionSchema = z.object({
  text: z.string().trim().min(1).max(1000),
  optionA: z.string().trim().min(1).max(500),
  optionB: z.string().trim().min(1).max(500),
  optionC: z.string().trim().min(1).max(500),
  optionD: z.string().trim().min(1).max(500),
  correctOption: z.enum(["A", "B", "C", "D"]),
});

export const examSchema = z.object({
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().max(500).optional().default(""),
  duration: z.number().int().min(5).max(240),
  expiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional().default(null),
  questions: z.array(questionSchema).min(5).max(50),
});

export const answerSchema = z.object({
  questionId: z.string().min(1).max(100),
  selectedOption: z.enum(["A", "B", "C", "D"]).nullable(),
});
