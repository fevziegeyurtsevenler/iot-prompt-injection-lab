"use client";
import React, { useEffect, useState, useRef } from "react";
import CONTENT from "./academy-content.json";

/* ===========================================================================
   IoT Prompt Injection Lab — İnteraktif Güvenlik Akademisi
   Fevzi Ege Yurtsevenler & Deniz Tektek
   5 modül × 25 adım. İçerik academy-content.json'dan gelir; bu dosya
   yalnızca generic renderer'dır. Krem zemin, serif, keskin köşeler.
   =========================================================================== */

const API = "http://localhost:8000";

type DeviceState = {
  alarm_armed: boolean;
  front_door_locked: boolean;
  cameras_on: boolean;
  garage_open: boolean;
  thermostat_c: number;
};

type TraceEvent = {
  step: number;
  type: string;
  tool: string | null;
  result: string;
  explanation: string;
  sensitive: boolean;
};

type OptionT = {
  key: string;
  title: string;
  subtitle?: string;
  desc?: string;
  verdict: "correct" | "partial" | "wrong";
  explanation: string;
  tag?: string;
  tag_type?: string;
};

type StepT = {
  type: "concept" | "choice" | "input" | "lab" | "ctf";
  step_num?: number;
  label?: string;
  title?: string;
  content?: string;
  visual?: string;
  visual_data?: string;
  prompt?: string;
  options?: OptionT[];
  placeholder?: string;
  kind?: string;
  validation_keywords?: string[];
  hint?: string;
  success_feedback?: string;
  intro?: string;
  api_request?: { channel: string; payload_id: string; defense: string };
  payload_preview?: string;
  expected_outcome?: string;
  post_attack_question?: { prompt: string; options: OptionT[] };
  challenge?: string;
  correct_answer?: string;
  flag_format?: string;
  hint_after_3?: string;
  wrong_feedback?: string;
};

type ModuleT = {
  id: number;
  title: string;
  topic: string;
  level: string;
  minutes: string;
  desc: string;
  steps: StepT[];
};

type Ctx = { setGate: (ok: boolean) => void };

const MODULES = CONTENT as ModuleT[];

const G = {
  cream: "#faf9f6", white: "#ffffff", ink: "#1a1814", inkMid: "#2c2a25",
  inkLight: "#4a453e", muted: "#6b6357", faint: "#9a8f7a",
  border: "#e0dbd0", borderLight: "#edeae3",
  amber50: "#fdf0e8", amberBorder: "#d4b8a0", amberText: "#7a4515",
  red50: "#fdf5f5", redBorder: "#e8c5c5", redText: "#7a3535",
  green50: "#f2f8f0", greenBorder: "#b8d4aa", greenText: "#3a5f2a",
  blue50: "#eef3fb", blueBorder: "#b8ccea", blueText: "#2a4a7a",
  codeBg: "#1a1814", codeText: "#d4cfc5", codeRed: "#e09090",
  codeGreen: "#90c090", codeYellow: "#d4b070", codeBlue: "#90b0d0", codeDim: "#7a7268",
};
const serif = "'Playfair Display', Georgia, serif";
const body = "'Source Serif 4', Georgia, serif";
const mono = "'IBM Plex Mono', 'Courier New', monospace";

/* ----------------------------- Validation -------------------------------- */
function validateInput(val: string, keywords: string[], kind: string): string | null {
  const t = val.trim();
  if (t.length < 8) return "Lütfen daha uzun bir cevap yazın (en az birkaç kelime).";
  if (/^[0-9\s]+$/.test(t)) return "Lütfen metin yazın, sadece rakam değil.";
  if (t.split(/\s+/).filter(Boolean).length < 2) return "En az iki kelime yazın.";
  const compact = t.replace(/\s/g, "");
  if (/^(.)\1{3,}$/.test(compact)) return "Anlamlı bir cümle yazmaya çalışın.";
  if (kind === "explain" || kind === "analyze" || kind === "predict") {
    const low = t.toLocaleLowerCase("tr");
    if (keywords && keywords.length > 0 && !keywords.some((k) => low.includes(k.toLocaleLowerCase("tr")))) {
      return "Konuyla ilgili bir şeyler yazmaya çalışın.";
    }
  }
  return null;
}

/* --------------------------- Temel bileşenler ---------------------------- */
const TAG_COLORS: Record<string, { bg: string; b: string; t: string }> = {
  amber: { bg: G.amber50, b: G.amberBorder, t: G.amberText },
  green: { bg: G.green50, b: G.greenBorder, t: G.greenText },
  red: { bg: G.red50, b: G.redBorder, t: G.redText },
  blue: { bg: G.blue50, b: G.blueBorder, t: G.blueText },
};

function Tag({ children, type }: { children: React.ReactNode; type?: string }) {
  const c = TAG_COLORS[type || "blue"] || TAG_COLORS.blue;
  return (
    <span style={{ display: "inline-block" as const, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" as const, padding: "2px 8px", border: `0.5px solid ${c.b}`, background: c.bg, color: c.t, fontFamily: body }}>
      {children}
    </span>
  );
}

const FB_COLORS: Record<string, { bg: string; b: string; t: string }> = {
  correct: { bg: G.green50, b: G.greenBorder, t: G.greenText },
  wrong: { bg: G.red50, b: G.redBorder, t: G.redText },
  info: { bg: "#f5f2eb", b: "#d0c8b0", t: "#5a5040" },
  danger: { bg: G.amber50, b: G.amberBorder, t: G.amberText },
  partial: { bg: G.blue50, b: G.blueBorder, t: G.blueText },
};

function Feedback({ type, title, children }: { type: string; title?: string; children: React.ReactNode }) {
  const c = FB_COLORS[type] || FB_COLORS.info;
  return (
    <div style={{ background: c.bg, border: `0.5px solid ${c.b}`, color: c.t, padding: "1rem 1.25rem", marginTop: 12, fontFamily: body, fontSize: 13, lineHeight: 1.75, fontWeight: 300 }}>
      {title && <div style={{ fontFamily: serif, fontSize: 15, fontWeight: 400, marginBottom: 4 }}>{title}</div>}
      {children}
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: body, fontSize: 14, color: G.inkLight, lineHeight: 1.85, fontWeight: 300, marginBottom: 14, whiteSpace: "pre-wrap" as const }}>{children}</div>;
}

function CodeBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: G.codeBg, fontFamily: mono, fontSize: 12, padding: "1rem 1.25rem", lineHeight: 1.8, border: `0.5px solid #3a3530`, marginBottom: 12, color: G.codeText, whiteSpace: "pre-wrap" as const, overflowX: "auto" as const }}>
      {children}
    </div>
  );
}

function Btn({ children, onClick, disabled, kind }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; kind?: string }) {
  const ghost = kind === "ghost";
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        background: ghost ? "transparent" : disabled ? G.border : G.inkMid,
        color: ghost ? G.muted : disabled ? G.muted : G.cream,
        border: ghost ? `0.5px solid ${G.border}` : "none",
        padding: "0.65rem 1.5rem", fontFamily: body, fontSize: 12, letterSpacing: "0.12em",
        textTransform: "uppercase" as const, cursor: disabled ? "not-allowed" : "pointer", whiteSpace: "nowrap" as const,
      }}>
      {children}
    </button>
  );
}

/* ------------------------------- Visual'lar ------------------------------ */
function Visual({ kind }: { kind?: string }) {
  if (!kind) return null;
  if (kind === "agent_architecture_v1") {
    return <CodeBox>{`Kullanıcı sorusu
      │
      ▼
   ┌──────────┐
   │  AJAN    │  ◄── sistem talimatı (güvenilir)
   └────┬─────┘
        │ araç seçer
        ▼
   ┌──────────────────────────┐
   │ read_calendar()  ◄── güvenilmez veri
   │ disarm_alarm()   ◄── HASSAS aksiyon
   └──────────────────────────┘`}</CodeBox>;
  }
  if (kind === "core_logic_snippet") {
    return <CodeBox>{`# Ajanın fonksiyonel çekirdeği (basitleştirilmiş)
context  = system_prompt + user_msg + tool_output
action   = llm.decide(context)   # ← sınır yok!
run(action)                      # veri "talimat" olabilir`}</CodeBox>;
  }
  if (kind === "stego_basics") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        <div style={{ border: `0.5px solid ${G.border}`, background: G.white, padding: "0.9rem 1rem" }}>
          <div style={{ fontFamily: serif, fontSize: 15, color: G.ink, marginBottom: 4 }}>Kriptografi</div>
          <div style={{ fontFamily: body, fontSize: 13, color: G.muted, lineHeight: 1.7, fontWeight: 300 }}>Mesajı <B>okunamaz</B> yapar. Var olduğu bellidir.</div>
        </div>
        <div style={{ border: `0.5px solid ${G.amberBorder}`, background: G.amber50, padding: "0.9rem 1rem" }}>
          <div style={{ fontFamily: serif, fontSize: 15, color: G.amberText, marginBottom: 4 }}>Steganografi</div>
          <div style={{ fontFamily: body, fontSize: 13, color: G.amberText, lineHeight: 1.7, fontWeight: 300 }}>Mesajın <B>var olduğunu</B> gizler. Görünüşte masum.</div>
        </div>
      </div>
    );
  }
  if (kind === "lsb_color_diff") {
    return (
      <div style={{ display: "flex" as const, gap: 16, alignItems: "center" as const, marginBottom: 12, flexWrap: "wrap" as const }}>
        <div style={{ textAlign: "center" as const }}>
          <div style={{ width: 64, height: 64, background: "rgb(138,90,58)", border: `0.5px solid ${G.border}` }} />
          <div style={{ fontFamily: mono, fontSize: 12, marginTop: 6, color: G.ink }}>1011011<B>0</B></div>
        </div>
        <div style={{ fontFamily: serif, fontSize: 20, color: G.faint }}>→</div>
        <div style={{ textAlign: "center" as const }}>
          <div style={{ width: 64, height: 64, background: "rgb(138,90,59)", border: `0.5px solid ${G.border}` }} />
          <div style={{ fontFamily: mono, fontSize: 12, marginTop: 6, color: G.redText }}>1011011<B>1</B></div>
        </div>
        <div style={{ fontFamily: body, fontSize: 13, color: G.muted, maxWidth: 220, lineHeight: 1.6, fontWeight: 300 }}>Son bit değişti, renk gözle aynı. Gizli kanal buradadır.</div>
      </div>
    );
  }
  if (kind === "attack_surface_graph") {
    return <CodeBox>{`            ┌─────────┐
 takvim ───►│         │
 e-posta ──►│  AJAN   │──► HASSAS ARAÇLAR
 notlar ───►│         │     alarm/kapı/kamera
 kamera ───►│         │
            └─────────┘
 her ok = ayrı bir saldırı yüzeyi`}</CodeBox>;
  }
  if (kind === "homoglyph_illustration") {
    return (
      <div style={{ display: "flex" as const, gap: 28, justifyContent: "center" as const, margin: "16px 0", flexWrap: "wrap" as const }}>
        <div style={{ textAlign: "center" as const }}>
          <div style={{ fontFamily: serif, fontSize: 40, color: G.greenText }}>alarm</div>
          <div style={{ fontFamily: mono, fontSize: 11, color: G.muted, marginTop: 4 }}>Latin · 61 6C 61 72 6D</div>
        </div>
        <div style={{ textAlign: "center" as const }}>
          <div style={{ fontFamily: serif, fontSize: 40, color: G.redText }}>аlаrm</div>
          <div style={{ fontFamily: mono, fontSize: 11, color: G.muted, marginTop: 4 }}>Kiril · D0B0 6C D0B0 72 6D</div>
        </div>
      </div>
    );
  }
  if (kind === "defense_in_depth_layers") {
    return <CodeBox>{`┌────────────────────────────────────┐
│ 1. input_scanner   (tespit)        │ ← kırılgan
│ ┌────────────────────────────────┐ │
│ │ 2. HITL  (insan onayı)         │ │ ← yorgunluk
│ │ ┌────────────────────────────┐ │ │
│ │ │ 3. privilege separation    │ │ │ ← en güçlü
│ │ │    (mimari kısıtlama)       │ │ │
│ │ └────────────────────────────┘ │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘`}</CodeBox>;
  }
  return null;
}

function B({ children }: { children: React.ReactNode }) {
  return <strong style={{ fontWeight: 500, color: G.inkMid }}>{children}</strong>;
}

/* ----------------------------- Cihaz / Trace ----------------------------- */
const DEVICE_DEFS = [
  { key: "alarm_armed", name: "Güvenlik Alarmı", safe: "DEVREDE", danger: "DEVRE DIŞI", invert: false },
  { key: "front_door_locked", name: "Ön Kapı Kilidi", safe: "KİLİTLİ", danger: "AÇIK", invert: false },
  { key: "cameras_on", name: "Kamera Sistemi", safe: "AKTİF", danger: "KAPALI", invert: false },
  { key: "garage_open", name: "Garaj Kapısı", safe: "KAPALI", danger: "AÇIK", invert: true },
];

function DeviceGrid({ s }: { s: DeviceState | null }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(135px,1fr))", gap: 8 }}>
      {DEVICE_DEFS.map((d) => {
        const raw = s ? (s as unknown as Record<string, boolean>)[d.key] : !d.invert;
        const breached = d.invert ? raw === true : raw === false;
        return (
          <div key={d.key} style={{ border: `0.5px solid ${breached ? G.redBorder : G.border}`, background: breached ? G.red50 : G.cream, padding: "0.9rem 1rem", transition: "all 0.5s" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: G.faint, marginBottom: 4, fontFamily: body, fontWeight: 300 }}>{d.name}</div>
            <div style={{ fontFamily: serif, fontSize: 16, color: breached ? G.redText : G.ink, transition: "color 0.5s" }}>{breached ? d.danger : d.safe}</div>
            {breached && <div style={{ fontSize: 10, color: "#c0392b", marginTop: 3, fontFamily: body }}>Güvenlik ihlali</div>}
          </div>
        );
      })}
    </div>
  );
}

const EV_COLOR: Record<string, string> = { read: G.codeYellow, decode: G.codeBlue, reasoning: G.codeBlue, attack: G.codeRed, blocked: G.codeGreen, defense: G.codeGreen, action: G.codeText };
const EV_TAG: Record<string, string> = { read: "OKUMA", decode: "DEŞİFRE", reasoning: "AKIL YÜRÜTME", attack: "SALDIRI", blocked: "ENGELLENDİ", defense: "SAVUNMA", action: "AKSİYON" };

function TraceConsole({ events, n }: { events: TraceEvent[]; n: number }) {
  return (
    <div style={{ background: G.codeBg, fontFamily: mono, fontSize: 12, padding: "1rem 1.25rem", lineHeight: 1.7, border: `0.5px solid #3a3530`, minHeight: 70 }}>
      <div style={{ color: G.codeDim, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" as const, marginBottom: 10 }}>▸ Ajanın İç Sesi — Trace Log</div>
      {events.length === 0 && <div style={{ color: G.codeDim }}>Çalıştırılıyor…</div>}
      {events.slice(0, n).map((e, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <span style={{ color: G.codeDim }}>[{String(e.step).padStart(2, "0")}] </span>
          <span style={{ color: EV_COLOR[e.type] || G.codeText }}>{EV_TAG[e.type] || e.type}</span>
          {e.tool && <span style={{ color: G.codeDim }}> · {e.tool}</span>}
          {e.type === "attack" && <span style={{ color: G.codeRed }}> ✗</span>}
          {e.result && <div style={{ color: G.codeText, marginTop: 1, opacity: 0.85 }}>{String(e.result).slice(0, 150)}</div>}
          {e.explanation && <div style={{ color: G.codeDim, marginTop: 1, fontStyle: "italic" as const }}>{e.explanation}</div>}
        </div>
      ))}
    </div>
  );
}

function ApiOffline() {
  return (
    <Feedback type="danger" title="API bağlantısı kurulamadı">
      Proje kökünde şunu çalıştırın: <span style={{ fontFamily: mono }}>uvicorn Fastapi:app --reload</span>
    </Feedback>
  );
}

/* ----------------------------- ChoiceBlock ------------------------------- */
function ChoiceBlock({ prompt, options, onResolved }: { prompt?: string; options: OptionT[]; onResolved: (correct: boolean) => void }) {
  const [sel, setSel] = useState<string | null>(null);
  const [val, setVal] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const keys = options.map((o) => o.key);
  const submit = (k?: string) => {
    const t = (k ?? val).trim();
    if (!t) { setErr(`Bir seçenek girin: ${keys.join(", ")}`); return; }
    if (!keys.includes(t)) { setErr(`Lütfen yalnızca ${keys.join(", ")} yazın.`); return; }
    setErr(null); setSel(t);
    const opt = options.find((o) => o.key === t)!;
    onResolved(opt.verdict === "correct");
  };
  const chosen = options.find((o) => o.key === sel);
  return (
    <div>
      {prompt && <P>{prompt}</P>}
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 14 }}>
        {options.map((o) => (
          <div key={o.key} onClick={() => { if (!sel) setVal(o.key); }}
            style={{ cursor: sel ? "default" : "pointer", background: G.white, border: `0.5px solid ${(sel || val) === o.key ? G.inkMid : G.border}`, padding: "0.9rem 1.1rem", display: "flex", gap: "1rem", alignItems: "flex-start" as const }}>
            <div style={{ fontFamily: serif, fontSize: 22, color: G.border, flexShrink: 0, lineHeight: 1, marginTop: 2 }}>{o.key}</div>
            <div>
              <div style={{ fontFamily: serif, fontSize: 15, color: G.ink, marginBottom: 3, display: "flex", alignItems: "center" as const, gap: 8, flexWrap: "wrap" as const }}>
                {o.title}
                {o.subtitle && <span style={{ fontFamily: mono, fontSize: 10, color: G.muted }}>{o.subtitle}</span>}
                {o.tag && <Tag type={o.tag_type}>{o.tag}</Tag>}
              </div>
              {o.desc && <div style={{ fontFamily: body, fontSize: 13, color: G.muted, lineHeight: 1.7, fontWeight: 300 }}>{o.desc}</div>}
            </div>
          </div>
        ))}
      </div>
      {!sel && (
        <div style={{ display: "flex", gap: 8 }}>
          <input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder={keys.join(" / ")} style={{ width: 130, border: `0.5px solid ${G.border}`, background: G.cream, padding: "0.6rem 0.9rem", fontFamily: mono, fontSize: 14, color: G.ink, outline: "none" }} />
          <Btn onClick={() => submit()}>Seç</Btn>
        </div>
      )}
      {err && <Feedback type="danger">{err}</Feedback>}
      {chosen && (
        <Feedback type={chosen.verdict === "correct" ? "correct" : chosen.verdict === "partial" ? "partial" : "wrong"}
          title={chosen.verdict === "correct" ? "Doğru." : chosen.verdict === "partial" ? "Kısmen doğru." : "Bu yetersiz."}>
          {chosen.explanation}
        </Feedback>
      )}
    </div>
  );
}

/* ------------------------------ Step bileşenleri ------------------------- */
function ConceptStep({ step, ctx }: { step: StepT; ctx: Ctx }) {
  useEffect(() => { ctx.setGate(true); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div>
      {step.content && <P>{step.content}</P>}
      <Visual kind={step.visual_data} />
    </div>
  );
}

function ChoiceStep({ step, ctx }: { step: StepT; ctx: Ctx }) {
  return <ChoiceBlock prompt={step.prompt} options={step.options || []} onResolved={() => ctx.setGate(true)} />;
}

function InputStep({ step, ctx }: { step: StepT; ctx: Ctx }) {
  const [val, setVal] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [tries, setTries] = useState(0);
  const [done, setDone] = useState(false);
  const submit = () => {
    if (done) return;
    const e = validateInput(val, step.validation_keywords || [], step.kind || "");
    if (e) { setErr(e); setTries((t) => t + 1); return; }
    setErr(null); setDone(true); ctx.setGate(true);
  };
  return (
    <div>
      {step.prompt && <P>{step.prompt}</P>}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !done) submit(); }}
          placeholder={step.placeholder || ""} disabled={done}
          style={{ flex: 1, border: `0.5px solid ${G.border}`, background: G.cream, padding: "0.6rem 0.9rem", fontFamily: body, fontSize: 14, color: G.ink, outline: "none", fontStyle: "italic" as const, opacity: done ? 0.6 : 1 }} />
        <Btn onClick={submit} disabled={done}>Gönder</Btn>
      </div>
      {err && <Feedback type="danger">{err}</Feedback>}
      {tries >= 3 && !done && step.hint && <Feedback type="partial" title="İpucu">{step.hint}</Feedback>}
      {done && <Feedback type="correct" title="Kaydedildi.">{step.success_feedback || "Güzel düşündünüz, devam edelim."}</Feedback>}
    </div>
  );
}

function LabStep({ step, ctx }: { step: StepT; ctx: Ctx }) {
  const [events, setEvents] = useState<TraceEvent[]>([]);
  const [n, setN] = useState(0);
  const [status, setStatus] = useState<DeviceState | null>(null);
  const [offline, setOffline] = useState(false);
  const [phase, setPhase] = useState<"run" | "post">("run");
  const ran = useRef(false);
  const hasPost = !!step.post_attack_question;

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      try {
        await fetch(`${API}/api/reset`, { method: "POST" });
        const r = await fetch(`${API}/api/attack`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(step.api_request),
        });
        const d = await r.json();
        const evs: TraceEvent[] = d.agent_trace || [];
        setEvents(evs);
        for (let i = 0; i <= evs.length; i++) {
          await new Promise<void>((res) => setTimeout(res, 600));
          setN(i);
          try { const sr = await fetch(`${API}/api/status`); setStatus(await sr.json()); } catch { /* yoksay */ }
        }
        if (hasPost) setPhase("post"); else ctx.setGate(true);
      } catch { setOffline(true); ctx.setGate(true); }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (offline) return <ApiOffline />;
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {step.intro && <P>{step.intro}</P>}
      {step.payload_preview && <CodeBox>{step.payload_preview}</CodeBox>}
      <DeviceGrid s={status} />
      <TraceConsole events={events} n={n} />
      {step.expected_outcome && n >= events.length && events.length > 0 && (
        <Feedback type="danger" title="Sonuç">{step.expected_outcome}</Feedback>
      )}
      {phase === "post" && step.post_attack_question && (
        <ChoiceBlock prompt={step.post_attack_question.prompt} options={step.post_attack_question.options} onResolved={() => ctx.setGate(true)} />
      )}
    </div>
  );
}

function BenchmarkStep({ ctx }: { ctx: Ctx }) {
  const [data, setData] = useState<{ asr: Record<string, number>; category_bypass: Record<string, { rate: number; bypass: number; n: number }>; n: number } | null>(null);
  const [offline, setOffline] = useState(false);
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      try { const r = await fetch(`${API}/api/benchmark`); setData(await r.json()); ctx.setGate(true); }
      catch { setOffline(true); ctx.setGate(true); }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (offline) return <ApiOffline />;
  if (!data) return <P>Benchmark çalıştırılıyor… (30 yük × 5 savunma)</P>;
  const cats = Object.entries(data.category_bypass || {});
  const asr = data.asr || {};
  const tone = (v: number) => (v >= 67 ? G.redText : v > 0 ? G.amberText : G.greenText);
  return (
    <div>
      <P>Tüm yük setinin saldırı başarı oranı (ASR), savunmaya göre — n={data.n}:</P>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6, marginBottom: 14 }}>
        {["none", "scanner", "hitl", "privsep", "all"].map((k) => (
          <div key={k} style={{ textAlign: "center" as const, background: "#f5f2eb", border: `0.5px solid ${G.border}`, padding: "0.7rem 0.4rem" }}>
            <div style={{ fontFamily: serif, fontSize: 20, color: tone(asr[k] ?? 0) }}>%{asr[k] ?? "-"}</div>
            <div style={{ fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: G.faint, fontFamily: body }}>{k}</div>
          </div>
        ))}
      </div>
      <P>Kategori bazında <B>scanner bypass</B> oranı:</P>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
        {cats.map(([c, v]) => (
          <div key={c} style={{ display: "flex", justifyContent: "space-between" as const, background: G.white, border: `0.5px solid ${G.border}`, padding: "0.5rem 0.9rem", fontFamily: mono, fontSize: 12 }}>
            <span style={{ color: G.ink }}>{c}</span>
            <span style={{ color: tone(v.rate) }}>%{v.rate} ({v.bypass}/{v.n})</span>
          </div>
        ))}
      </div>
      <Feedback type="danger" title="Tez">Scanner direkt saldırıyı yakalar ama homoglyph/paraphrase/split'i %100 sızdırır. Mimari kontroller (HITL, privsep) hepsini %0'a indirir.</Feedback>
    </div>
  );
}

function CTFStep({ step, ctx }: { step: StepT; ctx: Ctx }) {
  const [val, setVal] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [tries, setTries] = useState(0);
  const [solved, setSolved] = useState(false);
  const submit = () => {
    if (solved) return;
    const guess = val.trim().toLocaleLowerCase("tr");
    const ans = (step.correct_answer || "").trim().toLocaleLowerCase("tr");
    if (!guess) { setErr("Bir cevap girin."); return; }
    if (guess === ans) { setErr(null); setSolved(true); ctx.setGate(true); }
    else { setErr(step.wrong_feedback || "Yanlış. Tekrar deneyin."); setTries((t) => t + 1); }
  };
  return (
    <div>
      {step.challenge && <P>{step.challenge}</P>}
      {step.flag_format && <div style={{ fontFamily: mono, fontSize: 12, color: G.muted, marginBottom: 10 }}>Format: {step.flag_format}</div>}
      {!solved && (
        <div style={{ display: "flex", gap: 8 }}>
          <input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder="Cevabınız…" style={{ flex: 1, border: `0.5px solid ${G.border}`, background: G.cream, padding: "0.6rem 0.9rem", fontFamily: mono, fontSize: 14, color: G.ink, outline: "none" }} />
          <Btn onClick={submit}>Doğrula</Btn>
        </div>
      )}
      {err && <Feedback type="wrong">{err}</Feedback>}
      {tries >= 3 && !solved && step.hint_after_3 && <Feedback type="partial" title="İpucu">{step.hint_after_3}</Feedback>}
      {solved && (
        <Feedback type="correct" title="✓ Bayrak doğru!">
          {step.success_feedback || "Tebrikler, doğru cevap."}
        </Feedback>
      )}
    </div>
  );
}

function StepRenderer({ step, ctx }: { step: StepT; ctx: Ctx }) {
  if (step.type === "concept") return <ConceptStep step={step} ctx={ctx} />;
  if (step.type === "choice") return <ChoiceStep step={step} ctx={ctx} />;
  if (step.type === "input") return <InputStep step={step} ctx={ctx} />;
  if (step.type === "lab") {
    if (step.api_request && step.api_request.payload_id === "benchmark-all") return <BenchmarkStep ctx={ctx} />;
    return <LabStep step={step} ctx={ctx} />;
  }
  if (step.type === "ctf") return <CTFStep step={step} ctx={ctx} />;
  return null;
}

/* ------------------------------- License --------------------------------- */
function License() {
  return (
    <div style={{ borderTop: `0.5px solid ${G.borderLight}`, marginTop: "2.5rem", paddingTop: "1rem", fontSize: 11, color: "#b0a690", lineHeight: 1.8, fontFamily: body, fontStyle: "italic" as const, fontWeight: 300, textAlign: "center" as const }}>
      © 2026 Deniz Tektek &amp; Fevzi Ege Yurtsevenler. İzinsiz kopyalanması yasaktır.
    </div>
  );
}

/* ----------------------------- ModuleRunner ------------------------------ */
function ModuleRunner({ mod, onExit, onNext }: { mod: ModuleT; onExit: () => void; onNext: () => void }) {
  const [i, setI] = useState(0);
  const [gate, setGate] = useState(false);
  const steps = mod.steps;
  const total = steps.length;
  const step = steps[i];
  const last = i === total - 1;

  useEffect(() => { fetch(`${API}/api/reset`, { method: "POST" }).catch(() => {}); }, []);

  const ctx: Ctx = { setGate };
  const goNext = () => { if (last) onNext(); else { setI((x) => x + 1); setGate(false); } };
  const goBack = () => { if (i > 0) { setI((x) => x - 1); setGate(true); } };

  return (
    <div style={{ minHeight: "100vh", background: G.cream, fontFamily: body, padding: "2.5rem 1.5rem", maxWidth: 800, margin: "0 auto" }}>
      <button onClick={onExit} style={{ background: "none", border: "none", color: G.muted, fontFamily: body, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase" as const, cursor: "pointer", marginBottom: 18 }}>← Modüller</button>

      <div style={{ borderBottom: `1.5px solid ${G.border}`, paddingBottom: "1.25rem", marginBottom: "1.25rem" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.18em", color: G.faint, textTransform: "uppercase" as const, marginBottom: 6, fontFamily: body, fontWeight: 300 }}>
          Modül {mod.id} · {mod.topic}
        </div>
        <div style={{ fontFamily: serif, fontSize: 26, color: G.ink, lineHeight: 1.2 }}>{mod.title}</div>
      </div>

      {/* Progress: 25 adım, yatay kaydırılabilir */}
      <div style={{ display: "flex", gap: 3, marginBottom: "1.5rem", overflowX: "auto" as const, paddingBottom: 4 }}>
        {steps.map((s, k) => (
          <div key={k} title={`${k + 1}. ${s.label || s.type}`}
            style={{ flex: "1 0 18px", minWidth: 18, height: 6, background: k < i ? G.muted : k === i ? G.ink : G.borderLight, transition: "all 0.3s" }} />
        ))}
      </div>

      <div style={{ background: G.white, border: `0.5px solid ${G.border}`, padding: "1.75rem", marginBottom: "1rem" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: G.faint, marginBottom: "0.4rem", fontFamily: body, fontWeight: 300 }}>
          Adım {i + 1} / {total} — {step.label || step.type}
        </div>
        {step.title && <div style={{ fontFamily: serif, fontSize: 20, color: G.ink, marginBottom: "1rem", lineHeight: 1.3 }}>{step.title}</div>}
        <StepRenderer key={`m${mod.id}-s${i}`} step={step} ctx={ctx} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" as const, alignItems: "center" as const, paddingTop: "0.75rem", borderTop: `0.5px solid ${G.borderLight}` }}>
        <Btn kind="ghost" onClick={goBack} disabled={i === 0}>← Geri</Btn>
        <Btn onClick={goNext} disabled={!gate}>{last ? "Sonraki Modül →" : "Devam →"}</Btn>
      </div>

      <License />
    </div>
  );
}

/* ------------------------------- Academy --------------------------------- */
export default function Academy() {
  const [active, setActive] = useState<number | null>(null);

  if (active) {
    const idx = MODULES.findIndex((m) => m.id === active);
    const mod = MODULES[idx];
    return (
      <ModuleRunner mod={mod} onExit={() => setActive(null)}
        onNext={() => setActive(idx + 1 < MODULES.length ? MODULES[idx + 1].id : null)} />
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: G.cream, fontFamily: body, padding: "3rem 1.5rem" }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <div style={{ borderBottom: `1.5px solid ${G.border}`, paddingBottom: "1.5rem", marginBottom: "2.5rem" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", color: G.faint, textTransform: "uppercase" as const, marginBottom: 8, fontFamily: body, fontWeight: 300 }}>
            İnteraktif Güvenlik Akademisi · OWASP LLM01
          </div>
          <div style={{ fontFamily: serif, fontSize: 38, color: G.ink, lineHeight: 1.15, marginBottom: 12 }}>
            IoT &amp; LLM Güvenliği: <em style={{ color: G.muted }}>Prompt Injection</em>
          </div>
          <div style={{ fontFamily: body, fontSize: 15, color: G.muted, lineHeight: 1.7, fontWeight: 300, maxWidth: 640 }}>
            Yapay zeka ajanlarına yönelik prompt injection saldırılarını akıllı ev bağlamında, adım adım ve elinizi kirleterek öğrenin. Beş modül, her biri 25 adım. Bir modül seçin.
          </div>
          <div style={{ fontSize: 11, color: "#b0a690", fontFamily: body, marginTop: 10 }}>Deniz Tektek &amp; Fevzi Ege Yurtsevenler · 2026</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 16 }}>
          {MODULES.map((m) => (
            <div key={m.id} style={{ background: G.white, border: `0.5px solid ${G.border}`, padding: 22, display: "flex", flexDirection: "column" as const }}>
              <div style={{ display: "flex", justifyContent: "space-between" as const, alignItems: "baseline" as const }}>
                <span style={{ fontFamily: serif, fontSize: 26, color: G.border }}>0{m.id}</span>
                <span style={{ fontFamily: body, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: G.faint }}>{m.level} · {m.minutes}</span>
              </div>
              <div style={{ fontFamily: serif, fontSize: 20, color: G.ink, margin: "8px 0 4px", lineHeight: 1.25 }}>{m.title}</div>
              <div style={{ marginBottom: 10 }}><Tag type="amber">{m.topic}</Tag></div>
              <div style={{ fontFamily: body, fontSize: 13, color: G.muted, lineHeight: 1.65, fontWeight: 300, flex: 1 }}>{m.desc}</div>
              <div style={{ fontSize: 11, color: G.faint, fontFamily: mono, margin: "12px 0" }}>{m.steps.length} adım</div>
              <Btn onClick={() => setActive(m.id)}>Modülü Başlat →</Btn>
            </div>
          ))}
        </div>

        <License />
      </div>
    </div>
  );
}
