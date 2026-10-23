import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, FileDown, Printer } from "lucide-react";
import { agreementRef } from "@/lib/agreement-verify.functions";
import { btn, btnAccent, fmtDate } from "./parts";

// Canvas needs concrete colours; these mirror the --primary / --accent tokens.
const NAVY = "#17233f";
const TEAL = "#1d9a8c";

interface Props { id: string; title: string; status: string; date: string }

/** Draws a branded payment-style card (header, framed QR, reference) for export. */
async function drawCard(url: string, p: Props) {
  const W = 720, H = 1000;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, W, H);
  g.fillStyle = NAVY; g.fillRect(0, 0, W, 150);
  g.fillStyle = "#ffffff"; g.font = "700 40px Sora, sans-serif"; g.fillText("Fayda", 48, 88);
  const fw = g.measureText("Fayda").width; g.fillStyle = TEAL; g.fillText("Rent", 48 + fw, 88);
  g.fillStyle = "#c9d2e3"; g.font = "500 22px Manrope, sans-serif"; g.fillText("Rental agreement · Scan to verify", 48, 122);
  // QR frame with corner accents
  const qs = 440, qx = (W - qs) / 2, qy = 210;
  const qr = await QRCode.toDataURL(url, { margin: 1, width: qs, errorCorrectionLevel: "H", color: { dark: NAVY, light: "#ffffff" } });
  const img = new Image(); img.src = qr; await img.decode();
  g.drawImage(img, qx, qy, qs, qs);
  g.strokeStyle = TEAL; g.lineWidth = 8; const o = 22, L = 56;
  for (const [x, y, dx, dy] of [[qx - o, qy - o, 1, 1], [qx + qs + o, qy - o, -1, 1], [qx - o, qy + qs + o, 1, -1], [qx + qs + o, qy + qs + o, -1, -1]] as const) {
    g.beginPath(); g.moveTo(x, y + dy * L); g.lineTo(x, y); g.lineTo(x + dx * L, y); g.stroke();
  }
  g.textAlign = "center";
  g.fillStyle = NAVY; g.font = "700 40px Sora, sans-serif"; g.fillText(agreementRef(p.id), W / 2, 740);
  g.fillStyle = "#5b6782"; g.font = "500 24px Manrope, sans-serif";
  g.fillText(p.title.length > 44 ? p.title.slice(0, 43) + "…" : p.title, W / 2, 785);
  g.fillText(`Status: ${p.status.replace(/_/g, " ")} · ${fmtDate(p.date)}`, W / 2, 822);
  g.fillStyle = "#eef2f6"; g.fillRect(0, H - 110, W, 110);
  g.fillStyle = "#5b6782"; g.font = "500 20px Manrope, sans-serif";
  g.fillText("Scan with any phone camera to confirm this agreement", W / 2, H - 62);
  g.fillText("is genuine on FaydaRent.", W / 2, H - 34);
  return c.toDataURL("image/png");
}

function save(href: string, name: string) {
  const a = document.createElement("a"); a.href = href; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
}

export function AgreementQR(p: Props) {
  const [qr, setQr] = useState<string>();
  const [card, setCard] = useState<string>();
  const [url, setUrl] = useState("");
  const ref = agreementRef(p.id);

  useEffect(() => {
    const u = `${window.location.origin}/agreements/${p.id}`; setUrl(u);
    void QRCode.toDataURL(u, { margin: 1, width: 360, errorCorrectionLevel: "H", color: { dark: NAVY, light: "#ffffff" } }).then(setQr);
    void document.fonts.ready.then(() => drawCard(u, p)).then(setCard);
  }, [p.id, p.title, p.status, p.date]);

  const pdf = async () => {
    if (!card) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a5" });
    doc.addImage(card, "PNG", 16.8, 15, 114.4, 158.9);
    doc.save(`${ref}.pdf`);
  };
  const print = () => {
    if (!card) return;
    const w = window.open("", "_blank"); if (!w) return;
    w.document.write(`<title>${ref}</title><style>@page{margin:12mm}body{margin:0;display:flex;justify-content:center}img{width:110mm}</style><img src="${card}" onload="window.print()">`);
    w.document.close();
  };

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border">
      <div className="flex items-center justify-between gap-3 bg-primary px-4 py-2.5 text-primary-foreground">
        <p className="text-sm font-semibold">Verification QR</p>
        <span className="font-mono text-xs opacity-80">{ref}</span>
      </div>
      <div className="flex flex-col items-center gap-5 p-4 sm:flex-row sm:items-center">
        <div className="relative shrink-0 rounded-lg bg-card p-3 shadow-card">
          <span className="absolute left-0 top-0 h-5 w-5 rounded-tl-lg border-l-[3px] border-t-[3px] border-accent" />
          <span className="absolute right-0 top-0 h-5 w-5 rounded-tr-lg border-r-[3px] border-t-[3px] border-accent" />
          <span className="absolute bottom-0 left-0 h-5 w-5 rounded-bl-lg border-b-[3px] border-l-[3px] border-accent" />
          <span className="absolute bottom-0 right-0 h-5 w-5 rounded-br-lg border-b-[3px] border-r-[3px] border-accent" />
          {qr ? <img src={qr} alt={`QR code for agreement ${ref}`} className="h-36 w-36" /> : <div className="h-36 w-36 animate-pulse rounded bg-muted" />}
        </div>
        <div className="w-full min-w-0 flex-1 text-center sm:text-left">
          <p className="font-display text-lg font-bold tracking-tight">{ref}</p>
          <p className="mt-1 text-sm text-muted-foreground">Anyone can scan this to confirm the agreement is genuine and see its status. No personal details are shown.</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{url}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            <button className={btnAccent} disabled={!card} onClick={() => card && save(card, `${ref}.png`)}><Download className="h-3.5 w-3.5" />PNG</button>
            <button className={btn} disabled={!card} onClick={() => void pdf()}><FileDown className="h-3.5 w-3.5" />PDF</button>
            <button className={btn} disabled={!card} onClick={print}><Printer className="h-3.5 w-3.5" />Print</button>
          </div>
        </div>
      </div>
    </div>
  );
}
