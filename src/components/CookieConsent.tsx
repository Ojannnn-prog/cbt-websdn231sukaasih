"use client";

import { useEffect, useState } from "react";

const CONSENT_KEY = "nextcbt_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(CONSENT_KEY) === null);
    } catch {
      setVisible(true);
    }
  }, []);

  function choose(value: "accepted" | "declined") {
    try {
      window.localStorage.setItem(CONSENT_KEY, value);
      document.cookie = `${CONSENT_KEY}=${value}; Max-Age=${60 * 60 * 24 * 180}; Path=/; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
    } catch {
      // The app remains usable when storage is disabled by the browser.
    }
    setVisible(false);
  }

  if (!visible) return null;

  return <aside className="cookie-banner" role="dialog" aria-label="Preferensi cookies dan cache" aria-describedby="cookie-description">
    <div><strong>Cookies & cache</strong><p id="cookie-description">Kami menggunakan cookie sesi yang diperlukan untuk login dan penyimpanan lokal untuk preferensi agar aplikasi tetap nyaman digunakan. Tidak ada pelacakan iklan.</p></div>
    <div className="cookie-actions"><button className="secondary-button" onClick={() => choose("declined")}>Tolak</button><button className="primary-button" onClick={() => choose("accepted")}>Izinkan</button></div>
  </aside>;
}
