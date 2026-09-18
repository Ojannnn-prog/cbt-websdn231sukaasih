"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, ClipboardList, Download, Eye, FilePlus2, Monitor, Pencil, Printer, RefreshCw, Trash2, UserRound, Users, X } from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

type QuestionDraft = { text: string; optionA: string; optionB: string; optionC: string; optionD: string; correctOption: "A" | "B" | "C" | "D"; imageData: string | null };
type ExamSummary = { id: string; title: string; description: string | null; duration: number; expiresAt: string | null; isPublished: boolean; isExpired: boolean; _count: { questions: number; attempts: number } };
const blankQuestion = (): QuestionDraft => ({ text: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A", imageData: null });

async function readJson(response: Response): Promise<any> {
  const text = await response.text();
  if (!text.trim()) return {};
  try { return JSON.parse(text); } catch { return { error: "Server mengembalikan respons yang tidak valid." }; }
}

function formatExpiry(expiresAt: string | null) {
  if (!expiresAt) return "Tanpa batas tanggal";
  return `Berlaku sampai ${new Date(expiresAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}`;
}

export function AdminDashboard({ user }: { user: SessionUser }) {
  const [dashboard, setDashboard] = useState<any>({ students: [], attempts: [] });
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [showExam, setShowExam] = useState(false);
  const [showStudent, setShowStudent] = useState(false);
  const [viewExamId, setViewExamId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExamSummary | null>(null);
  const [analysisExamId, setAnalysisExamId] = useState<string | null>(null);
  const [studentDetailId, setStudentDetailId] = useState<string | null>(null);
  const [studentEditId, setStudentEditId] = useState<string | null>(null);
  const [deleteStudentTarget, setDeleteStudentTarget] = useState<any | null>(null);
  const [sortMode, setSortMode] = useState<"absen" | "score">("absen");
  const [notice, setNotice] = useState("");

  async function load() {
    try {
      const [dashboardResponse, examsResponse] = await Promise.all([fetch("/api/dashboard", { cache: "no-store" }), fetch("/api/exams", { cache: "no-store" })]);
      if (dashboardResponse.status === 401 || examsResponse.status === 401) { window.location.assign("/login"); return; }
      if (!dashboardResponse.ok || !examsResponse.ok) throw new Error("Dashboard request failed");
      const dashboardData = await readJson(dashboardResponse); const examData = await readJson(examsResponse);
      setDashboard(dashboardData); setExams(examData.exams ?? []);
    } catch (error) { console.error(error); setNotice("Server lokal belum merespons. Coba lagi sebentar."); }
  }

  useEffect(() => { load(); const id = window.setInterval(load, 30_000); return () => window.clearInterval(id); }, []);
  useEffect(() => { if (!notice) return; const id = window.setTimeout(() => setNotice(""), 1_000); return () => window.clearTimeout(id); }, [notice]);

  const sortedAttempts = useMemo(() => [...dashboard.attempts].sort((a, b) => sortMode === "absen" ? (a.user.absenNumber ?? 999) - (b.user.absenNumber ?? 999) : (b.score ?? -1) - (a.score ?? -1)), [dashboard.attempts, sortMode]);
  async function exportPdf() { try { const { exportResultsPdf } = await import("@/lib/export-pdf"); await exportResultsPdf("results-table", "nextcbt-hasil-ujian.pdf", sortMode === "absen" ? "Nomor Absen" : "Nilai"); } catch (error) { console.error(error); setNotice("Export PDF gagal. Coba lagi."); } }

  async function deleteExam() {
    if (!deleteTarget) return;
    try {
      const response = await fetch(`/api/exams/${deleteTarget.id}`, { method: "DELETE" });
      const data = await readJson(response);
      if (!response.ok) { setNotice(data.error ?? "Ujian gagal dihapus."); return; }
      setExams((current) => current.filter((exam) => exam.id !== deleteTarget.id));
      setDeleteTarget(null);
      setNotice("Ujian berhasil dihapus.");
    } catch (error) { console.error(error); setNotice("Server lokal tidak merespons."); }
  }

  async function deleteStudent() {
    if (!deleteStudentTarget) return;
    try {
      const response = await fetch(`/api/students/${deleteStudentTarget.id}`, { method: "DELETE" });
      const data = await readJson(response);
      if (!response.ok) { setNotice(data.error ?? "Siswa gagal dihapus."); return; }
      setDashboard((current: any) => ({ ...current, students: current.students.filter((student: any) => student.id !== deleteStudentTarget.id) }));
      setDeleteStudentTarget(null);
      setNotice("Data siswa berhasil dihapus.");
    } catch (error) { console.error(error); setNotice("Server lokal tidak merespons."); }
  }

  return <AppShell user={user} label="ADMIN / GURU">
    <div className="page-heading"><div><span className="eyebrow">CONTROL ROOM / LIVE</span><h1>Dashboard <span className="accent-text">Admin</span></h1><p className="muted">Pantau aktivitas siswa, kelola ujian, dan cetak laporan.</p></div><button className="secondary-button" onClick={load}><RefreshCw size={17} /> Refresh data</button></div>
    {notice && <div className="flash-modal" role="status"><span>✓</span>{notice}</div>}
    <section className="stat-grid"><div className="stat-card yellow"><Users /><span>Siswa terdaftar</span><strong>{dashboard.students.length}</strong></div><div className="stat-card blue"><Monitor /><span>Online sekarang</span><strong>{dashboard.students.filter((s: any) => s.isOnline).length}</strong></div><div className="stat-card green"><ClipboardList /><span>Total ujian</span><strong>{exams.length}</strong></div><div className="stat-card red"><FilePlus2 /><span>Pengumpulan</span><strong>{dashboard.attempts.filter((a: any) => a.endTime).length}</strong></div></section>
    <div className="dashboard-grid"><section className="brutal-card panel"><div className="panel-heading"><div><span className="card-kicker">LIVE MONITORING</span><h2>Status siswa</h2></div><div className="panel-heading-actions"><span className="live-dot">● LIVE</span><button className="small-button print-button" onClick={() => window.print()}><Printer size={15} /> Cetak daftar siswa</button></div></div><div className="table-scroll"><table><thead><tr><th>Absen</th><th>Siswa</th><th>Status</th><th>Ujian terakhir</th><th>Nilai</th><th>Aksi</th></tr></thead><tbody>{dashboard.students.map((student: any) => <tr key={student.id}><td className="mono">{String(student.absenNumber ?? "—").padStart(2, "0")}</td><td><strong>{student.name || student.username}</strong><small>{student.username}</small></td><td><span className={`status ${student.isOnline ? "online" : "offline"}`}><i />{student.isOnline ? "Online" : "Offline"}</span><small>{student.isActive === false ? "Akun nonaktif" : "Akun aktif"}</small></td><td>{student.latestAttempt?.examTitle ?? "Belum mulai"}</td><td className="score-cell">{student.latestAttempt?.score != null ? student.latestAttempt.score : "—"}</td><td><div className="student-actions"><button className="row-action view" onClick={() => setStudentDetailId(student.id)} title="Lihat detail" aria-label={`Lihat detail ${student.name}`}><UserRound size={15} /></button><button className="row-action edit" onClick={() => setStudentEditId(student.id)} title="Edit siswa" aria-label={`Edit ${student.name}`}><Pencil size={15} /></button><button className="row-action delete" onClick={() => setDeleteStudentTarget(student)} title="Hapus siswa" aria-label={`Hapus ${student.name}`}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div>{dashboard.students.length === 0 && <div className="empty-state">Belum ada akun siswa.</div>}</section>
      <section className="brutal-card panel"><div className="panel-heading"><div><span className="card-kicker">MANAGEMENT</span><h2>Daftar ujian</h2></div><button className="small-button" onClick={() => setShowExam(true)}>+ Buat ujian</button></div><div className="exam-list">{exams.map((exam) => <div className="exam-list-item" key={exam.id}><div className="exam-number">{exam._count.questions}</div><div className="exam-list-copy"><strong>{exam.title}</strong><small>{exam.duration} menit · {exam._count.attempts} pengerjaan</small><small>{formatExpiry(exam.expiresAt)}</small></div><span className={exam.isExpired ? "expired-tag" : "published-tag"}>{exam.isExpired ? "EXPIRED" : exam.isPublished ? "PUBLISHED" : "DRAFT"}</span><div className="exam-actions"><button className="row-action view" onClick={() => setViewExamId(exam.id)} title="Lihat ujian" aria-label={`Lihat ${exam.title}`}><Eye size={15} /></button><button className="row-action analysis" onClick={() => setAnalysisExamId(exam.id)} title="Analisis soal" aria-label={`Analisis ${exam.title}`}><BarChart3 size={15} /></button><button className="row-action delete" onClick={() => setDeleteTarget(exam)} title="Hapus ujian" aria-label={`Hapus ${exam.title}`}><Trash2 size={15} /></button></div></div>)}</div>{exams.length === 0 && <div className="empty-state">Belum ada ujian.</div>}</section></div>
    <section className="brutal-card panel report-panel"><div className="panel-heading"><div><span className="card-kicker">REPORTING</span><h2>Hasil ujian</h2></div><div className="action-row"><select value={sortMode} onChange={(event) => setSortMode(event.target.value as "absen" | "score")}><option value="absen">Urutkan: Nomor absen</option><option value="score">Urutkan: Nilai tertinggi</option></select><button className="secondary-button" onClick={exportPdf}><Download size={16} /> Export PDF</button></div></div><div id="results-table" className="table-scroll"><table><thead><tr><th>Absen</th><th>Siswa</th><th>Ujian</th><th>Status</th><th>Nilai</th></tr></thead><tbody>{sortedAttempts.map((attempt: any) => <tr key={attempt.id}><td className="mono">{String(attempt.user.absenNumber ?? "—").padStart(2, "0")}</td><td>{attempt.user.name || attempt.user.username}</td><td>{attempt.exam.title}</td><td>{attempt.endTime ? <span className="status online"><i />Selesai</span> : <span className="status waiting"><i />Mengerjakan</span>}</td><td className={`score-cell ${(attempt.score ?? 0) >= 75 ? "pass" : "fail"}`}>{attempt.score ?? "—"}</td></tr>)}</tbody></table></div>{dashboard.attempts.length === 0 && <div className="empty-state">Belum ada hasil untuk ditampilkan.</div>}</section>
    <section id="student-print-sheet" aria-hidden="true"><h1>Daftar Siswa — NextCBT</h1><p>Daftar seluruh akun siswa dan status pengerjaan.</p><table><thead><tr><th>No.</th><th>Nama siswa</th><th>Username</th><th>Status akun</th><th>Status online</th><th>Ujian terakhir</th><th>Nilai terakhir</th></tr></thead><tbody>{dashboard.students.map((student: any) => <tr key={student.id}><td>{student.absenNumber ?? "—"}</td><td>{student.name || "—"}</td><td>{student.username}</td><td>{student.isActive === false ? "Nonaktif" : "Aktif"}</td><td>{student.isOnline ? "Online" : "Offline"}</td><td>{student.latestAttempt?.examTitle ?? "Belum mulai"}</td><td>{student.latestAttempt?.score ?? "—"}</td></tr>)}</tbody></table></section>
    {showExam && <ExamModal onClose={() => setShowExam(false)} onCreated={(text) => { setShowExam(false); setNotice(text); load(); }} />}
    {showStudent && <StudentModal onClose={() => setShowStudent(false)} onCreated={(text) => { setShowStudent(false); setNotice(text); load(); }} />}
    {viewExamId && <ViewExamModal examId={viewExamId} onClose={() => setViewExamId(null)} />}
    {deleteTarget && <ConfirmDeleteModal exam={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={deleteExam} />}
    {analysisExamId && <AnalysisModal examId={analysisExamId} onClose={() => setAnalysisExamId(null)} />}
    {studentDetailId && <StudentDetailModal studentId={studentDetailId} onClose={() => setStudentDetailId(null)} />}
    {studentEditId && <StudentEditModal studentId={studentEditId} onClose={() => setStudentEditId(null)} onSaved={(text) => { setStudentEditId(null); setNotice(text); load(); }} />}
    {deleteStudentTarget && <ConfirmDeleteStudentModal student={deleteStudentTarget} onCancel={() => setDeleteStudentTarget(null)} onConfirm={deleteStudent} />}
    <button className="floating-add" onClick={() => setShowStudent(true)} title="Tambah siswa">+ <span>Tambah siswa</span></button>
  </AppShell>;
}

function ExamModal({ onClose, onCreated }: { onClose: () => void; onCreated: (message: string) => void }) {
  const [title, setTitle] = useState(""); const [description, setDescription] = useState(""); const [duration, setDuration] = useState(90); const [expiresAt, setExpiresAt] = useState(""); const [questions, setQuestions] = useState<QuestionDraft[]>([blankQuestion(), blankQuestion(), blankQuestion(), blankQuestion(), blankQuestion()]); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  function update(index: number, key: keyof QuestionDraft, value: string) { setQuestions((current) => current.map((question, item) => item === index ? { ...question, [key]: value } as QuestionDraft : question)); }
  async function handleImage(index: number, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Gunakan gambar JPG, PNG, atau WebP.");
      event.target.value = "";
      return;
    }
    if (file.size > 1_500_000) {
      setError("Ukuran gambar maksimal 1,5 MB.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setQuestions((current) => current.map((question, item) => item === index ? { ...question, imageData: String(reader.result) } : question));
    };
    reader.onerror = () => setError("Gambar gagal dibaca.");
    reader.readAsDataURL(file);
  }
  function removeImage(index: number) {
    setQuestions((current) => current.map((question, item) => item === index ? { ...question, imageData: null } : question));
  }
  async function submit(event: React.FormEvent) { event.preventDefault(); setSaving(true); setError(""); try { const response = await fetch("/api/exams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, description, duration, expiresAt: expiresAt || null, questions }) }); const data = await readJson(response); if (!response.ok) { setError(data.error ?? "Gagal membuat ujian."); return; } onCreated("Ujian baru berhasil dibuat."); } catch { setError("Server lokal tidak merespons. Coba lagi."); } finally { setSaving(false); } }
  return <div className="modal-backdrop"><div className="modal-card wide"><div className="modal-header"><div><span className="card-kicker">NEW EXAM</span><h2>Buat ujian baru</h2></div><button className="icon-button" onClick={onClose}><X /></button></div><form onSubmit={submit}><div className="form-grid"><label>Judul ujian<input value={title} onChange={(e) => setTitle(e.target.value)} required /></label><label>Durasi (menit)<input type="number" min="5" max="240" value={duration} onChange={(e) => setDuration(Number(e.target.value))} required /></label></div><div className="form-grid"><label>Batas tanggal ujian <span className="field-hint">Kosongkan jika tanpa batas</span><input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} /></label><div /></div><label>Deskripsi<input value={description} onChange={(e) => setDescription(e.target.value)} /></label><div className="question-editor">{questions.map((question, index) => <div className="question-draft" key={index}><div className="draft-title">SOAL {index + 1}</div><input placeholder="Tulis pertanyaan..." value={question.text} onChange={(e) => update(index, "text", e.target.value)} required /><label className="media-upload">Gambar soal (opsional)<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => void handleImage(index, e)} /><span className="field-hint">JPG/PNG/WebP, maksimal 1,5 MB.</span></label>{question.imageData && <div className="question-image-editor"><img src={question.imageData} alt={"Preview soal " + (index + 1)} /><button type="button" className="link-button" onClick={() => removeImage(index)}>Hapus gambar</button></div>}<div className="option-grid">{(["A", "B", "C", "D"] as const).map((option) => <input key={option} placeholder={`Opsi ${option}`} value={question[`option${option}`]} onChange={(e) => update(index, `option${option}`, e.target.value)} required />)}</div><select value={question.correctOption} onChange={(e) => update(index, "correctOption", e.target.value)}><option value="A">Kunci: A</option><option value="B">Kunci: B</option><option value="C">Kunci: C</option><option value="D">Kunci: D</option></select></div>)}</div>{questions.length < 50 && <button type="button" className="link-button" onClick={() => setQuestions((current) => [...current, blankQuestion()])}>+ Tambah soal</button>}{error && <div className="error-box">{error}</div>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Batal</button><button className="primary-button" type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Simpan ujian"}</button></div></form></div></div>;
}

function ViewExamModal({ examId, onClose }: { examId: string; onClose: () => void }) {
  const [exam, setExam] = useState<any>(null); const [error, setError] = useState("");
  useEffect(() => { let cancelled = false; fetch(`/api/exams/${examId}`, { cache: "no-store" }).then(readJson).then((data) => { if (cancelled) return; data.exam ? setExam(data.exam) : setError(data.error ?? "Ujian tidak ditemukan."); }).catch(() => { if (!cancelled) setError("Gagal memuat detail ujian."); }); return () => { cancelled = true; }; }, [examId]);
  return <div className="modal-backdrop"><div className="modal-card wide"><div className="modal-header"><div><span className="card-kicker">EXAM DETAIL</span><h2>{exam?.title ?? "Memuat ujian..."}</h2></div><button className="icon-button" onClick={onClose}><X /></button></div>{error ? <div className="error-box">{error}</div> : exam ? <><p className="muted">{exam.description || "Tanpa deskripsi"}</p><div className="detail-strip"><span>{exam.questions.length} soal</span><span>{exam.duration} menit</span><span>{formatExpiry(exam.expiresAt)}</span></div><div className="view-question-list">{exam.questions.map((question: any, index: number) => <div className="view-question" key={question.id}>{question.imageData?.startsWith("data:image/") && <img className="view-question-image" src={question.imageData} alt={"Gambar soal " + (index + 1)} />}<strong>{index + 1}. {question.text}</strong><div className="view-options"><span>A. {question.optionA}</span><span>B. {question.optionB}</span><span>C. {question.optionC}</span><span>D. {question.optionD}</span></div><small>Kunci jawaban: <b>{question.correctOption}</b></small></div>)}</div></> : <div className="loading-block">Memuat detail ujian...</div>}<div className="modal-actions"><button className="secondary-button" onClick={onClose}>Tutup</button></div></div></div>;
}

function ConfirmDeleteModal({ exam, onCancel, onConfirm }: { exam: ExamSummary; onCancel: () => void; onConfirm: () => void }) {
  return <div className="modal-backdrop"><div className="modal-card confirm-card"><Trash2 size={34} /><h2>Hapus ujian?</h2><p className="muted"><strong>{exam.title}</strong> beserta soal, attempt, dan jawaban terkait akan dihapus permanen.</p><div className="modal-actions"><button className="secondary-button" onClick={onCancel}>Batal</button><button className="danger-button" onClick={onConfirm}>Ya, hapus</button></div></div></div>;
}

function StudentModal({ onClose, onCreated }: { onClose: () => void; onCreated: (message: string) => void }) {
  const [name, setName] = useState(""); const [absenNumber, setAbsenNumber] = useState(1); const [error, setError] = useState("");
  async function submit(event: React.FormEvent) { event.preventDefault(); setError(""); try { const response = await fetch("/api/students", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, absenNumber }) }); const data = await readJson(response); if (!response.ok) { setError(data.error ?? "Gagal membuat siswa."); return; } onCreated(`Akun ${data.student.username} dibuat.`); } catch { setError("Server lokal tidak merespons. Coba lagi."); } }
  return <div className="modal-backdrop"><div className="modal-card"><div className="modal-header"><div><span className="card-kicker">NEW STUDENT</span><h2>Tambah siswa</h2></div><button className="icon-button" onClick={onClose}><X /></button></div><form onSubmit={submit} className="stack-form"><label>Nama lengkap<input value={name} onChange={(e) => setName(e.target.value)} required /></label><label>Nomor absen<input type="number" min="1" max="200" value={absenNumber} onChange={(e) => setAbsenNumber(Number(e.target.value))} required /></label><p className="muted small">Username dibuat otomatis dengan format siswa231xxx.</p>{error && <div className="error-box">{error}</div>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Batal</button><button className="primary-button" type="submit">Buat akun</button></div></form></div></div>;
}

function StudentDetailModal({ studentId, onClose }: { studentId: string; onClose: () => void }) {
  const [student, setStudent] = useState<any>(null);
  const [error, setError] = useState("");
  useEffect(() => { let cancelled = false; fetch(`/api/students/${studentId}`, { cache: "no-store" }).then(readJson).then((data) => { if (cancelled) return; if (data.student) setStudent(data.student); else setError(data.error ?? "Data siswa tidak ditemukan."); }).catch(() => { if (!cancelled) setError("Gagal memuat detail siswa."); }); return () => { cancelled = true; }; }, [studentId]);
  return <div className="modal-backdrop"><div className="modal-card wide"><div className="modal-header"><div><span className="card-kicker">STUDENT DETAIL</span><h2>{student?.name ?? "Memuat siswa..."}</h2></div><button className="icon-button" onClick={onClose}><X /></button></div>{error ? <div className="error-box">{error}</div> : student ? <><div className="student-detail-grid"><div><span>Username</span><strong>{student.username}</strong></div><div><span>Nomor absen</span><strong>{student.absenNumber ?? "—"}</strong></div><div><span>Status akun</span><strong>{student.isActive ? "Aktif" : "Nonaktif"}</strong></div><div><span>Aktivitas</span><strong>{student.isOnline ? "Online" : "Offline"}</strong></div></div><p className="muted small">Aktif terakhir: {student.lastActive ? new Date(student.lastActive).toLocaleString("id-ID") : "Belum ada aktivitas"}</p><h3>Riwayat pengerjaan</h3><div className="table-scroll"><table><thead><tr><th>Ujian</th><th>Mulai</th><th>Status</th><th>Benar</th><th>Nilai</th></tr></thead><tbody>{student.attempts.map((attempt: any) => <tr key={attempt.id}><td>{attempt.exam.title}</td><td>{new Date(attempt.startTime).toLocaleString("id-ID")}</td><td>{attempt.endTime ? "Selesai" : "Mengerjakan"}</td><td>{attempt.totalCorrect}/{attempt.totalQuestions}</td><td className="score-cell">{attempt.score ?? "—"}</td></tr>)}</tbody></table></div>{student.attempts.length === 0 && <div className="empty-state">Belum ada riwayat pengerjaan.</div>}</> : <div className="loading-block">Memuat detail siswa...</div>}<div className="modal-actions"><button className="secondary-button" onClick={onClose}>Tutup</button></div></div></div>;
}

function StudentEditModal({ studentId, onClose, onSaved }: { studentId: string; onClose: () => void; onSaved: (message: string) => void }) {
  const [name, setName] = useState(""); const [password, setPassword] = useState(""); const [isActive, setIsActive] = useState(true); const [username, setUsername] = useState(""); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  useEffect(() => { fetch(`/api/students/${studentId}`, { cache: "no-store" }).then(readJson).then((data) => { if (data.student) { setName(data.student.name); setUsername(data.student.username); setIsActive(data.student.isActive); } else setError(data.error ?? "Data siswa tidak ditemukan."); }).catch(() => setError("Gagal memuat data siswa.")); }, [studentId]);
  async function submit(event: React.FormEvent) { event.preventDefault(); setSaving(true); setError(""); try { const response = await fetch(`/api/students/${studentId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, password: password || undefined, isActive }) }); const data = await readJson(response); if (!response.ok) { setError(data.error ?? "Data siswa gagal diperbarui."); return; } onSaved("Data siswa berhasil diperbarui."); } catch { setError("Server lokal tidak merespons."); } finally { setSaving(false); } }
  return <div className="modal-backdrop"><div className="modal-card"><div className="modal-header"><div><span className="card-kicker">EDIT STUDENT</span><h2>Edit siswa</h2></div><button className="icon-button" onClick={onClose}><X /></button></div><form onSubmit={submit} className="stack-form"><p className="muted small">Username: <strong>{username || "Memuat..."}</strong></p><label>Nama lengkap<input value={name} onChange={(e) => setName(e.target.value)} required /></label><label>Password baru <span className="field-hint">Kosongkan jika tidak ingin mengganti, minimal 8 karakter</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={password ? 8 : undefined} /></label><label className="checkbox-line"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Akun siswa aktif</label>{error && <div className="error-box">{error}</div>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Batal</button><button className="primary-button" type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Simpan perubahan"}</button></div></form></div></div>;
}

function ConfirmDeleteStudentModal({ student, onCancel, onConfirm }: { student: any; onCancel: () => void; onConfirm: () => void }) {
  return <div className="modal-backdrop"><div className="modal-card confirm-card"><Trash2 size={34} /><h2>Hapus siswa?</h2><p className="muted"><strong>{student.name || student.username}</strong> dan seluruh riwayat pengerjaannya akan dihapus permanen.</p><div className="modal-actions"><button className="secondary-button" onClick={onCancel}>Batal</button><button className="danger-button" onClick={onConfirm}>Ya, hapus</button></div></div></div>;
}

function AnalysisModal({ examId, onClose }: { examId: string; onClose: () => void }) {
  const [analysis, setAnalysis] = useState<any>(null); const [error, setError] = useState("");
  useEffect(() => { let cancelled = false; fetch(`/api/exams/${examId}/analysis`, { cache: "no-store" }).then(readJson).then((data) => { if (cancelled) return; if (data.analysis) setAnalysis(data.analysis); else setError(data.error ?? "Analisis tidak tersedia."); }).catch(() => { if (!cancelled) setError("Gagal memuat analisis soal."); }); return () => { cancelled = true; }; }, [examId]);
  return <div className="modal-backdrop"><div className="modal-card analysis-modal"><div className="modal-header"><div><span className="card-kicker">QUESTION ANALYSIS</span><h2>{analysis?.examTitle ?? "Analisis soal"}</h2></div><button className="icon-button" onClick={onClose}><X /></button></div>{error ? <div className="error-box">{error}</div> : analysis ? <><div className="analysis-summary"><strong>{analysis.totalStudents}</strong><span>siswa selesai dianalisis</span></div><div className="analysis-list">{analysis.questions.map((question: any) => <article className="analysis-card" key={question.id}><div className="analysis-card-head"><strong>Soal {question.number}</strong><span className="analysis-rate">{question.correctRate}% benar</span></div><p>{question.text}</p><div className="metric-row"><span>Benar <b>{question.correctCount}</b></span><div className="metric-track"><i className="metric-good" style={{ width: `${question.correctRate}%` }} /></div></div><div className="metric-row"><span>Salah <b>{question.wrongCount}</b></span><div className="metric-track"><i className="metric-bad" style={{ width: `${analysis.totalStudents ? Math.round((question.wrongCount / analysis.totalStudents) * 100) : 0}%` }} /></div></div><div className="analysis-foot"><span>Tidak dijawab: <b>{question.unansweredCount}</b></span><span>Kunci: <b>{question.correctOption}</b></span></div></article>)}</div></> : <div className="loading-block">Memuat analisis soal...</div>}<div className="modal-actions"><button className="secondary-button" onClick={onClose}>Tutup</button></div></div></div>;
}
