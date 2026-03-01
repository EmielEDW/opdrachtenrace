import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDO3oTP9DG0ibV_ic9yYpTNKyXsL0Dcq5c",
  authDomain: "scoreboardchiro.firebaseapp.com",
  databaseURL: "https://scoreboardchiro-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "scoreboardchiro",
  storageBucket: "scoreboardchiro.firebasestorage.app",
  messagingSenderId: "477780412863",
  appId: "1:477780412863:web:f421d803f13e2696cb790a",
  measurementId: "G-VZL0PT68GY",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const LEIDING_PASSWORD = "chiro2025";
const COLORS = ["#FF5733", "#3498DB", "#2ECC71", "#F39C12", "#9B59B6", "#E91E63", "#00BCD4"];

interface Team { id: number; name: string; color: string; score: number; }
interface ActiveEntry { id: number; teamId: number; opdracht: string; points: number; assignedAt: string; }
interface LogEntry { teamId: number; teamName: string; teamColor: string; opdracht: string; points: number; time: string; }
interface OpdrachtenList { 3: string[]; 5: string[]; 8: string[]; }

const DEFAULT_OPDRACHTEN: OpdrachtenList = {
  3: [
    "📸 Foto met wildvreemde (duim omhoog)",
    "📸 Straatnaambord met een dier erin",
    "📸 10 sec standbeeld op drukke plek",
    "📸 Foto voor het hoogste gebouw in de buurt",
    "📸 Voorbijganger maakt gek gezicht op camera",
    "📸 Selfie met iets volledig groen",
    "📸 Foto van iets dat op een gezicht lijkt",
    "🎒 Breng een blaadje of bloem mee van buiten",
    "🎒 Breng een steen mee die groter is dan je vuist",
    "🎒 Breng iets mee dat begint met de letter B",
    "🎒 Breng iets mee in de kleur geel",
    "✍️ Haal de handtekening van één leidingslid",
    "✍️ Vraag een voorbijganger om zijn naam op te schrijven",
    "✍️ Verzamel 2 handtekeningen van mensen die je niet kent",
  ],
  5: [
    "📸 Wildvreemde zingt liedje op camera",
    "📸 Interview: 'Wat is uw levensadvies?'",
    "📸 Foto alsof jullie een gebouw optillen",
    "📸 Iemand met exact hetzelfde kledingstuk als jij",
    "📸 60 sec nep-ruzie in het Frans of Engels",
    "📸 Foto waarbij jullie eruitzien als een reclame",
    "🎒 Breng iets mee dat je gratis gekregen hebt van iemand",
    "🎒 Breng iets mee dat ouder is dan 10 jaar (vraag het aan iemand)",
    "🎒 Breng een voorwerp mee van minstens 3 materialen",
    "✍️ Haal de handtekeningen van ALLE leidingsleden",
    "✍️ Verzamel 5 handtekeningen van wildvreemden op één blad",
    "✍️ Laat iemand een kleine tekening maken op dit papier",
    "✍️ Laat een voorbijganger een geheime boodschap opschrijven",
  ],
  8: [
    "📸 Winkelmedewerker poseert achter de toonbank",
    "📸 Flashmob van minstens 3 wildvreemden",
    "📸 Voorbijganger gelooft een volledig verzonnen verhaal",
    "📸 Kunstwerk van gevonden materialen + naam op camera",
    "📸 Overtuig iemand om een dansje te doen op straat",
    "🎒 Breng iets mee dat je geruild hebt met een wildvreemde",
    "🎒 Breng een item mee met een handgeschreven briefje van de gever",
    "✍️ Handtekeningen van 3 mensen met een totaal verschillende job",
    "✍️ Laat iemand een mini-gedicht schrijven (minstens 2 zinnen)",
    "✍️ Haal een handtekening van iemand ouder dan 60 jaar",
  ],
};

const defaultTeams: Team[] = [
  { id: 1, name: "Team Rood", color: COLORS[0], score: 0 },
  { id: 2, name: "Team Blauw", color: COLORS[1], score: 0 },
];

function useFirebase<T>(path: string, def: T): [T, (v: T) => void] {
  const [val, setVal] = useState<T>(def);
  useEffect(() => {
    const r = ref(db, path);
    const unsub = onValue(r, snap => {
      if (snap.exists()) setVal(snap.val());
    });
    return () => unsub();
  }, [path]);
  const save = (v: T) => { set(ref(db, path), v); };
  return [val, save];
}

// ── UI helpers ───────────────────────────────────────────────────────────────
interface BtnProps { children: ReactNode; onClick?: () => void; color?: string; bg?: string; disabled?: boolean; full?: boolean; small?: boolean; }
const Btn = ({ children, onClick, color = "#fff", bg = "#222", disabled = false, full = false, small = false }: BtnProps) => (
  <button onClick={onClick} disabled={disabled} style={{
    fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 2,
    fontSize: small ? 13 : 16, padding: small ? "7px 14px" : "12px 22px",
    borderRadius: 8, border: `2px solid ${disabled ? "#333" : color}`,
    background: disabled ? "#1a1a1a" : bg, color: disabled ? "#444" : color,
    cursor: disabled ? "not-allowed" : "pointer", width: full ? "100%" : "auto",
    transition: "all .15s",
  }}>{children}</button>
);
const Label = ({ children }: { children: ReactNode }) => (
  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#555", letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" }}>{children}</div>
);
interface CardProps { children: ReactNode; style?: React.CSSProperties; }
const Card = ({ children, style }: CardProps) => (
  <div style={{ background: "#161616", border: "1px solid #222", borderRadius: 12, padding: "18px 20px", ...style }}>{children}</div>
);

// ════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [teams, setTeams] = useFirebase<Team[]>("teams", defaultTeams);
  const [active, setActive] = useFirebase<ActiveEntry[]>("active", []);
  const [log, setLog] = useFirebase<LogEntry[]>("log", []);
  const [opdrachten, setOpdrachten] = useFirebase<OpdrachtenList>("opdrachten", DEFAULT_OPDRACHTEN);

  const [view, setView] = useState<"scorebord" | "leiding">("scorebord");
  const [leidingUnlocked, setLeidingUnlocked] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [leidingTab, setLeidingTab] = useState<"toewijzen" | "teams" | "opdrachten">("toewijzen");

  const [aTeam, setATeam] = useState<Team | null>(null);
  const [aPts, setAPts] = useState<number | null>(null);
  const [aOp, setAOp] = useState<string | null>(null);

  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(COLORS[0]);

  // Nieuwe opdracht toevoegen
  const [newOpTekst, setNewOpTekst] = useState("");
  const [newOpPts, setNewOpPts] = useState<3 | 5 | 8>(3);

  const sorted = [...teams].sort((a, b) => b.score - a.score);
  const maxScore = Math.max(...teams.map(t => t.score), 1);

  const assignOpdracht = () => {
    if (!aTeam || !aPts || !aOp) return;
    const entry: ActiveEntry = { id: Date.now(), teamId: aTeam.id, opdracht: aOp, points: aPts, assignedAt: new Date().toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" }) };
    setActive([...active, entry]);
    setATeam(null); setAPts(null); setAOp(null);
  };

  const completeOpdracht = (entry: ActiveEntry) => {
    const team = teams.find(t => t.id === entry.teamId);
    setTeams(teams.map(t => t.id === entry.teamId ? { ...t, score: t.score + entry.points } : t));
    setActive(active.filter(a => a.id !== entry.id));
    setLog([{ teamId: entry.teamId, teamName: team?.name ?? "", teamColor: team?.color ?? "#fff", opdracht: entry.opdracht, points: entry.points, time: new Date().toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" }) }, ...log]);
  };

  const cancelOpdracht = (entry: ActiveEntry) => setActive(active.filter(a => a.id !== entry.id));

  const addTeam = () => {
    if (!editName.trim()) return;
    setTeams([...teams, { id: Date.now(), name: editName.trim(), color: editColor, score: 0 }]);
    setEditName(""); setEditColor(COLORS[teams.length % COLORS.length]);
  };

  const removeTeam = (id: number) => {
    setTeams(teams.filter(t => t.id !== id));
    setActive(active.filter(a => a.teamId !== id));
  };

  const resetAll = () => { setTeams(teams.map(t => ({ ...t, score: 0 }))); setActive([]); setLog([]); };

  const addOpdracht = () => {
    if (!newOpTekst.trim()) return;
    const updated = { ...opdrachten, [newOpPts]: [...opdrachten[newOpPts], newOpTekst.trim()] };
    setOpdrachten(updated);
    setNewOpTekst("");
  };

  const removeOpdracht = (pts: 3 | 5 | 8, index: number) => {
    const updated = { ...opdrachten, [pts]: opdrachten[pts].filter((_: string, i: number) => i !== index) };
    setOpdrachten(updated);
  };

  const tryUnlock = () => {
    if (pwInput === LEIDING_PASSWORD) { setLeidingUnlocked(true); setPwError(false); }
    else { setPwError(true); setPwInput(""); }
  };

  const ptsBorderColor = (pts: number) => pts === 3 ? "#2ECC71" : pts === 5 ? "#F39C12" : "#E74C3C";

  return (
    <div style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif", background: "#0d0d0d", minHeight: "100vh", color: "#fff" }}>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet" />

      <div style={{ background: "#111", borderBottom: "2px solid #1e1e1e", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 24, letterSpacing: 4 }}>🏆 OPDRACHTENRACE</div>
        <div style={{ display: "flex", gap: 8 }}>
          {(["scorebord", "leiding"] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 2, fontSize: 13, padding: "8px 16px", borderRadius: 6, border: "none", cursor: "pointer", background: view === v ? "#fff" : "#1e1e1e", color: view === v ? "#0d0d0d" : "#666" }}>
              {v === "scorebord" ? "📊 Scorebord" : "🔒 Leiding"}
            </button>
          ))}
        </div>
      </div>

      {/* ── SCOREBORD ── */}
      {view === "scorebord" && (
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 16px" }}>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#444", textAlign: "center", marginBottom: 28, letterSpacing: 1 }}>LIVE STAND · vernieuwt automatisch</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 36 }}>
            {sorted.map((team, i) => (
              <div key={team.id} style={{ background: "#161616", border: `2px solid ${i === 0 && team.score > 0 ? team.color : "#1e1e1e"}`, borderRadius: 12, padding: "18px 22px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: team.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{i + 1}</div>
                  <div style={{ flex: 1, fontSize: 22, letterSpacing: 3 }}>{i === 0 && team.score > 0 ? "👑 " : ""}{team.name}</div>
                  <div style={{ fontSize: 44, color: team.color, lineHeight: 1 }}>{team.score}</div>
                  <div style={{ fontSize: 12, color: "#555", fontFamily: "'DM Sans',sans-serif", alignSelf: "flex-end" }}>pts</div>
                </div>
                <div style={{ height: 5, background: "#222", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(team.score / maxScore) * 100}%`, background: team.color, borderRadius: 3, transition: "width .5s" }} />
                </div>
              </div>
            ))}
          </div>

          {active.length > 0 && (<>
            <div style={{ fontSize: 16, letterSpacing: 3, color: "#555", marginBottom: 12 }}>🚶 ONDERWEG</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 36 }}>
              {active.map(a => {
                const team = teams.find(t => t.id === a.teamId);
                return (
                  <div key={a.id} style={{ background: "#161616", borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, fontFamily: "'DM Sans',sans-serif", border: "1px solid #222" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: team?.color }} />
                    <div style={{ flex: 1, fontSize: 14, color: "#bbb" }}><span style={{ color: team?.color, fontWeight: 600 }}>{team?.name}</span> — {a.opdracht}</div>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: "#555" }}>+{a.points}</div>
                    <div style={{ fontSize: 12, color: "#444" }}>{a.assignedAt}</div>
                  </div>
                );
              })}
            </div>
          </>)}

          <div style={{ fontSize: 16, letterSpacing: 3, color: "#555", marginBottom: 12 }}>✅ VOLTOOIDE OPDRACHTEN</div>
          {log.length === 0 && <div style={{ fontFamily: "'DM Sans',sans-serif", color: "#444", textAlign: "center", padding: "24px 0" }}>Nog geen opdrachten voltooid.</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {log.slice(0, 20).map((e, i) => (
              <div key={i} style={{ background: "#161616", borderRadius: 8, padding: "11px 16px", display: "flex", alignItems: "center", gap: 12, fontFamily: "'DM Sans',sans-serif", border: "1px solid #1e1e1e" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: e.teamColor, flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: 13, color: "#aaa" }}><span style={{ color: e.teamColor, fontWeight: 600 }}>{e.teamName}</span> — {e.opdracht}</div>
                <div style={{ fontSize: 12, color: "#444" }}>{e.time}</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: e.teamColor }}>+{e.points}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LEIDING: WACHTWOORD ── */}
      {view === "leiding" && !leidingUnlocked && (
        <div style={{ maxWidth: 360, margin: "80px auto", padding: "0 20px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🔒</div>
          <div style={{ fontSize: 24, letterSpacing: 4, marginBottom: 6 }}>LEIDING TOEGANG</div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#555", marginBottom: 28 }}>Voer het wachtwoord in</div>
          <input type="password" value={pwInput} onChange={e => { setPwInput(e.target.value); setPwError(false); }} onKeyDown={e => e.key === "Enter" && tryUnlock()} placeholder="Wachtwoord..."
            style={{ width: "100%", padding: "14px 16px", borderRadius: 8, border: `2px solid ${pwError ? "#E74C3C" : "#333"}`, background: "#161616", color: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: 16, marginBottom: 12, boxSizing: "border-box" }} />
          {pwError && <div style={{ fontFamily: "'DM Sans',sans-serif", color: "#E74C3C", fontSize: 13, marginBottom: 12 }}>Fout wachtwoord, probeer opnieuw.</div>}
          <Btn onClick={tryUnlock} color="#fff" bg="#333" full>ENTER</Btn>
        </div>
      )}

      {/* ── LEIDING: PANEEL ── */}
      {view === "leiding" && leidingUnlocked && (
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
            {(["toewijzen", "opdrachten", "teams"] as const).map(t => (
              <button key={t} onClick={() => setLeidingTab(t)} style={{ fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2, fontSize: 15, padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", background: leidingTab === t ? "#fff" : "#1e1e1e", color: leidingTab === t ? "#0d0d0d" : "#666" }}>
                {t === "toewijzen" ? "📋 Toewijzen" : t === "opdrachten" ? "✏️ Opdrachten" : "👥 Teams"}
              </button>
            ))}
          </div>

          {/* ── TAB: TOEWIJZEN ── */}
          {leidingTab === "toewijzen" && (<>
            {active.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <Label>🚶 Onderweg — ✅ goedkeuren als ze terugkomen, ✖ als mislukt</Label>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {active.map(a => {
                    const team = teams.find(t => t.id === a.teamId);
                    return (
                      <Card key={a.id} style={{ border: `1px solid ${team?.color ?? "#333"}44` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: team?.color, flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, color: team?.color, fontSize: 14 }}>{team?.name}</div>
                            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#aaa", marginTop: 2 }}>{a.opdracht}</div>
                          </div>
                          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: team?.color }}>+{a.points}</div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => completeOpdracht(a)} style={{ background: "#2ECC7122", border: "2px solid #2ECC71", borderRadius: 8, color: "#2ECC71", fontSize: 18, width: 42, height: 42, cursor: "pointer" }}>✅</button>
                            <button onClick={() => cancelOpdracht(a)} style={{ background: "#E74C3C22", border: "2px solid #E74C3C", borderRadius: 8, color: "#E74C3C", fontSize: 18, width: 42, height: 42, cursor: "pointer" }}>✖</button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
                <div style={{ height: 1, background: "#222", margin: "28px 0" }} />
              </div>
            )}

            <Label>Nieuwe opdracht toewijzen</Label>
            <div style={{ marginBottom: 20 }}>
              <Label>1. Welk team?</Label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {teams.map(t => (
                  <button key={t.id} onClick={() => setATeam(t)} style={{ fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2, fontSize: 15, padding: "10px 20px", borderRadius: 8, cursor: "pointer", border: `2px solid ${aTeam?.id === t.id ? t.color : "#333"}`, background: aTeam?.id === t.id ? t.color + "22" : "#161616", color: aTeam?.id === t.id ? t.color : "#888" }}>
                    {t.name} · {t.score} pts
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <Label>2. Moeilijkheid?</Label>
              <div style={{ display: "flex", gap: 8 }}>
                {([3, 5, 8] as const).map(pts => {
                  const col = ptsBorderColor(pts);
                  return (
                    <button key={pts} onClick={() => { setAPts(pts); setAOp(null); }} style={{ fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1, fontSize: 18, padding: "12px 22px", borderRadius: 8, cursor: "pointer", border: `2px solid ${aPts === pts ? col : "#333"}`, background: aPts === pts ? col + "22" : "#161616", color: aPts === pts ? col : "#888" }}>
                      {"⭐".repeat(pts === 3 ? 1 : pts === 5 ? 2 : 3)} {pts}
                    </button>
                  );
                })}
              </div>
            </div>

            {aPts && (
              <div style={{ marginBottom: 24 }}>
                <Label>3. Welke opdracht?</Label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 300, overflowY: "auto" }}>
                  {opdrachten[aPts as 3 | 5 | 8].map((op: string) => (
                    <button key={op} onClick={() => setAOp(op)} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, padding: "11px 14px", borderRadius: 8, cursor: "pointer", textAlign: "left", border: `2px solid ${aOp === op ? "#fff" : "#222"}`, background: aOp === op ? "#2a2a2a" : "#161616", color: aOp === op ? "#fff" : "#888" }}>
                      {op}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Btn onClick={assignOpdracht} disabled={!aTeam || !aPts || !aOp} color="#000" bg={aTeam?.color ?? "#fff"} full>
              🚀 STUUR TEAM OP PAD
            </Btn>
          </>)}

          {/* ── TAB: OPDRACHTEN BEHEREN ── */}
          {leidingTab === "opdrachten" && (<>
            {/* Nieuwe opdracht toevoegen */}
            <Label>Nieuwe opdracht toevoegen</Label>
            <Card style={{ marginBottom: 28 }}>
              <textarea
                value={newOpTekst}
                onChange={e => setNewOpTekst(e.target.value)}
                placeholder="Beschrijf de opdracht... (je kan 📸 🎒 ✍️ gebruiken)"
                rows={2}
                style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "2px solid #333", background: "#0d0d0d", color: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: 14, boxSizing: "border-box", marginBottom: 12, resize: "vertical" }}
              />
              <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center" }}>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#555" }}>Punten:</span>
                {([3, 5, 8] as const).map(pts => {
                  const col = ptsBorderColor(pts);
                  return (
                    <button key={pts} onClick={() => setNewOpPts(pts)} style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, padding: "8px 16px", borderRadius: 8, cursor: "pointer", border: `2px solid ${newOpPts === pts ? col : "#333"}`, background: newOpPts === pts ? col + "22" : "#161616", color: newOpPts === pts ? col : "#888" }}>
                      {"⭐".repeat(pts === 3 ? 1 : pts === 5 ? 2 : 3)} {pts}
                    </button>
                  );
                })}
              </div>
              <Btn onClick={addOpdracht} disabled={!newOpTekst.trim()} color="#000" bg="#2ECC71" full>+ OPDRACHT TOEVOEGEN</Btn>
            </Card>

            {/* Bestaande opdrachten per niveau */}
            {([3, 5, 8] as const).map(pts => {
              const col = ptsBorderColor(pts);
              const label = pts === 3 ? "⭐ 3 punten" : pts === 5 ? "⭐⭐ 5 punten" : "⭐⭐⭐ 8 punten";
              return (
                <div key={pts} style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 18, letterSpacing: 3, color: col, marginBottom: 10 }}>{label}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {opdrachten[pts].map((op: string, i: number) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "#161616", border: "1px solid #222", borderRadius: 8, padding: "10px 14px" }}>
                        <div style={{ flex: 1, fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#bbb" }}>{op}</div>
                        <button onClick={() => removeOpdracht(pts, i)} style={{ background: "none", border: "none", color: "#555", fontSize: 16, cursor: "pointer", flexShrink: 0 }}>🗑️</button>
                      </div>
                    ))}
                    {opdrachten[pts].length === 0 && (
                      <div style={{ fontFamily: "'DM Sans',sans-serif", color: "#444", fontSize: 13, padding: "12px 0" }}>Geen opdrachten voor dit niveau.</div>
                    )}
                  </div>
                </div>
              );
            })}
          </>)}

          {/* ── TAB: TEAMS ── */}
          {leidingTab === "teams" && (<>
            <Label>Huidige teams</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
              {teams.map(t => (
                <Card key={t.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: t.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, fontFamily: "'DM Sans',sans-serif", color: "#ccc", fontSize: 15 }}>{t.name}</div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: t.color }}>{t.score} pts</div>
                  <button onClick={() => removeTeam(t.id)} style={{ background: "none", border: "none", color: "#555", fontSize: 18, cursor: "pointer" }}>🗑️</button>
                </Card>
              ))}
            </div>

            <Label>Team toevoegen</Label>
            <Card style={{ marginBottom: 28 }}>
              <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Teamnaam..."
                style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "2px solid #333", background: "#0d0d0d", color: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: 15, boxSizing: "border-box", marginBottom: 12 }} />
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {COLORS.map(c => (
                  <div key={c} onClick={() => setEditColor(c)} style={{ width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer", border: editColor === c ? "3px solid #fff" : "3px solid transparent" }} />
                ))}
              </div>
              <Btn onClick={addTeam} disabled={!editName.trim()} color="#000" bg={editColor} full>+ TEAM TOEVOEGEN</Btn>
            </Card>

            <div style={{ borderTop: "1px solid #222", paddingTop: 20 }}>
              <Label>⚠️ Gevaarzone</Label>
              <Btn onClick={resetAll} color="#E74C3C" bg="#E74C3C11">🗑️ Reset heel het spel</Btn>
            </div>
          </>)}
        </div>
      )}
    </div>
  );
}
