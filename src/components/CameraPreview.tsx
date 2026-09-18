"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, RefreshCw, ShieldAlert } from "lucide-react";

type CameraStatus = "idle" | "requesting" | "ready" | "error";

type CameraPreviewProps = {
  compact?: boolean;
  autoStart?: boolean;
  onReadyChange?: (ready: boolean) => void;
};

export function CameraPreview({ compact = false, autoStart = false, onReadyChange }: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [error, setError] = useState("");

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const requestCamera = useCallback(async () => {
    setStatus("requesting");
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Browser ini tidak mendukung akses kamera. Gunakan Chrome, Safari, atau Firefox terbaru.");
      setStatus("error");
      return;
    }
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "user" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      streamRef.current = stream;
      setStatus("ready");
    } catch (cameraError) {
      console.error(cameraError);
      setError("Kamera belum diizinkan. Pilih Allow/Izinkan pada browser, lalu coba lagi.");
      setStatus("error");
    }
  }, [stopCamera]);

  useEffect(() => {
    if (autoStart && status === "idle") void requestCamera();
  }, [autoStart, requestCamera, status]);

  useEffect(() => {
    onReadyChange?.(status === "ready");
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => undefined);
    }
    return () => onReadyChange?.(false);
  }, [onReadyChange, status]);

  useEffect(() => {
    const stream = streamRef.current;
    const track = stream?.getVideoTracks()[0];
    if (!track) return;
    const handleEnded = () => { setError("Kamera terputus. Aktifkan kembali untuk melanjutkan ujian."); setStatus("error"); };
    track.addEventListener("ended", handleEnded);
    return () => track.removeEventListener("ended", handleEnded);
  }, [status]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  return <div className={`camera-box ${compact ? "compact" : ""}`}>
    <div className="camera-preview-wrap"><video ref={videoRef} className="camera-preview" autoPlay muted playsInline aria-label="Pratinjau kamera depan" />{status === "ready" && <span className="camera-live-badge"><i /> LIVE</span>}</div>
    <div className="camera-copy"><strong><Camera size={16} /> Kamera {status === "ready" ? "aktif" : "wajib diaktifkan"}</strong>{status === "ready" ? <p>Kamera depan aktif selama ujian. Video tidak direkam atau dikirim ke server.</p> : <p>Izinkan kamera depan untuk memastikan ujian dikerjakan secara mandiri.</p>}{error && <div className="camera-error"><ShieldAlert size={15} />{error}</div>}</div>
    {status !== "ready" && <button type="button" className="secondary-button camera-button" onClick={requestCamera} disabled={status === "requesting"}><RefreshCw size={16} />{status === "requesting" ? "Meminta izin kamera..." : "Izinkan kamera"}</button>}{status === "ready" && <div className="camera-ready"><CheckCircle2 size={16} /> Siap untuk ujian</div>}
  </div>;
}

export function useCameraPermission() {
  const [ready, setReady] = useState(false);
  return { ready, setReady };
}
