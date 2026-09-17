"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true); setError("");
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) { setError(data.error ?? "Login gagal."); return; }
    router.push(data.user.role === "ADMIN" ? "/admin" : "/student");
    router.refresh();
  }

  return <section className="login-card brutal-card"><div className="card-kicker">ACCESS PORTAL</div><h2>Masuk ke ruang ujian</h2><p className="muted">Gunakan akun yang diberikan oleh administrator.</p><form onSubmit={submit} className="stack-form"><label>Username<div className="input-wrap"><UserRound size={18} /><input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="siswa231001" autoComplete="username" autoCapitalize="none" spellCheck={false} /></div></label><label>Password<div className="input-wrap"><LockKeyhole size={18} /><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan password" autoComplete="current-password" /><button type="button" className="password-toggle" aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"} title={showPassword ? "Sembunyikan password" : "Tampilkan password"} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>{error && <div className="error-box">{error}</div>}<button className="primary-button" type="submit" disabled={loading}>{loading ? "Memeriksa..." : "Masuk sekarang"}<ArrowRight size={18} /></button></form><div className="login-note">Percobaan login dibatasi. Setelah 3 kali gagal, akses dikunci 15 detik.</div></section>;
}
