"use client";

import { LogOut, ShieldCheck } from "lucide-react";
import { useState } from "react";
import type { SessionUser } from "@/lib/auth";

export function AppShell({ user, children, label }: { user: SessionUser; children: React.ReactNode; label: string }) {
  const [loggingOut, setLoggingOut] = useState(false);
  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4_000);
    try { await fetch("/api/auth/logout", { method: "POST", signal: controller.signal }); } catch { /* Redirect even when the server is restarting. */ } finally { window.clearTimeout(timeout); window.location.assign("/login"); }
  }
  return <div className="app-shell"><header className="topbar"><div className="brand-mark"><span className="brand-square">N</span><span>NextCBT</span></div><div className="topbar-right"><span className="role-pill"><ShieldCheck size={14} /> {label}</span><span className="user-name">{user.name || user.username}</span><button className="icon-button" onClick={logout} aria-label="Keluar" disabled={loggingOut}>{loggingOut ? "..." : <LogOut size={18} />}</button></div></header><main className="shell-content">{children}</main></div>;
}
