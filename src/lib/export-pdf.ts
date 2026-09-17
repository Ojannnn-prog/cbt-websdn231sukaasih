export async function exportResultsPdf(elementId: string, filename: string, sortLabel: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  const element = document.getElementById(elementId);
  if (!element) return;
  const canvas = await html2canvas(element, { scale: 2, backgroundColor: "#ffffff" });
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  pdf.setFontSize(18); pdf.text("NextCBT — Laporan Hasil Ujian", 14, 15); pdf.setFontSize(9); pdf.text(`Urutan: ${sortLabel} · Dicetak: ${new Date().toLocaleString("id-ID")}`, 14, 22);
  const image = canvas.toDataURL("image/png"); const width = 268; const height = (canvas.height * width) / canvas.width; pdf.addImage(image, "PNG", 14, 28, width, Math.min(height, 160)); pdf.save(filename);
}
