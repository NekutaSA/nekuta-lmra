import { useState, useEffect, useRef } from "react";

const O = "#E8611A";
const DARK = "#0F1117";
const GREEN = "#22C55E";
const RED = "#EF4444";
const AMBER = "#F59E0B";
const M = "rgba(255,255,255,0.4)";

const EPI_LIST = [
  { code: "M003", label: "Antibruit", e: "🎧" },
  { code: "M004", label: "Lunettes", e: "🥽" },
  { code: "M008", label: "Chaussures", e: "👢" },
  { code: "M009", label: "Gants", e: "🧤" },
  { code: "M010", label: "Corps", e: "🦺" },
  { code: "M013", label: "Visière", e: "😷" },
  { code: "M014", label: "Casque", e: "⛑️" },
  { code: "M015", label: "Gilet HV", e: "🟡" },
  { code: "M017", label: "Masque respi", e: "🫁" },
  { code: "M018", label: "Harnais", e: "🪢" },
];

const RISK_CATEGORIES = [
  {
    id: "prep",
    icon: "📋",
    label: "Préparation du travail",
    checks: [
      "Les travaux à effectuer sont-ils soigneusement décrits ?",
      "Chacun sait-il ce que l'on attend de lui ?",
      "Chacun a-t-il reçu toutes les consignes de sécurité ?",
      "Le permis est en règle et toutes les exigences remplies ?",
    ],
  },
  {
    id: "tranchee",
    icon: "⚠️",
    label: "Tranchées & Excavations",
    checks: [
      "Blindage / étaiement en place ?",
      "Profondeur > 1.2m → échelle d'accès présente ?",
      "Risque d'effondrement des parois maîtrisé ?",
      "Pas d'accumulation d'eau dans la fouille ?",
    ],
  },
  {
    id: "circulation",
    icon: "🚧",
    label: "Circulation & Signalisation",
    checks: [
      "Signalisation chantier conforme (panneaux, cônes, barrières) ?",
      "Plan de circulation appliqué ?",
      "Signaleur présent si nécessaire ?",
      "Visibilité suffisante (gilets, balisage lumineux) ?",
    ],
  },
  {
    id: "engins",
    icon: "🚜",
    label: "Engins & Machines",
    checks: [
      "Contrôle journalier de l'engin effectué ?",
      "Zone de travail balisée autour de l'engin ?",
      "Communication claire entre machiniste et piétons ?",
      "Tout l'outillage requis présent et en bon état ?",
    ],
  },
  {
    id: "reseaux",
    icon: "🔌",
    label: "Réseaux Souterrains",
    checks: [
      "Plans KLIM / impétrants consultés ?",
      "Détection réseaux effectuée ?",
      "Risque gaz, électricité, eau, fibre identifié ?",
      "Distance de sécurité respectée ?",
    ],
  },
  {
    id: "epi_check",
    icon: "🦺",
    label: "EPI & Équipements",
    checks: [
      "Chacun dispose-t-il des EPI requis ?",
      "Matériel et EPI en bon état ?",
      "Trousse de secours accessible ?",
      "Procédure d'urgence connue de tous ?",
    ],
  },
  {
    id: "env",
    icon: "🌧️",
    label: "Environnement & Conditions",
    checks: [
      "Conditions météo acceptables ?",
      "Éclairage suffisant ?",
      "Risque de glissade (boue, verglas) maîtrisé ?",
      "L'environnement de travail est-il rangé ?",
    ],
  },
];

const ENV_DANGERS = [
  "Travail isolé", "Produits dangereux", "Espace confiné", "Points chauds",
  "Éléments mobiles", "Vibration", "Manutention", "Exposition",
];
const INT_RISKS = [
  "Écrasement", "Coupure", "Coincement", "Asphyxie", "Glissade", "Heurt",
  "Contamination", "Chute sol", "Chaleur", "Froid",
  "Électrocution", "Surdité", "Brûlure", "Chute hauteur", "Inhalation",
  "Explosion", "Perforation", "Projection", "Chute objet",
];

const EMERGENCY = [
  { l: "Urgence & Pompiers", n: "112", i: "🚒" },
  { l: "Pompiers", n: "100", i: "🔥" },
  { l: "Police Fédérale", n: "101", i: "🚔" },
  { l: "Centre Anti-Poisons", n: "070 245 245", i: "☠️" },
  { l: "Grands Brûlés", n: "02 268 62 00", i: "🏥" },
  { l: "Croix Rouge", n: "105", i: "➕" },
  { l: "Pharmacie de Garde", n: "0903 99 000", i: "💊" },
  { l: "Médecin de Garde", n: "02 479 18 18", i: "👨‍⚕️" },
  { l: "Responsable Nekuta", n: "+32 489 76 49 45", i: "📞" },
];

export default function App() {
  const [step, setStep] = useState("splash");
  const [info, setInfo] = useState({ lieu: "", travail: "", date: new Date().toISOString().slice(0, 10), heure: new Date().toTimeString().slice(0, 5) });
  const [epis, setEpis] = useState([]);
  const [checks, setChecks] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [envD, setEnvD] = useState([]);
  const [intR, setIntR] = useState([]);
  const [comment, setComment] = useState("");
  const [conscience, setConscience] = useState(null);
  const [signers, setSigners] = useState([{ name: "", signed: false }]);
  const [showSOS, setShowSOS] = useState(false);
  const [ts, setTs] = useState(null);
  const ref = useRef(null);

  useEffect(() => { setTimeout(() => setStep("info"), 2200); }, []);
  const go = (s) => { setStep(s); setTimeout(() => ref.current?.scrollTo({ top: 0, behavior: "smooth" }), 50); };

  const total = RISK_CATEGORIES.reduce((s, c) => s + c.checks.length, 0);
  const done = Object.keys(checks).length;
  const prog = Math.round((done / total) * 100);
  const hasNOK = Object.values(checks).some(v => v === "nok");
  const nokCount = Object.values(checks).filter(v => v === "nok").length;
  const allChecked = RISK_CATEGORIES.every(c => c.checks.every((_, i) => checks[`${c.id}-${i}`] !== undefined));
  const signValid = signers.some(s => s.name && s.signed);

  const getCatStatus = (cat) => {
    const r = cat.checks.map((_, i) => checks[`${cat.id}-${i}`]);
    if (r.some(v => v === "nok")) return RED;
    if (r.every(v => v === "ok" || v === "na")) return GREEN;
    if (r.some(v => v)) return AMBER;
    return "rgba(255,255,255,0.15)";
  };

  // ── SPLASH ──
  if (step === "splash") return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: `linear-gradient(160deg, ${DARK}, #16213E, ${DARK})`, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`@keyframes p{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}} @keyframes fu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}} *{box-sizing:border-box;margin:0;padding:0} input,textarea,button{font-family:inherit} ::-webkit-scrollbar{width:0}`}</style>
      <div style={{ width: 76, height: 76, borderRadius: 20, background: `linear-gradient(135deg, ${O}, #FF8A3D)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, marginBottom: 20, animation: "p 1.5s ease infinite", boxShadow: `0 0 50px ${O}33` }}>🛡️</div>
      <div style={{ color: "white", fontSize: 22, fontWeight: 800, letterSpacing: 3 }}>NEKUTA</div>
      <div style={{ color: O, fontSize: 11, fontWeight: 700, letterSpacing: 5, marginTop: 4 }}>LMRA DIGITAL</div>
      <div style={{ color: M, fontSize: 12, marginTop: 16 }}>S'arrêter · Réfléchir · Agir</div>
    </div>
  );

  return (
    <div ref={ref} style={{ minHeight: "100vh", background: `linear-gradient(170deg, ${DARK}, #131620)`, fontFamily: "'Segoe UI', system-ui, sans-serif", overflowY: "auto" }}>
      <style>{`@keyframes fu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}} *{box-sizing:border-box;margin:0;padding:0} input,textarea,button{font-family:inherit} ::-webkit-scrollbar{width:0}`}</style>

      {/* HEADER */}
      <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div>
          <div style={{ color: "white", fontSize: 17, fontWeight: 800, letterSpacing: 1.5 }}>NEKUTA</div>
          <div style={{ color: O, fontSize: 9, fontWeight: 700, letterSpacing: 3 }}>LMRA DIGITAL</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowSOS(!showSOS)} style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${RED}44`, background: `${RED}12`, color: RED, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            🆘 {showSOS ? "✕" : "Urgence"}
          </button>
          <div style={{ background: `${O}18`, borderRadius: 8, padding: "5px 10px", color: O, fontSize: 10, fontWeight: 800, letterSpacing: 1, display: "flex", alignItems: "center" }}>VCA★★</div>
        </div>
      </div>

      {/* SOS PANEL */}
      {showSOS && (
        <div style={{ margin: "8px 16px 0", padding: 14, borderRadius: 14, background: `${RED}08`, border: `1px solid ${RED}22`, animation: "fu 0.3s ease" }}>
          <div style={{ color: RED, fontSize: 12, fontWeight: 800, letterSpacing: 1, marginBottom: 10 }}>NUMÉROS D'URGENCE</div>
          {EMERGENCY.map((e, i) => (
            <a key={i} href={`tel:${e.n.replace(/\s/g, "")}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, background: "rgba(255,255,255,0.03)", marginBottom: 4, textDecoration: "none", border: "1px solid rgba(255,255,255,0.03)" }}>
              <span style={{ fontSize: 16 }}>{e.i}</span>
              <span style={{ flex: 1, color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{e.l}</span>
              <span style={{ color: "white", fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{e.n}</span>
            </a>
          ))}
        </div>
      )}

      <div style={{ padding: "16px 16px 100px", animation: "fu 0.4s ease" }}>

        {/* ═══ STEP: INFO ═══ */}
        {step === "info" && (<>
          <StepBar steps={["Info", "EPI", "Analyse", "Risques", "Décision"]} current={0} />
          <Card title="Identification" sub="Renseignez les infos chantier">
            <Inp label="Lieu de travail" ph="Adresse précise + commune" v={info.lieu} set={v => setInfo(p => ({ ...p, lieu: v }))} />
            <Inp label="Travail à effectuer" ph="Ex : Terrassement, pavage, asphaltage..." v={info.travail} set={v => setInfo(p => ({ ...p, travail: v }))} />
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}><Inp label="Date" type="date" v={info.date} set={v => setInfo(p => ({ ...p, date: v }))} /></div>
              <div style={{ flex: 1 }}><Inp label="Heure" type="time" v={info.heure} set={v => setInfo(p => ({ ...p, heure: v }))} /></div>
            </div>
          </Card>
          <Btn label="SUIVANT → EPI" dis={!info.lieu || !info.travail} onClick={() => go("epi")} />
        </>)}

        {/* ═══ STEP: EPI ═══ */}
        {step === "epi" && (<>
          <StepBar steps={["Info", "EPI", "Analyse", "Risques", "Décision"]} current={1} />
          <Card title="EPI requis" sub="Sélectionnez les équipements obligatoires pour cette intervention">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 6, marginTop: 4 }}>
              {EPI_LIST.map(epi => {
                const a = epis.includes(epi.code);
                return (
                  <button key={epi.code} onClick={() => setEpis(p => a ? p.filter(c => c !== epi.code) : [...p, epi.code])} style={{
                    padding: "10px 2px", borderRadius: 10,
                    border: `2px solid ${a ? O : "rgba(255,255,255,0.05)"}`,
                    background: a ? `${O}12` : "rgba(255,255,255,0.02)",
                    cursor: "pointer", textAlign: "center", transition: "all 0.2s",
                  }}>
                    <div style={{ fontSize: 22 }}>{epi.e}</div>
                    <div style={{ color: a ? O : M, fontSize: 8, fontWeight: 700, marginTop: 2 }}>{epi.code}</div>
                    <div style={{ color: a ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)", fontSize: 8, marginTop: 1 }}>{epi.label}</div>
                  </button>
                );
              })}
            </div>
          </Card>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <BtnBack onClick={() => go("info")} />
            <Btn label="SUIVANT → Analyse" dis={epis.length === 0} onClick={() => go("checks")} />
          </div>
        </>)}

        {/* ═══ STEP: CHECKS ═══ */}
        {step === "checks" && (<>
          <StepBar steps={["Info", "EPI", "Analyse", "Risques", "Décision"]} current={2} />

          {/* Progress */}
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 20, height: 6, marginBottom: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${prog}%`, background: hasNOK ? `linear-gradient(90deg, ${RED}, #FF6B6B)` : `linear-gradient(90deg, ${O}, ${GREEN})`, borderRadius: 20, transition: "all 0.4s" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: M, marginBottom: 14 }}>
            <span>{done}/{total} vérifications</span>
            <span>{prog}%</span>
          </div>

          {/* Task badge */}
          <div style={{ background: `${O}10`, border: `1px solid ${O}22`, borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 14 }}>📋</span>
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}><b style={{ color: O }}>{info.travail}</b> — {info.lieu}</span>
          </div>

          {/* Categories */}
          {RISK_CATEGORIES.map(cat => {
            const open = expanded === cat.id;
            const color = getCatStatus(cat);
            return (
              <div key={cat.id} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, border: `1px solid ${open ? O + "33" : "rgba(255,255,255,0.04)"}`, marginBottom: 8, overflow: "hidden", transition: "all 0.3s" }}>
                <div onClick={() => setExpanded(open ? null : cat.id)} style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{cat.icon}</span>
                    <span style={{ color: "white", fontSize: 14, fontWeight: 700 }}>{cat.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: color !== "rgba(255,255,255,0.15)" ? `0 0 6px ${color}55` : "none", transition: "all 0.3s" }} />
                    <span style={{ color: M, fontSize: 16, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.3s", display: "inline-block" }}>▾</span>
                  </div>
                </div>
                {open && (
                  <div style={{ padding: "2px 16px 16px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    {cat.checks.map((ck, i) => {
                      const v = checks[`${cat.id}-${i}`];
                      return (
                        <div key={i} style={{ padding: "12px 0", borderBottom: i < cat.checks.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginBottom: 10, lineHeight: 1.5 }}>{ck}</div>
                          <div style={{ display: "flex", gap: 8 }}>
                            {[["ok", "OK", GREEN], ["nok", "NOK", RED], ["na", "N/A", "rgba(255,255,255,0.3)"]].map(([key, lbl, col]) => (
                              <button key={key} onClick={() => setChecks(p => ({ ...p, [`${cat.id}-${i}`]: key }))} style={{
                                flex: 1, padding: "9px 0", borderRadius: 8,
                                border: `1.5px solid ${v === key ? col : "rgba(255,255,255,0.08)"}`,
                                background: v === key ? `${col}20` : "transparent",
                                color: v === key ? col : "rgba(255,255,255,0.25)",
                                fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                              }}>{lbl}</button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <BtnBack onClick={() => go("epi")} />
            <Btn label={hasNOK ? `⚠️ ${nokCount} NOK → Risques` : "SUIVANT → Risques"} dis={!allChecked} onClick={() => go("risks")} color={hasNOK ? RED : O} />
          </div>
        </>)}

        {/* ═══ STEP: RISKS (dangers + risques tags) ═══ */}
        {step === "risks" && (<>
          <StepBar steps={["Info", "EPI", "Analyse", "Risques", "Décision"]} current={3} />

          <Card title="Dangers de l'environnement" sub="Identifiez les dangers présents sur le lieu de travail">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
              {ENV_DANGERS.map(d => {
                const a = envD.includes(d);
                return <TagBtn key={d} text={d} active={a} color={AMBER} onClick={() => setEnvD(p => a ? p.filter(x => x !== d) : [...p, d])} />;
              })}
            </div>
          </Card>

          <div style={{ height: 10 }} />

          <Card title="Risques de l'intervention" sub="Identifiez les risques liés à la tâche">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
              {INT_RISKS.map(r => {
                const a = intR.includes(r);
                return <TagBtn key={r} text={r} active={a} color={RED} onClick={() => setIntR(p => a ? p.filter(x => x !== r) : [...p, r])} />;
              })}
            </div>
          </Card>

          <div style={{ height: 10 }} />

          <Card title="Mesures complémentaires" sub="Décrivez les mesures prises pour maîtriser les risques identifiés">
            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Ex : Balisage renforcé côté circulation, détection réseau effectuée par..."
              style={{ width: "100%", minHeight: 80, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 12, color: "white", fontSize: 13, resize: "vertical", outline: "none", boxSizing: "border-box" }} />
          </Card>

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <BtnBack onClick={() => go("checks")} />
            <Btn label="SUIVANT → Décision" onClick={() => go("decision")} />
          </div>
        </>)}

        {/* ═══ STEP: DECISION ═══ */}
        {step === "decision" && (<>
          <StepBar steps={["Info", "EPI", "Analyse", "Risques", "Décision"]} current={4} />

          {/* NOK summary */}
          {hasNOK && (
            <div style={{ background: `${RED}10`, border: `1px solid ${RED}33`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
              <div style={{ color: RED, fontSize: 14, fontWeight: 800, marginBottom: 8 }}>⚠️ {nokCount} point(s) non conforme(s)</div>
              {RISK_CATEGORIES.map(cat => cat.checks.map((ck, i) => checks[`${cat.id}-${i}`] === "nok" ? (
                <div key={`${cat.id}-${i}`} style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, padding: "4px 0 4px 14px", borderLeft: `2px solid ${RED}`, marginTop: 6 }}>
                  {cat.icon} {ck}
                </div>
              ) : null))}
            </div>
          )}

          {/* Identified risks summary */}
          {(envD.length > 0 || intR.length > 0) && (
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 16, marginBottom: 14, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ color: M, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 8 }}>RISQUES IDENTIFIÉS</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {envD.map(d => <MiniTag key={d} t={d} c={AMBER} />)}
                {intR.map(r => <MiniTag key={r} t={r} c={RED} />)}
              </div>
            </div>
          )}

          {/* THE question */}
          <Card title="Puis-je travailler en sécurité ?" sub="Répondez honnêtement — cette question est l'essence même du LMRA">
            <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
              {[
                { key: "go", icon: "🟢", label: "OUI — GO", desc: "Tous les risques sont maîtrisés", color: GREEN },
                { key: "cond", icon: "🟡", label: "OUI — Sous conditions", desc: "Mesures correctives prises", color: AMBER },
                { key: "stop", icon: "🔴", label: "NON — STOP", desc: "Alerter le responsable", color: RED },
              ].map(d => (
                <button key={d.key} onClick={() => setConscience(d.key)} style={{
                  flex: 1, padding: "16px 8px", borderRadius: 12,
                  border: `2px solid ${conscience === d.key ? d.color : "rgba(255,255,255,0.06)"}`,
                  background: conscience === d.key ? `${d.color}12` : "rgba(255,255,255,0.02)",
                  cursor: "pointer", textAlign: "center", transition: "all 0.2s",
                }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{d.icon}</div>
                  <div style={{ color: conscience === d.key ? d.color : "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 800 }}>{d.label}</div>
                  <div style={{ color: M, fontSize: 10, marginTop: 4, lineHeight: 1.3 }}>{d.desc}</div>
                </button>
              ))}
            </div>
          </Card>

          {/* Signature */}
          {conscience && (<>
            <div style={{ height: 10 }} />
            <Card title="Engagement" sub="« Ayant été informé de ces prescriptions, je m'engage à en respecter les consignes. »">
              {signers.map((s, i) => (
                <div key={i} style={{ marginBottom: 12, padding: 14, background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)" }}>
                  <Inp label={`Exécutant ${i + 1}`} ph="Nom & Prénom" v={s.name} set={v => { const n = [...signers]; n[i] = { ...n[i], name: v }; setSigners(n); }} />
                  <button onClick={() => { const n = [...signers]; n[i] = { ...n[i], signed: !n[i].signed }; setSigners(n); }} style={{
                    width: "100%", padding: "12px 0", borderRadius: 8,
                    border: `2px solid ${s.signed ? GREEN : "rgba(255,255,255,0.08)"}`,
                    background: s.signed ? `${GREEN}12` : "transparent",
                    color: s.signed ? GREEN : M,
                    fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                  }}>
                    {s.signed ? "✅ Signé" : "Tapez pour signer ✍️"}
                  </button>
                </div>
              ))}
              <button onClick={() => setSigners(p => [...p, { name: "", signed: false }])} style={{
                width: "100%", padding: "10px 0", borderRadius: 8,
                border: "1px dashed rgba(255,255,255,0.1)", background: "transparent",
                color: M, fontSize: 12, cursor: "pointer",
              }}>+ Ajouter un exécutant</button>
            </Card>

            <Btn label={conscience === "stop" ? "🛑 CONFIRMER — STOP TRAVAUX" : "✅ VALIDER LE LMRA"} dis={!signValid}
              onClick={() => { setTs(new Date().toLocaleString("fr-BE")); go("summary"); }}
              color={conscience === "stop" ? RED : conscience === "cond" ? AMBER : GREEN} mt={16} />
          </>)}

          <div style={{ marginTop: 16 }}>
            <BtnBack onClick={() => go("risks")} full />
          </div>
        </>)}

        {/* ═══ SUMMARY ═══ */}
        {step === "summary" && (<>
          {/* Banner */}
          {(() => {
            const d = { go: { l: "GO — TRAVAIL AUTORISÉ", c: GREEN, i: "✅" }, cond: { l: "GO CONDITIONNEL", c: AMBER, i: "⚠️" }, stop: { l: "STOP — TRAVAIL INTERDIT", c: RED, i: "🛑" } }[conscience];
            return (
              <div style={{ background: `${d.c}12`, border: `2px solid ${d.c}`, borderRadius: 16, padding: 24, textAlign: "center" }}>
                <div style={{ fontSize: 44, marginBottom: 6 }}>{d.i}</div>
                <div style={{ color: d.c, fontSize: 18, fontWeight: 800, letterSpacing: 1 }}>{d.l}</div>
                <div style={{ color: M, fontSize: 11, marginTop: 8 }}>{ts}</div>
                <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, marginTop: 4 }}>Pas de sécurité, pas de travail</div>
              </div>
            );
          })()}

          <SumCard label="IDENTIFICATION">
            <SR l="Lieu" v={info.lieu} /><SR l="Travail" v={info.travail} /><SR l="Date" v={`${info.date} · ${info.heure}`} />
          </SumCard>

          <SumCard label="EPI SÉLECTIONNÉS">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {epis.map(c => { const e = EPI_LIST.find(x => x.code === c); return <MiniTag key={c} t={`${e?.e} ${c}`} c={O} />; })}
            </div>
          </SumCard>

          <SumCard label="ANALYSE DES RISQUES">
            <SR l="Vérifications" v={`${done}/${total} — ${nokCount} NOK`} />
            {RISK_CATEGORIES.map(cat => cat.checks.map((ck, i) => checks[`${cat.id}-${i}`] === "nok" ? (
              <div key={`${cat.id}-${i}`} style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, padding: "3px 0 3px 10px", borderLeft: `2px solid ${RED}55`, marginTop: 4 }}>
                {cat.icon} {ck}
              </div>
            ) : null))}
          </SumCard>

          {(envD.length > 0 || intR.length > 0) && (
            <SumCard label="DANGERS & RISQUES">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {envD.map(d => <MiniTag key={d} t={d} c={AMBER} />)}
                {intR.map(r => <MiniTag key={r} t={r} c={RED} />)}
              </div>
              {comment && <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 10, padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}><b style={{ color: M }}>Mesures :</b> {comment}</div>}
            </SumCard>
          )}

          <SumCard label="SIGNATAIRES">
            {signers.filter(s => s.name).map((s, i) => <SR key={i} l={s.name} v={s.signed ? "✅ Signé" : "—"} />)}
          </SumCard>

          <button onClick={() => {
            setStep("info"); setInfo({ lieu: "", travail: "", date: new Date().toISOString().slice(0, 10), heure: new Date().toTimeString().slice(0, 5) });
            setEpis([]); setChecks({}); setExpanded(null); setEnvD([]); setIntR([]);
            setComment(""); setConscience(null); setSigners([{ name: "", signed: false }]);
          }} style={{ width: "100%", marginTop: 20, padding: "15px 0", borderRadius: 12, border: `1px solid ${O}44`, background: "transparent", color: O, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            🔄 NOUVEAU LMRA
          </button>

          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.12)", fontSize: 9, marginTop: 28, lineHeight: 1.8 }}>
            NEKUTA LMRA Digital v3.0 — VCA★★<br />Responsable : Hahati Mohamed<br />info@nekuta.be · +32 489 76 49 45
          </div>
        </>)}
      </div>
    </div>
  );
}

// ── SMALL COMPONENTS ──

function StepBar({ steps, current }) {
  return (
    <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
      {steps.map((s, i) => (
        <div key={s} style={{ flex: 1, textAlign: "center" }}>
          <div style={{ height: 3, borderRadius: 2, background: i <= current ? O : "rgba(255,255,255,0.06)", transition: "all 0.3s", marginBottom: 4 }} />
          <div style={{ fontSize: 9, fontWeight: i === current ? 700 : 400, color: i <= current ? O : "rgba(255,255,255,0.18)", letterSpacing: 0.3 }}>{s}</div>
        </div>
      ))}
    </div>
  );
}
function Card({ title, sub, children }) {
  return (
    <div style={{ background: "#181B24", borderRadius: 14, padding: 18, border: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ color: "white", fontSize: 16, fontWeight: 800 }}>{title}</div>
      {sub && <div style={{ color: M, fontSize: 11, marginTop: 3, marginBottom: 16, lineHeight: 1.5 }}>{sub}</div>}
      {children}
    </div>
  );
}
function Inp({ label, ph, v, set, type = "text" }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>{label}</div>
      <input type={type} placeholder={ph} value={v} onChange={e => set(e.target.value)}
        style={{ width: "100%", padding: "12px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" }}
        onFocus={e => e.target.style.borderColor = `${O}55`}
        onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.07)"} />
    </div>
  );
}
function Btn({ label, dis, onClick, color, mt }) {
  return (
    <button onClick={dis ? undefined : onClick} disabled={dis} style={{
      flex: 1, width: "100%", marginTop: mt ?? 16, padding: "15px 0", borderRadius: 12, border: "none",
      background: dis ? "rgba(255,255,255,0.06)" : `linear-gradient(135deg, ${color || O}, ${color ? (color === RED ? "#FF6B6B" : color === AMBER ? "#FBBF24" : "#4ADE80") : "#FF8A3D"})`,
      color: dis ? "rgba(255,255,255,0.2)" : (color === AMBER ? DARK : "white"),
      fontSize: 14, fontWeight: 700, cursor: dis ? "default" : "pointer", letterSpacing: 0.3, transition: "all 0.3s",
    }}>{label}</button>
  );
}
function BtnBack({ onClick, full }) {
  return (
    <button onClick={onClick} style={{
      padding: "15px 20px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)",
      background: "transparent", color: M, fontSize: 13, fontWeight: 600, cursor: "pointer",
      ...(full ? { width: "100%" } : {}),
    }}>← Retour</button>
  );
}
function TagBtn({ text, active, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 14px", borderRadius: 18,
      border: `1.5px solid ${active ? color : "rgba(255,255,255,0.06)"}`,
      background: active ? `${color}15` : "transparent",
      color: active ? color : "rgba(255,255,255,0.4)",
      fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
    }}>{active ? "● " : ""}{text}</button>
  );
}
function MiniTag({ t, c }) {
  return <span style={{ background: `${c}12`, border: `1px solid ${c}28`, borderRadius: 10, padding: "2px 8px", color: c, fontSize: 10, fontWeight: 600 }}>{t}</span>;
}
function SumCard({ label, children }) {
  return (
    <div style={{ background: "#181B24", borderRadius: 14, padding: 16, marginTop: 10, border: "1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ color: O, fontSize: 9, fontWeight: 800, letterSpacing: 2, marginBottom: 10 }}>{label}</div>
      {children}
    </div>
  );
}
function SR({ l, v }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.03)", gap: 10 }}>
      <span style={{ color: M, fontSize: 11 }}>{l}</span>
      <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: 600, textAlign: "right" }}>{v}</span>
    </div>
  );
}
