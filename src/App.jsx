import { useState, useEffect, useCallback } from "react";

// ── Google Fonts ──────────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500&display=swap";
document.head.appendChild(fontLink);

// ── Your 4 Locations ──────────────────────────────────────────────────────────
const LOCATIONS = [
  {
    id: "airport",
    name: "Airport",
    address: "5730 Williamsburg Rd",
    city: "Sandston, VA 23150",
    phone: "(804) 626-5365",
    email: "airport@extraattic.net",
    color: "#60a5fa",
    features: ["Drive-Up Access", "Ground-Level Units", "Near I-64 & I-295"],
    unitTypes: ["standard"],
  },
  {
    id: "patterson",
    name: "Patterson",
    address: "10551 Patterson Ave",
    city: "Richmond, VA 23238",
    phone: "(804) 492-0973",
    email: "patterson@extraattic.net",
    color: "#a78bfa",
    features: ["Climate Controlled", "Ground-Level Units", "Near Short Pump"],
    unitTypes: ["standard", "climate"],
  },
  {
    id: "bethlehem",
    name: "Bethlehem",
    address: "4825 Bethlehem Rd",
    city: "Richmond, VA 23230",
    phone: "(804) 993-8572",
    email: "bethlehem@extraattic.net",
    color: "#34d399",
    features: ["Climate Controlled", "Wine Storage", "Boat & RV Parking", "Near I-64"],
    unitTypes: ["standard", "climate", "vehicle"],
  },
  {
    id: "springfield",
    name: "Springfield",
    address: "3901 Springfield Rd",
    city: "Glen Allen, VA 23060",
    phone: "(804) 376-5751",
    email: "springfield@extraattic.net",
    color: "#fb923c",
    features: ["Climate Controlled", "Drive-Up & Interior", "No Admin Fees", "Online Rental"],
    unitTypes: ["standard", "climate"],
  },
];

// ── Unit Definitions ──────────────────────────────────────────────────────────
const UNIT_DEFS = [
  { id: "5x5",     label: "5×5",      sqft: 25,  type: "standard", marketAvg: 50  },
  { id: "5x10",    label: "5×10",     sqft: 50,  type: "standard", marketAvg: 70  },
  { id: "10x10",   label: "10×10",    sqft: 100, type: "standard", marketAvg: 105 },
  { id: "10x15",   label: "10×15",    sqft: 150, type: "standard", marketAvg: 135 },
  { id: "10x20",   label: "10×20",    sqft: 200, type: "standard", marketAvg: 165 },
  { id: "10x25",   label: "10×25",    sqft: 250, type: "standard", marketAvg: 195 },
  { id: "10x30",   label: "10×30",    sqft: 300, type: "standard", marketAvg: 235 },
  { id: "cc5x5",   label: "CC 5×5",   sqft: 25,  type: "climate",  marketAvg: 55  },
  { id: "cc5x10",  label: "CC 5×10",  sqft: 50,  type: "climate",  marketAvg: 85  },
  { id: "cc10x10", label: "CC 10×10", sqft: 100, type: "climate",  marketAvg: 131 },
  { id: "cc10x15", label: "CC 10×15", sqft: 150, type: "climate",  marketAvg: 160 },
  { id: "cc10x20", label: "CC 10×20", sqft: 200, type: "climate",  marketAvg: 195 },
  { id: "veh_sm",  label: "Vehicle S", sqft: 0,  type: "vehicle",  marketAvg: 65  },
  { id: "veh_md",  label: "Vehicle M", sqft: 0,  type: "vehicle",  marketAvg: 90  },
  { id: "veh_lg",  label: "Boat / RV", sqft: 0,  type: "vehicle",  marketAvg: 120 },
];

const UNITS_BY_TYPE = {
  standard: ["5x5","5x10","10x10","10x15","10x20","10x25","10x30"],
  climate:  ["cc5x5","cc5x10","cc10x10","cc10x15","cc10x20"],
  vehicle:  ["veh_sm","veh_md","veh_lg"],
};

function locationUnitIds(loc) {
  return loc.unitTypes.flatMap(t => UNITS_BY_TYPE[t]);
}

function buildInitialRates(loc) {
  const rates = {};
  for (const uid of locationUnitIds(loc)) {
    const def = UNIT_DEFS.find(u => u.id === uid);
    const base = def?.marketAvg || 80;
    rates[uid] = { street: base, web: Math.round(base * 0.88), total: 5, occupied: 4 };
  }
  return rates;
}

function buildAllInitialRates() {
  const all = {};
  for (const loc of LOCATIONS) all[loc.id] = buildInitialRates(loc);
  return all;
}

// ── Competitors ───────────────────────────────────────────────────────────────
const COMPETITORS = [
  { id: "extra_space", name: "Extra Space Storage", url: "https://www.extraspace.com",       rates: { "5x5":13, "5x10":38, "10x10":95, "10x15":115,"10x20":145,"cc10x10":125, promo:"1st month free online" }},
  { id: "public",      name: "Public Storage",       url: "https://www.publicstorage.com",    rates: { "5x5":50, "5x10":70, "10x10":95, "10x15":120,"10x20":150,"cc10x10":130, promo:"1st month $1" }},
  { id: "mini_price",  name: "Mini Price Storage",   url: "https://www.minipricestorage.com", rates: { "5x5":50, "5x10":65, "10x10":100,"10x15":130,"10x20":160,"cc10x10":110, promo:"Free CC; free truck" }},
  { id: "uhaul",       name: "U-Haul Self Storage",  url: "https://www.uhaul.com",            rates: { "5x5":35, "5x10":55, "10x10":80, "10x15":105,"10x20":130,"cc10x10":100, promo:"Varies by location" }},
  { id: "cubesmart",   name: "CubeSmart",            url: "https://www.cubesmart.com",        rates: { "5x5":45, "5x10":65, "10x10":99, "10x15":125,"10x20":155,"cc10x10":135, promo:"1st month free" }},
  { id: "life",        name: "Life Storage",         url: "https://www.lifestorage.com",      rates: { "5x5":48, "5x10":68, "10x10":105,"10x15":130,"10x20":160,"cc10x10":140, promo:"Online discounts" }},
  { id: "istorage",    name: "iStorage",             url: "https://www.istorage.com",         rates: { "5x5":40, "5x10":60, "10x10":90, "10x15":115,"10x20":145,"cc10x10":120, promo:"50% off 2 months" }},
];

// ── Logic ─────────────────────────────────────────────────────────────────────
function getOcc(u) { return u.total > 0 ? u.occupied / u.total : 0; }

function getAction(occ) {
  if (occ >= 0.92) return { label:"RAISE RATE",    color:"#22c55e", bg:"#052e16", icon:"▲" };
  if (occ >= 0.80) return { label:"HOLD",          color:"#facc15", bg:"#1c1917", icon:"●" };
  if (occ >= 0.75) return { label:"MONITOR",       color:"#fb923c", bg:"#1c0a00", icon:"⚠" };
  return               { label:"REDUCE / PROMO", color:"#f87171", bg:"#2d0a0a", icon:"▼" };
}

function getRecRate(street, occ) {
  if (occ >= 0.92) return Math.round(street * 1.05);
  if (occ >= 0.80) return street;
  if (occ >= 0.75) return Math.round(street * 0.95);
  return Math.round(street * 0.92);
}

function mktAvg(unitId, compRates) {
  const vals = Object.values(compRates).map(c => c[unitId]).filter(v => v > 0);
  return vals.length ? Math.round(vals.reduce((a,b) => a+b, 0) / vals.length) : 0;
}

// ── Global CSS ────────────────────────────────────────────────────────────────
const css = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#09090f}
  input:focus{outline:none;border-color:#c9a84c!important;box-shadow:0 0 0 2px rgba(201,168,76,0.2)}
  ::-webkit-scrollbar{width:5px;height:5px}
  ::-webkit-scrollbar-track{background:#111}
  ::-webkit-scrollbar-thumb{background:#2a2a2a;border-radius:3px}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  .fade{animation:fadeUp 0.3s ease forwards}
  button{transition:all 0.18s;cursor:pointer}
  button:hover{opacity:0.82;transform:translateY(-1px)}
  button:active{transform:translateY(0)}
`;

// ── Style helpers ─────────────────────────────────────────────────────────────
const S = {
  app:     { minHeight:"100vh", background:"#09090f", backgroundImage:"radial-gradient(ellipse 70% 40% at 50% -10%, rgba(201,168,76,0.12), transparent)", fontFamily:"'DM Sans',sans-serif", color:"#e2e2e6" },
  topbar:  { background:"rgba(9,9,15,0.96)", borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"0 1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:200, backdropFilter:"blur(14px)", height:60 },
  logo:    { fontFamily:"'Bebas Neue',sans-serif", fontSize:"1.5rem", color:"#c9a84c", letterSpacing:"0.08em", lineHeight:1 },
  logoSub: { fontSize:"0.6rem", color:"#4b5563", letterSpacing:"0.15em", textTransform:"uppercase" },
  nav:     { display:"flex", gap:"2px" },
  navBtn:  a => ({ padding:"0.35rem 0.9rem", borderRadius:6, border:"none", fontSize:"0.75rem", fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif", background:a?"#c9a84c":"transparent", color:a?"#09090f":"#6b7280" }),
  main:    { maxWidth:1440, margin:"0 auto", padding:"1.5rem" },
  card:    (border="rgba(255,255,255,0.07)") => ({ background:"rgba(255,255,255,0.025)", border:`1px solid ${border}`, borderRadius:12, padding:"1.25rem", marginBottom:"1.25rem" }),
  secTitle:(c="#c9a84c") => ({ fontFamily:"'Bebas Neue',sans-serif", fontSize:"1rem", color:c, letterSpacing:"0.1em", display:"flex", alignItems:"center", gap:"0.4rem", marginBottom:"0.85rem" }),
  th:      { background:"rgba(255,255,255,0.04)", color:"#6b7280", padding:"0.5rem 0.75rem", textAlign:"left", fontWeight:700, fontSize:"0.65rem", letterSpacing:"0.08em", textTransform:"uppercase", borderBottom:"1px solid rgba(255,255,255,0.07)", whiteSpace:"nowrap" },
  td:      alt => ({ padding:"0.5rem 0.75rem", borderBottom:"1px solid rgba(255,255,255,0.04)", background:alt?"rgba(255,255,255,0.015)":"transparent", verticalAlign:"middle" }),
  inp:     w => ({ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:5, padding:"0.28rem 0.4rem", color:"#93c5fd", fontFamily:"'DM Mono',monospace", fontSize:"0.82rem", width:w||70, textAlign:"center", outline:"none" }),
  badge:   (c,b) => ({ display:"inline-flex", alignItems:"center", gap:3, padding:"2px 7px", borderRadius:4, fontSize:"0.65rem", fontWeight:700, letterSpacing:"0.06em", color:c, background:b, whiteSpace:"nowrap" }),
  btn:     v => ({ padding:"0.5rem 1.1rem", borderRadius:7, border:v==="outline"?"1px solid rgba(201,168,76,0.35)":"none", fontSize:"0.75rem", fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif", background:v==="primary"?"#c9a84c":"transparent", color:v==="primary"?"#09090f":"#c9a84c" }),
  locTab:  (c,a) => ({ padding:"0.45rem 1rem", borderRadius:7, border:`1px solid ${a?c+"66":"rgba(255,255,255,0.08)"}`, fontSize:"0.78rem", fontWeight:700, fontFamily:"'DM Sans',sans-serif", background:a?`${c}18`:"transparent", color:a?c:"#6b7280", cursor:"pointer" }),
  kpiGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(175px,1fr))", gap:"0.85rem", marginBottom:"1.25rem" },
  kpiCard: c => ({ background:"rgba(255,255,255,0.025)", border:`1px solid ${c}22`, borderLeft:`3px solid ${c}`, borderRadius:10, padding:"1rem 1.2rem" }),
  kpiLbl:  { fontSize:"0.65rem", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#4b5563", marginBottom:3 },
  kpiVal:  c => ({ fontFamily:"'Bebas Neue',sans-serif", fontSize:"1.8rem", color:c, lineHeight:1 }),
  kpiSub:  { fontSize:"0.65rem", color:"#374151", marginTop:2 },
  aiBox:   { background:"rgba(201,168,76,0.04)", border:"1px solid rgba(201,168,76,0.18)", borderRadius:12, padding:"1.25rem", marginBottom:"1.25rem" },
  aiText:  { fontSize:"0.85rem", lineHeight:1.75, color:"#d1d5db", whiteSpace:"pre-wrap" },
};

// ── Components ────────────────────────────────────────────────────────────────
const Spinner = () => <span style={{display:"inline-block",width:13,height:13,border:"2px solid rgba(201,168,76,0.25)",borderTop:"2px solid #c9a84c",borderRadius:"50%",animation:"spin 0.7s linear infinite",verticalAlign:"middle"}} />;

function OccBar({ occ }) {
  const pct = Math.min(100, Math.round(occ * 100));
  const color = occ>=0.92?"#22c55e":occ>=0.80?"#facc15":"#f87171";
  return (
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <div style={{width:52,height:5,background:"#1f2937",borderRadius:3,overflow:"hidden"}}>
        <div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:3,transition:"width 0.3s"}} />
      </div>
      <span style={{fontFamily:"'DM Mono',monospace",fontSize:"0.75rem",color}}>{pct}%</span>
    </div>
  );
}

function LocationCard({ loc, rates }) {
  const unitIds = locationUnitIds(loc);
  const totalUnits = unitIds.reduce((a,id) => a+(rates[id]?.total||0), 0);
  const totalOcc   = unitIds.reduce((a,id) => a+(rates[id]?.occupied||0), 0);
  const occ = totalUnits>0 ? totalOcc/totalUnits : 0;
  const rev = unitIds.reduce((a,id) => a+(rates[id]?.occupied||0)*(rates[id]?.street||0), 0);
  const action = getAction(occ);
  return (
    <div style={{...S.kpiCard(loc.color), padding:"1.1rem"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
        <div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.1rem",color:loc.color,letterSpacing:"0.06em"}}>{loc.name}</div>
          <div style={{fontSize:"0.65rem",color:"#4b5563"}}>{loc.address}</div>
        </div>
        <span style={S.badge(action.color,action.bg)}>{action.icon} {action.label}</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginTop:6}}>
        <div>
          <div style={S.kpiLbl}>Occupancy</div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.4rem",color:action.color}}>{Math.round(occ*100)}%</div>
          <div style={{fontSize:"0.62rem",color:"#374151"}}>{totalOcc}/{totalUnits} units</div>
        </div>
        <div>
          <div style={S.kpiLbl}>Est. Revenue</div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.4rem",color:loc.color}}>${rev.toLocaleString()}</div>
          <div style={{fontSize:"0.62rem",color:"#374151"}}>per month</div>
        </div>
      </div>
      <div style={{marginTop:8}}><OccBar occ={occ} /></div>
    </div>
  );
}

function LocationRatesTable({ loc, rates, compRates, onChange }) {
  const typeLabels = { standard:"📦 Standard Units", climate:"🌡 Climate-Controlled", vehicle:"🚗 Vehicle / Boat / RV" };
  const typeColors = { standard:"#60a5fa", climate:"#67e8f9", vehicle:"#a3e635" };
  return (
    <div>
      {loc.unitTypes.map(type => {
        const defs = UNITS_BY_TYPE[type].map(id => UNIT_DEFS.find(u=>u.id===id)).filter(Boolean);
        return (
          <div key={type} style={{marginBottom:"1.5rem"}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"0.9rem",color:typeColors[type],letterSpacing:"0.1em",marginBottom:8,borderBottom:"1px solid rgba(255,255,255,0.06)",paddingBottom:4}}>
              {typeLabels[type]}
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.82rem"}}>
                <thead>
                  <tr>
                    {["Unit","Street $","Web $","Total Units","Occupied","Occupancy %","Market Avg","vs Market","Action","Rec. Rate"].map(h=>(
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {defs.map((def,idx) => {
                    const u = rates[def.id]||{street:def.marketAvg,web:Math.round(def.marketAvg*0.88),total:5,occupied:4};
                    const occ = getOcc(u);
                    const action = getAction(occ);
                    const rec = getRecRate(u.street,occ);
                    const mkt = mktAvg(def.id,compRates);
                    const diff = u.street-mkt;
                    const alt = idx%2===1;
                    return (
                      <tr key={def.id}>
                        <td style={{...S.td(alt),fontWeight:700,color:"#e2e2e6"}}>{def.label}</td>
                        {["street","web"].map(field=>(
                          <td key={field} style={S.td(alt)}>
                            <input style={S.inp(70)} value={u[field]}
                              onChange={e=>onChange(loc.id,def.id,field,e.target.value)}
                              onFocus={e=>e.target.select()} />
                          </td>
                        ))}
                        <td style={S.td(alt)}>
                          <input style={S.inp(55)} value={u.total}
                            onChange={e=>onChange(loc.id,def.id,"total",e.target.value)}
                            onFocus={e=>e.target.select()} />
                        </td>
                        <td style={S.td(alt)}>
                          <input style={S.inp(55)} value={u.occupied}
                            onChange={e=>onChange(loc.id,def.id,"occupied",e.target.value)}
                            onFocus={e=>e.target.select()} />
                        </td>
                        <td style={S.td(alt)}><OccBar occ={occ}/></td>
                        <td style={{...S.td(alt),fontFamily:"'DM Mono',monospace",color:"#6b7280"}}>{mkt>0?`$${mkt}`:"—"}</td>
                        <td style={{...S.td(alt),fontFamily:"'DM Mono',monospace",color:diff>12?"#f87171":diff<-5?"#22c55e":"#6b7280"}}>
                          {mkt>0?(diff>=0?"+":"")+diff:"—"}
                        </td>
                        <td style={S.td(alt)}><span style={S.badge(action.color,action.bg)}>{action.icon} {action.label}</span></td>
                        <td style={{...S.td(alt),fontFamily:"'DM Mono',monospace",fontWeight:700,color:rec!==u.street?"#c9a84c":"#4b5563"}}>
                          ${rec}
                          {rec!==u.street&&<span style={{fontSize:"0.62rem",marginLeft:3,color:rec>u.street?"#22c55e":"#f87171"}}>
                            ({rec>u.street?"+":""}{rec-u.street})
                          </span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]             = useState("dashboard");
  const [activeLoc, setActiveLoc] = useState("airport");
  const [allRates, setAllRates]   = useState(() => {
    try { const s=localStorage.getItem("ea_all_rates_v3"); return s?JSON.parse(s):buildAllInitialRates(); }
    catch { return buildAllInitialRates(); }
  });
  const [compRates, setCompRates] = useState(() => {
    try {
      const s = localStorage.getItem("ea_comp_rates_v3");
      if (s) return JSON.parse(s);
    } catch {}
    const init = {};
    for (const c of COMPETITORS) init[c.id] = { ...c.rates };
    return init;
  });
  const [aiAdvice, setAiAdvice]     = useState({});
  const [aiLoading, setAiLoading]   = useState(false);
  const [compAI, setCompAI]         = useState("");
  const [compLoading, setCompLoading] = useState(false);
  const [changeLog, setChangeLog]   = useState(() => {
    try { const s=localStorage.getItem("ea_log_v3"); return s?JSON.parse(s):[]; }
    catch { return []; }
  });

  useEffect(()=>{ localStorage.setItem("ea_all_rates_v3", JSON.stringify(allRates)); },[allRates]);
  useEffect(()=>{ localStorage.setItem("ea_comp_rates_v3", JSON.stringify(compRates)); },[compRates]);
  useEffect(()=>{ localStorage.setItem("ea_log_v3", JSON.stringify(changeLog)); },[changeLog]);

  const handleRateChange = useCallback((locId, unitId, field, value) => {
    const num = parseFloat(value)||0;
    setAllRates(prev => {
      const old = prev[locId]?.[unitId]?.[field];
      if ((field==="street"||field==="web") && old!==num) {
        const loc = LOCATIONS.find(l=>l.id===locId);
        const def = UNIT_DEFS.find(u=>u.id===unitId);
        setChangeLog(l => [{
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),
          location: loc?.name||locId,
          unit: def?.label||unitId,
          field: field==="street"?"Street Rate":"Web Rate",
          oldVal: old, newVal: num, change: num-old,
        }, ...l].slice(0,100));
      }
      return { ...prev, [locId]: { ...prev[locId], [unitId]: { ...prev[locId][unitId], [field]:num }}};
    });
  }, []);

  // Network totals
  const net = (() => {
    let u=0,o=0,r=0,a=0;
    for (const loc of LOCATIONS) {
      const rates = allRates[loc.id]||{};
      for (const uid of locationUnitIds(loc)) {
        const x = rates[uid]||{};
        u+=x.total||0; o+=x.occupied||0; r+=(x.occupied||0)*(x.street||0);
        const occ=(x.total||0)>0?(x.occupied||0)/(x.total||0):0;
        if(occ>=0.92||occ<0.75) a++;
      }
    }
    return { u,o, occ:u>0?o/u:0, r, a };
  })();

  const callAI = async (prompt, key, setLoading) => {
    setLoading(true);
    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, messages:[{role:"user",content:prompt}] })
      });
      const data = await res.json();
      const text = data.content?.map(b=>b.text||"").join("")||"Unable to generate response.";
      if (key==="comp") setCompAI(text);
      else setAiAdvice(prev=>({...prev,[key]:text}));
    } catch(e) {
      if(key==="comp") setCompAI("Connection error. Please try again.");
      else setAiAdvice(prev=>({...prev,[key]:"Connection error. Please try again."}));
    }
    setLoading(false);
  };

  const getNetworkAdvice = useCallback(() => {
    const locSummaries = LOCATIONS.map(loc => {
      const rates=allRates[loc.id]||{};
      const ids=locationUnitIds(loc);
      const totU=ids.reduce((a,id)=>a+(rates[id]?.total||0),0);
      const totO=ids.reduce((a,id)=>a+(rates[id]?.occupied||0),0);
      const occ=totU>0?Math.round(totO/totU*100):0;
      const rev=ids.reduce((a,id)=>a+(rates[id]?.occupied||0)*(rates[id]?.street||0),0);
      return `${loc.name} (${loc.address}): Occ=${occ}% Rev=$${rev.toLocaleString()}/mo Features:${loc.features.join(",")}`;
    }).join("\n");
    const prompt = `You are a self-storage revenue expert for Richmond, VA.\n\nExtra Attic Mini Storage — 4-Location Network:\n${locSummaries}\n\nNetwork: ${Math.round(net.occ*100)}% occupancy, $${net.r.toLocaleString()}/mo revenue\n\nTop competitors: ${COMPETITORS.slice(0,4).map(c=>`${c.name} 10x10=$${compRates[c.id]?.["10x10"]||"?"}`).join(", ")}\n\nDate: ${new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}\n\nProvide a network-level daily pricing briefing: 1) Which location needs most urgent attention and why, 2) Top 2 cross-location pricing opportunities, 3) One unified promo strategy, 4) Overall competitive position. ~250 words, specific dollar amounts.`;
    callAI(prompt, "network", setAiLoading);
  }, [allRates, compRates, net]);

  const getLocAdvice = useCallback((locId) => {
    const loc = LOCATIONS.find(l=>l.id===locId);
    const rates = allRates[locId]||{};
    const unitIds = locationUnitIds(loc);
    const unitSummary = unitIds.map(uid=>{
      const def=UNIT_DEFS.find(u=>u.id===uid);
      const u=rates[uid]||{};
      const occ=u.total>0?u.occupied/u.total:0;
      const mkt=mktAvg(uid,compRates);
      return `${def?.label}: Street=$${u.street} Web=$${u.web} Occ=${Math.round(occ*100)}% MktAvg=$${mkt||"N/A"}`;
    }).join("\n");
    const prompt = `Self-storage revenue expert, Richmond VA market.\n\nExtra Attic — ${loc.name} (${loc.address}, ${loc.city})\nFeatures: ${loc.features.join(", ")}\n\nUnits:\n${unitSummary}\n\nTop competitors: ${COMPETITORS.slice(0,4).map(c=>`${c.name}: 5x10=$${compRates[c.id]?.["5x10"]||"?"} 10x10=$${compRates[c.id]?.["10x10"]||"?"}`).join(", ")}\n\nDate: ${new Date().toLocaleDateString()}\n\nGive specific pricing advice for THIS location: 1) Top 2-3 rate actions with exact dollar amounts, 2) Any under/overpriced units vs market, 3) One promo tactic for this location. ~180 words.`;
    callAI(prompt, locId, setAiLoading);
  }, [allRates, compRates]);

  const getCompAI = useCallback(() => {
    const compSummary = COMPETITORS.map(c=>{
      const r=compRates[c.id]||{};
      return `${c.name}: 5x5=$${r["5x5"]} 5x10=$${r["5x10"]} 10x10=$${r["10x10"]} 10x20=$${r["10x20"]} CC10x10=$${r["cc10x10"]} Promo:"${r.promo}"`;
    }).join("\n");
    const ourAvg = ["5x10","10x10","10x20"].map(uid=>{
      const vals=LOCATIONS.flatMap(l=>allRates[l.id]?.[uid]?.street?[allRates[l.id][uid].street]:[]).filter(v=>v>0);
      return `${uid}=avg $${vals.length?Math.round(vals.reduce((a,b)=>a+b)/vals.length):0}`;
    }).join(", ");
    const prompt = `Richmond VA self-storage market analysis.\n\nCompetitors:\n${compSummary}\n\nExtra Attic avg rates: ${ourAvg}\n\nProvide: 1) Most aggressive competitor today, 2) Where Extra Attic is overpriced, 3) Where Extra Attic can raise rates, 4) Best promo tactic to match market. ~200 words.`;
    callAI(prompt, "comp", setCompLoading);
  }, [compRates, allRates]);

  const occColor = net.occ>=0.90?"#22c55e":net.occ>=0.80?"#facc15":"#f87171";

  return (
    <div style={S.app}>
      <style>{css}</style>

      {/* TOP BAR */}
      <div style={S.topbar}>
        <div>
          <div style={S.logo}>Extra Attic Mini Storage</div>
          <div style={S.logoSub}>Daily Pricing Intelligence · 4 Locations · Richmond, VA</div>
        </div>
        <nav style={S.nav}>
          {[["dashboard","📊 Dashboard"],["rates","🏷 Our Rates"],["competitors","🏪 Competitors"],["log","📅 Log"]].map(([id,label])=>(
            <button key={id} style={S.navBtn(tab===id)} onClick={()=>setTab(id)}>{label}</button>
          ))}
        </nav>
        <div style={{fontSize:"0.65rem",color:"#374151",textAlign:"right"}}>
          <div style={{color:"#c9a84c",fontWeight:700}}>{new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"})}</div>
          <div>{new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>
        </div>
      </div>

      <div style={S.main}>

        {/* ══ DASHBOARD ══ */}
        {tab==="dashboard"&&(
          <div className="fade">
            <div style={S.kpiGrid}>
              {[
                [occColor,"Network Occupancy",`${Math.round(net.occ*100)}%`,`${net.o}/${net.u} units · all 4 locations`],
                ["#a78bfa","Total Est. Revenue",`$${net.r.toLocaleString()}`,"per month across all locations"],
                ["#fb923c","Units Needing Action",`${net.a}`,"raise or reduce pricing"],
                ["#34d399","Active Locations","4","Airport · Patterson · Bethlehem · Springfield"],
              ].map(([c,lbl,val,sub])=>(
                <div key={lbl} style={S.kpiCard(c)}>
                  <div style={S.kpiLbl}>{lbl}</div>
                  <div style={S.kpiVal(c)}>{val}</div>
                  <div style={S.kpiSub}>{sub}</div>
                </div>
              ))}
            </div>

            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1rem",color:"#c9a84c",letterSpacing:"0.1em",marginBottom:"0.75rem"}}>📍 Location Snapshots</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:"0.85rem",marginBottom:"1.25rem"}}>
              {LOCATIONS.map(loc=><LocationCard key={loc.id} loc={loc} rates={allRates[loc.id]||{}} />)}
            </div>

            <div style={S.aiBox}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.85rem",flexWrap:"wrap",gap:"0.5rem"}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1rem",color:"#c9a84c",letterSpacing:"0.1em"}}>🤖 Network-Wide AI Strategy Briefing</div>
                <button style={S.btn("primary")} onClick={getNetworkAdvice} disabled={aiLoading}>
                  {aiLoading?<><Spinner/>&nbsp;Analyzing...</>:"⚡ Get AI Briefing"}
                </button>
              </div>
              {aiAdvice.network
                ?<div style={S.aiText}>{aiAdvice.network}</div>
                :<div style={{color:"#374151",fontSize:"0.82rem",fontStyle:"italic"}}>Click "Get AI Briefing" for a network-wide pricing strategy across all 4 locations — specific dollar amounts, which location needs attention, and what promos to run today.</div>
              }
            </div>

            {/* Quick Action by location */}
            <div style={S.card()}>
              <div style={S.secTitle()}>⚡ Pricing Action Summary</div>
              <div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap",marginBottom:"1rem"}}>
                {LOCATIONS.map(loc=>(
                  <button key={loc.id} style={S.locTab(loc.color,activeLoc===loc.id)} onClick={()=>setActiveLoc(loc.id)}>
                    ● {loc.name}
                  </button>
                ))}
              </div>
              {(() => {
                const loc=LOCATIONS.find(l=>l.id===activeLoc);
                const rates=allRates[activeLoc]||{};
                const unitIds=locationUnitIds(loc);
                return (
                  <div>
                    <div style={{fontSize:"0.72rem",color:"#4b5563",marginBottom:8}}>
                      {loc.address}, {loc.city} · {loc.phone} · {loc.features.join(" · ")}
                    </div>
                    <div style={{overflowX:"auto"}}>
                      <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.82rem"}}>
                        <thead><tr>{["Unit","Street $","Web $","Occupancy","Market Avg","vs Market","Action","Rec. Rate"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                        <tbody>
                          {unitIds.map((uid,idx)=>{
                            const def=UNIT_DEFS.find(u=>u.id===uid);
                            const u=rates[uid]||{street:80,web:70,total:5,occupied:4};
                            const occ=getOcc(u); const action=getAction(occ);
                            const rec=getRecRate(u.street,occ); const mkt=mktAvg(uid,compRates);
                            const diff=mkt>0?u.street-mkt:0; const alt=idx%2===1;
                            return (
                              <tr key={uid}>
                                <td style={{...S.td(alt),fontWeight:700,color:"#e2e2e6"}}>{def?.label}</td>
                                <td style={{...S.td(alt),fontFamily:"'DM Mono',monospace",color:"#93c5fd"}}>${u.street}</td>
                                <td style={{...S.td(alt),fontFamily:"'DM Mono',monospace",color:"#6b7280"}}>${u.web}</td>
                                <td style={S.td(alt)}><OccBar occ={occ}/></td>
                                <td style={{...S.td(alt),fontFamily:"'DM Mono',monospace",color:"#4b5563"}}>{mkt>0?`$${mkt}`:"—"}</td>
                                <td style={{...S.td(alt),fontFamily:"'DM Mono',monospace",color:diff>12?"#f87171":diff<-5?"#22c55e":"#6b7280"}}>{mkt>0?(diff>=0?"+":"")+diff:"—"}</td>
                                <td style={S.td(alt)}><span style={S.badge(action.color,action.bg)}>{action.icon} {action.label}</span></td>
                                <td style={{...S.td(alt),fontFamily:"'DM Mono',monospace",fontWeight:700,color:rec!==u.street?"#c9a84c":"#4b5563"}}>
                                  ${rec}{rec!==u.street&&<span style={{fontSize:"0.62rem",marginLeft:3,color:rec>u.street?"#22c55e":"#f87171"}}>({rec>u.street?"+":""}{rec-u.street})</span>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div style={{marginTop:"1rem",borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:"1rem"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                        <div style={{fontSize:"0.72rem",fontWeight:700,color:loc.color,letterSpacing:"0.08em",textTransform:"uppercase"}}>🤖 AI Advice — {loc.name}</div>
                        <button style={{...S.btn("outline"),padding:"0.3rem 0.7rem",fontSize:"0.7rem"}} onClick={()=>getLocAdvice(activeLoc)} disabled={aiLoading}>
                          {aiLoading?<Spinner/>:"Get Advice"}
                        </button>
                      </div>
                      {aiAdvice[activeLoc]
                        ?<div style={{...S.aiText,fontSize:"0.8rem"}}>{aiAdvice[activeLoc]}</div>
                        :<div style={{color:"#374151",fontSize:"0.78rem",fontStyle:"italic"}}>Click "Get Advice" for AI pricing recommendations specific to the {loc.name} location.</div>
                      }
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ══ OUR RATES ══ */}
        {tab==="rates"&&(
          <div className="fade">
            <div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap",marginBottom:"1.25rem"}}>
              {LOCATIONS.map(loc=>(
                <button key={loc.id} style={S.locTab(loc.color,activeLoc===loc.id)} onClick={()=>setActiveLoc(loc.id)}>● {loc.name}</button>
              ))}
            </div>
            {LOCATIONS.filter(l=>l.id===activeLoc).map(loc=>(
              <div key={loc.id}>
                <div style={{...S.card(`${loc.color}33`),marginBottom:"1rem"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"0.5rem"}}>
                    <div>
                      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.4rem",color:loc.color,letterSpacing:"0.06em"}}>Extra Attic — {loc.name}</div>
                      <div style={{fontSize:"0.8rem",color:"#6b7280"}}>{loc.address}, {loc.city}</div>
                      <div style={{fontSize:"0.78rem",color:"#4b5563",marginTop:2}}>{loc.phone} · {loc.email}</div>
                    </div>
                    <div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap"}}>
                      {loc.features.map(f=>(
                        <span key={f} style={{padding:"2px 8px",borderRadius:4,background:`${loc.color}18`,border:`1px solid ${loc.color}33`,fontSize:"0.68rem",color:loc.color,fontWeight:600}}>{f}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={S.card()}>
                  <div style={{...S.secTitle(loc.color),justifyContent:"space-between"}}>
                    <span>🏷 Rates & Occupancy — {loc.name}</span>
                    <span style={{fontSize:"0.68rem",color:"#4b5563",fontFamily:"'DM Sans',sans-serif",fontWeight:400,textTransform:"none",letterSpacing:0}}>Blue = editable · Changes auto-saved</span>
                  </div>
                  <LocationRatesTable loc={loc} rates={allRates[loc.id]||{}} compRates={compRates} onChange={handleRateChange} />
                </div>
                <div style={S.aiBox}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.75rem",flexWrap:"wrap",gap:"0.5rem"}}>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1rem",color:loc.color,letterSpacing:"0.1em"}}>🤖 AI Advice — {loc.name}</div>
                    <button style={S.btn("primary")} onClick={()=>getLocAdvice(loc.id)} disabled={aiLoading}>
                      {aiLoading?<><Spinner/>&nbsp;Analyzing...</>:"⚡ Analyze This Location"}
                    </button>
                  </div>
                  {aiAdvice[loc.id]
                    ?<div style={S.aiText}>{aiAdvice[loc.id]}</div>
                    :<div style={{color:"#374151",fontSize:"0.82rem",fontStyle:"italic"}}>Get AI-powered pricing recommendations specific to the {loc.name} location — based on your current occupancy and market data.</div>
                  }
                </div>
              </div>
            ))}
            <div style={S.card()}>
              <div style={S.secTitle()}>📏 Occupancy Pricing Rules</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:"0.7rem"}}>
                {[
                  ["≥ 92% occupied","#22c55e","#052e16","▲ RAISE +5%","Demand is high — increase street rate"],
                  ["80–91% occupied","#facc15","#1c1917","● HOLD","Current pricing is working well"],
                  ["75–79% occupied","#fb923c","#1c0a00","⚠ MONITOR","Consider a limited-time web promo"],
                  ["< 75% occupied","#f87171","#2d0a0a","▼ REDUCE -8%","Drop rate or run 1st month free"],
                ].map(([rule,c,b,action,desc])=>(
                  <div key={rule} style={{background:b,border:`1px solid ${c}33`,borderRadius:8,padding:"0.75rem",borderTop:`2px solid ${c}`}}>
                    <div style={{color:c,fontWeight:700,fontSize:"0.8rem"}}>{action}</div>
                    <div style={{color:c,fontSize:"0.7rem",fontFamily:"'DM Mono',monospace",margin:"3px 0"}}>{rule}</div>
                    <div style={{color:"#6b7280",fontSize:"0.72rem"}}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ COMPETITORS ══ */}
        {tab==="competitors"&&(
          <div className="fade">
            <div style={S.aiBox}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.85rem",flexWrap:"wrap",gap:"0.5rem"}}>
                <div style={S.secTitle()}>🤖 AI Competitive Analysis</div>
                <button style={S.btn("primary")} onClick={getCompAI} disabled={compLoading}>
                  {compLoading?<><Spinner/>&nbsp;Analyzing...</>:"🔍 Analyze Competition"}
                </button>
              </div>
              {compAI
                ?<div style={S.aiText}>{compAI}</div>
                :<div style={{color:"#374151",fontSize:"0.82rem",fontStyle:"italic"}}>Update competitor rates below, then click "Analyze Competition" for AI-powered competitive intelligence specific to the Richmond market.</div>
              }
            </div>
            <div style={S.card()}>
              <div style={{...S.secTitle(),justifyContent:"space-between",flexWrap:"wrap",gap:"0.5rem"}}>
                <span>📊 Competitor Rate Tracker</span>
                <div style={{display:"flex",gap:"0.4rem"}}>
                  {[["SpareFoot","https://www.sparefoot.com/self-storage/richmond-va.html"],["StorageCafe","https://www.storagecafe.com/storage-units/va/richmond/"]].map(([n,u])=>(
                    <a key={u} href={u} target="_blank" rel="noreferrer" style={{...S.btn("outline"),padding:"0.35rem 0.75rem",textDecoration:"none",display:"inline-block"}}>{n} →</a>
                  ))}
                </div>
              </div>
              <p style={{fontSize:"0.72rem",color:"#374151",marginBottom:"1rem"}}>Check each competitor's website daily and update rates. All changes auto-save.</p>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.82rem"}}>
                  <thead><tr>{["Competitor","5×5","5×10","10×10","10×15","10×20","CC 10×10","Current Promo","Visit"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {COMPETITORS.map((comp,idx)=>{
                      const r=compRates[comp.id]||{}; const alt=idx%2===1;
                      return (
                        <tr key={comp.id}>
                          <td style={{...S.td(alt),fontWeight:700,color:"#e2e2e6",whiteSpace:"nowrap"}}>{comp.name}</td>
                          {["5x5","5x10","10x10","10x15","10x20","cc10x10"].map(uid=>(
                            <td key={uid} style={S.td(alt)}>
                              <input style={S.inp(65)} value={r[uid]||""}
                                onChange={e=>setCompRates(prev=>({...prev,[comp.id]:{...prev[comp.id],[uid]:parseFloat(e.target.value)||0}}))}
                                onFocus={e=>e.target.select()} />
                            </td>
                          ))}
                          <td style={{...S.td(alt),minWidth:140}}>
                            <input style={{...S.inp(130),width:"100%",textAlign:"left",padding:"0.28rem 0.5rem",color:"#d1d5db"}}
                              value={r.promo||""}
                              onChange={e=>setCompRates(prev=>({...prev,[comp.id]:{...prev[comp.id],promo:e.target.value}}))} />
                          </td>
                          <td style={S.td(alt)}>
                            <a href={comp.url} target="_blank" rel="noreferrer" style={{color:"#c9a84c",fontSize:"0.75rem",textDecoration:"none"}}>Visit →</a>
                          </td>
                        </tr>
                      );
                    })}
                    <tr style={{background:"rgba(201,168,76,0.06)"}}>
                      <td style={{...S.td(false),fontWeight:700,color:"#c9a84c"}}>Market Average</td>
                      {["5x5","5x10","10x10","10x15","10x20","cc10x10"].map(uid=>(
                        <td key={uid} style={{...S.td(false),fontFamily:"'DM Mono',monospace",fontWeight:700,color:"#c9a84c"}}>${mktAvg(uid,compRates)||"—"}</td>
                      ))}
                      <td style={S.td(false)} colSpan={2}/>
                    </tr>
                    <tr style={{background:"rgba(34,197,94,0.05)"}}>
                      <td style={{...S.td(false),fontWeight:700,color:"#22c55e"}}>Extra Attic (Network Avg)</td>
                      {["5x5","5x10","10x10","10x15","10x20","cc10x10"].map(uid=>{
                        const vals=LOCATIONS.flatMap(l=>allRates[l.id]?.[uid]?.street?[allRates[l.id][uid].street]:[]).filter(v=>v>0);
                        const avg=vals.length?Math.round(vals.reduce((a,b)=>a+b)/vals.length):0;
                        const mkt=mktAvg(uid,compRates); const diff=avg&&mkt?avg-mkt:0;
                        return (
                          <td key={uid} style={{...S.td(false),fontFamily:"'DM Mono',monospace",fontWeight:700}}>
                            {avg?<><span style={{color:"#22c55e"}}>${avg}</span>{mkt>0&&<span style={{fontSize:"0.62rem",marginLeft:3,color:diff>10?"#f87171":diff<-5?"#22c55e":"#6b7280"}}>({diff>=0?"+":""}{diff})</span>}</>:"—"}
                          </td>
                        );
                      })}
                      <td style={S.td(false)} colSpan={2}/>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div style={S.card()}>
              <div style={S.secTitle()}>🔗 Quick Access Links</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:"0.5rem"}}>
                {[["SpareFoot Richmond","https://www.sparefoot.com/self-storage/richmond-va.html"],
                  ["StorageCafe Richmond","https://www.storagecafe.com/storage-units/va/richmond/"],
                  ...COMPETITORS.map(c=>[c.name,c.url])
                ].map(([name,url])=>(
                  <a key={url} href={url} target="_blank" rel="noreferrer"
                    style={{padding:"0.38rem 0.85rem",borderRadius:6,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:"#c9a84c",fontSize:"0.75rem",textDecoration:"none",fontWeight:600}}>
                    {name} →
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ LOG ══ */}
        {tab==="log"&&(
          <div className="fade">
            <div style={S.card()}>
              <div style={{...S.secTitle(),justifyContent:"space-between"}}>
                <span>📅 Rate Change History</span>
                {changeLog.length>0&&<button style={{...S.btn("outline"),padding:"0.3rem 0.7rem",fontSize:"0.7rem"}} onClick={()=>{if(window.confirm("Clear all history?"))setChangeLog([])}}>Clear Log</button>}
              </div>
              {changeLog.length===0
                ?<p style={{color:"#374151",fontSize:"0.82rem",fontStyle:"italic"}}>No rate changes yet. Changes auto-log when you update street or web rates.</p>
                :<div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.82rem"}}>
                    <thead><tr>{["Date","Time","Location","Unit","Field","Old Rate","New Rate","Change"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {changeLog.map((e,idx)=>{
                        const loc=LOCATIONS.find(l=>l.name===e.location);
                        return (
                          <tr key={idx}>
                            <td style={{...S.td(idx%2===1),fontFamily:"'DM Mono',monospace",fontSize:"0.75rem",color:"#6b7280"}}>{e.date}</td>
                            <td style={{...S.td(idx%2===1),fontFamily:"'DM Mono',monospace",fontSize:"0.75rem",color:"#4b5563"}}>{e.time}</td>
                            <td style={{...S.td(idx%2===1),fontWeight:700,color:loc?.color||"#e2e2e6"}}>{e.location}</td>
                            <td style={{...S.td(idx%2===1),fontWeight:600}}>{e.unit}</td>
                            <td style={{...S.td(idx%2===1),fontSize:"0.75rem",color:"#6b7280"}}>{e.field}</td>
                            <td style={{...S.td(idx%2===1),fontFamily:"'DM Mono',monospace",color:"#4b5563"}}>${e.oldVal}</td>
                            <td style={{...S.td(idx%2===1),fontFamily:"'DM Mono',monospace",color:"#93c5fd",fontWeight:700}}>${e.newVal}</td>
                            <td style={{...S.td(idx%2===1),fontFamily:"'DM Mono',monospace",fontWeight:700,color:e.change>0?"#22c55e":"#f87171"}}>
                              {e.change>0?"+":""}{e.change} ({e.change>0?"+":""}{Math.round((e.change/e.oldVal)*100)}%)
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              }
            </div>
            <div style={S.card()}>
              <div style={S.secTitle()}>📍 Location Directory</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:"0.85rem"}}>
                {LOCATIONS.map(loc=>(
                  <div key={loc.id} style={{background:`${loc.color}08`,border:`1px solid ${loc.color}22`,borderRadius:8,padding:"0.9rem",borderLeft:`3px solid ${loc.color}`}}>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1rem",color:loc.color,letterSpacing:"0.06em",marginBottom:4}}>{loc.name}</div>
                    <div style={{fontSize:"0.75rem",color:"#6b7280",lineHeight:1.7}}>
                      <div>{loc.address}</div><div>{loc.city}</div>
                      <div style={{color:loc.color,marginTop:2}}>{loc.phone}</div>
                      <div style={{color:"#4b5563"}}>{loc.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={S.card()}>
              <div style={S.secTitle()}>📆 Richmond Seasonal Pricing Calendar</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(195px,1fr))",gap:"0.7rem"}}>
                {[["Jan–Feb","❄️","SLOW","Lowest demand. Run 1st month free promos. Push online visibility.","#60a5fa"],
                  ["Mar–May","🌸","RISING","Spring moves begin. Tighten promos. Raise 10×10+ as occupancy rises.","#a3e635"],
                  ["Jun–Aug","☀️","PEAK","Highest demand. Price at/above market. Eliminate promos. CC units surge.","#22c55e"],
                  ["Sep–Oct","🍂","HOLD","Secondary peak. Hold rates. Watch for competitor drops.","#fb923c"],
                  ["Nov–Dec","🎄","MODERATE","Holiday uptick. Small unit promos. Maintain large unit rates.","#c084fc"],
                ].map(([m,emoji,level,desc,color])=>(
                  <div key={m} style={{background:"rgba(255,255,255,0.02)",border:`1px solid ${color}22`,borderRadius:8,padding:"0.75rem",borderTop:`2px solid ${color}`}}>
                    <div style={{fontSize:"1rem",marginBottom:3}}>{emoji}</div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"0.85rem",color,letterSpacing:"0.06em"}}>{m} — {level}</div>
                    <div style={{fontSize:"0.72rem",color:"#4b5563",marginTop:3,lineHeight:1.5}}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
