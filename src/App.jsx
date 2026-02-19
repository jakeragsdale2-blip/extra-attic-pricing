import { useState, useEffect, useCallback } from "react";

const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap";
document.head.appendChild(fontLink);

// ── Locations ─────────────────────────────────────────────────────────────────
const LOCATIONS = [
  { id:"airport",    name:"Airport",    address:"5730 Williamsburg Rd", city:"Sandston, VA 23150",   phone:"(804) 626-5365", email:"airport@extraattic.net",    color:"#60a5fa", features:["Drive-Up Access","Ground-Level Units","Near I-64 & I-295"],                unitTypes:["standard"] },
  { id:"patterson",  name:"Patterson",  address:"10551 Patterson Ave",  city:"Richmond, VA 23238",   phone:"(804) 492-0973", email:"patterson@extraattic.net",   color:"#a78bfa", features:["Climate Controlled","Ground-Level Units","Near Short Pump"],               unitTypes:["standard","climate"] },
  { id:"bethlehem",  name:"Bethlehem",  address:"4825 Bethlehem Rd",    city:"Richmond, VA 23230",   phone:"(804) 993-8572", email:"bethlehem@extraattic.net",   color:"#34d399", features:["Climate Controlled","Wine Storage","Boat & RV Parking","Near I-64"],      unitTypes:["standard","climate","vehicle"] },
  { id:"springfield",name:"Springfield",address:"3901 Springfield Rd",  city:"Glen Allen, VA 23060", phone:"(804) 376-5751", email:"springfield@extraattic.net", color:"#fb923c", features:["Climate Controlled","Drive-Up & Interior","No Admin Fees","Online Rental"],unitTypes:["standard","climate"] },
];

const UNIT_DEFS = [
  { id:"5x5",     label:"5×5",       type:"standard", marketAvg:50  },
  { id:"5x10",    label:"5×10",      type:"standard", marketAvg:70  },
  { id:"10x10",   label:"10×10",     type:"standard", marketAvg:105 },
  { id:"10x15",   label:"10×15",     type:"standard", marketAvg:135 },
  { id:"10x20",   label:"10×20",     type:"standard", marketAvg:165 },
  { id:"10x25",   label:"10×25",     type:"standard", marketAvg:195 },
  { id:"10x30",   label:"10×30",     type:"standard", marketAvg:235 },
  { id:"cc5x5",   label:"CC 5×5",    type:"climate",  marketAvg:55  },
  { id:"cc5x10",  label:"CC 5×10",   type:"climate",  marketAvg:85  },
  { id:"cc10x10", label:"CC 10×10",  type:"climate",  marketAvg:131 },
  { id:"cc10x15", label:"CC 10×15",  type:"climate",  marketAvg:160 },
  { id:"cc10x20", label:"CC 10×20",  type:"climate",  marketAvg:195 },
  { id:"veh_sm",  label:"Vehicle S", type:"vehicle",  marketAvg:65  },
  { id:"veh_md",  label:"Vehicle M", type:"vehicle",  marketAvg:90  },
  { id:"veh_lg",  label:"Boat/RV",   type:"vehicle",  marketAvg:120 },
];

const UNITS_BY_TYPE = {
  standard:["5x5","5x10","10x10","10x15","10x20","10x25","10x30"],
  climate: ["cc5x5","cc5x10","cc10x10","cc10x15","cc10x20"],
  vehicle: ["veh_sm","veh_md","veh_lg"],
};

const COMPETITORS = [
  { id:"extra_space", name:"Extra Space",   url:"https://www.extraspace.com",       rates:{"5x5":13,"5x10":38,"10x10":95, "10x15":115,"10x20":145,"cc10x10":125,promo:"1st month free online"} },
  { id:"public",      name:"Public Storage",url:"https://www.publicstorage.com",    rates:{"5x5":50,"5x10":70,"10x10":95, "10x15":120,"10x20":150,"cc10x10":130,promo:"1st month $1"} },
  { id:"mini_price",  name:"Mini Price",    url:"https://www.minipricestorage.com", rates:{"5x5":50,"5x10":65,"10x10":100,"10x15":130,"10x20":160,"cc10x10":110,promo:"Free CC; free truck"} },
  { id:"uhaul",       name:"U-Haul",        url:"https://www.uhaul.com",            rates:{"5x5":35,"5x10":55,"10x10":80, "10x15":105,"10x20":130,"cc10x10":100,promo:"Varies by location"} },
  { id:"cubesmart",   name:"CubeSmart",     url:"https://www.cubesmart.com",        rates:{"5x5":45,"5x10":65,"10x10":99, "10x15":125,"10x20":155,"cc10x10":135,promo:"1st month free"} },
  { id:"life",        name:"Life Storage",  url:"https://www.lifestorage.com",      rates:{"5x5":48,"5x10":68,"10x10":105,"10x15":130,"10x20":160,"cc10x10":140,promo:"Online discounts"} },
  { id:"istorage",    name:"iStorage",      url:"https://www.istorage.com",         rates:{"5x5":40,"5x10":60,"10x10":90, "10x15":115,"10x20":145,"cc10x10":120,promo:"50% off 2 months"} },
];

// Seasonal multipliers Jan–Dec
const SEASONAL_MULT  = [0.92,0.93,0.97,1.02,1.06,1.10,1.12,1.10,1.05,1.03,0.97,0.95];
const SEASONAL_LABEL = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const SEASONAL_STATUS= ["Slow","Slow","Rising","Rising","Rising","Peak","Peak","Peak","Hold","Hold","Moderate","Moderate"];

// ── Helpers ───────────────────────────────────────────────────────────────────
const locUnits = loc => loc.unitTypes.flatMap(t => UNITS_BY_TYPE[t]);

function buildInitRates(loc) {
  const r = {};
  for (const uid of locUnits(loc)) {
    const d = UNIT_DEFS.find(u => u.id === uid);
    const base = d?.marketAvg || 80;
    r[uid] = { street:base, web:Math.round(base*0.88), total:5, occupied:4, waitlist:0 };
  }
  return r;
}
function buildAllRates() { const a={}; for (const l of LOCATIONS) a[l.id]=buildInitRates(l); return a; }

function getOcc(u)  { return u.total > 0 ? u.occupied / u.total : 0; }
function getAction(occ) {
  if (occ>=0.92) return { label:"RAISE RATE",   color:"#22c55e", bg:"#052e16", icon:"▲" };
  if (occ>=0.80) return { label:"HOLD",         color:"#facc15", bg:"#1c1917", icon:"●" };
  if (occ>=0.75) return { label:"MONITOR",      color:"#fb923c", bg:"#1c0a00", icon:"⚠" };
  return               { label:"REDUCE/PROMO", color:"#f87171", bg:"#2d0a0a", icon:"▼" };
}
function getRecRate(street, occ) {
  const mult = SEASONAL_MULT[new Date().getMonth()];
  if (occ>=0.92) return Math.round(street * 1.05 * mult);
  if (occ>=0.80) return Math.round(street * mult);
  if (occ>=0.75) return Math.round(street * 0.95);
  return Math.round(street * 0.92);
}
function mktAvg(uid, compRates) {
  const vals = Object.values(compRates).map(c=>c[uid]).filter(v=>v>0);
  return vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) : 0;
}
function forecastRevenue(allRates, months) {
  const now = new Date();
  return Array.from({length:months},(_,i)=>{
    const mo = (now.getMonth()+i)%12;
    const mult = SEASONAL_MULT[mo];
    let rev = 0;
    for (const loc of LOCATIONS) {
      const rates = allRates[loc.id]||{};
      for (const uid of locUnits(loc)) {
        const u = rates[uid]||{};
        const projOcc = Math.min(1, getOcc(u)*mult);
        rev += Math.round(projOcc*(u.total||0))*(u.street||0);
      }
    }
    return { month:SEASONAL_LABEL[mo], rev:Math.round(rev), mult, status:SEASONAL_STATUS[mo] };
  });
}
function getCompAlerts(allRates, compRates) {
  const alerts = [];
  const CHECK = ["5x5","5x10","10x10","10x15","10x20","cc10x10"];
  for (const uid of CHECK) {
    const def = UNIT_DEFS.find(u=>u.id===uid);
    for (const comp of COMPETITORS) {
      const cp = compRates[comp.id]?.[uid]||0;
      if (!cp) continue;
      for (const loc of LOCATIONS) {
        if (!locUnits(loc).includes(uid)) continue;
        const op = allRates[loc.id]?.[uid]?.street||0;
        if (!op) continue;
        const diff = op-cp;
        const pct = Math.round((diff/op)*100);
        if (pct>12) alerts.push({loc:loc.name,locColor:loc.color,unit:def?.label||uid,ourPrice:op,compPrice:cp,comp:comp.name,diff,pct});
      }
    }
  }
  return alerts.sort((a,b)=>b.pct-a.pct).slice(0,8);
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#09090f}
  input,select{outline:none}
  input:focus,select:focus{border-color:#c9a84c!important;box-shadow:0 0 0 2px rgba(201,168,76,0.15)}
  ::-webkit-scrollbar{width:5px;height:5px}
  ::-webkit-scrollbar-track{background:#0d0d14}
  ::-webkit-scrollbar-thumb{background:#252535;border-radius:3px}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
  .fade{animation:fadeUp 0.3s ease forwards}
  button{transition:all 0.15s;cursor:pointer}
  button:hover:not(:disabled){opacity:0.82;transform:translateY(-1px)}
  button:active{transform:translateY(0)}
  button:disabled{opacity:0.5;cursor:default}
`;

// ── Style tokens ──────────────────────────────────────────────────────────────
const T = {
  app:     { minHeight:"100vh", background:"#09090f", backgroundImage:"radial-gradient(ellipse 70% 40% at 50% -10%,rgba(201,168,76,0.09),transparent)", fontFamily:"'DM Sans',sans-serif", color:"#e2e2e6" },
  topbar:  { background:"rgba(9,9,15,0.97)", borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"0 1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:200, backdropFilter:"blur(16px)", height:60, gap:"1rem" },
  logo:    { fontFamily:"'Bebas Neue',sans-serif", fontSize:"1.45rem", color:"#c9a84c", letterSpacing:"0.08em", lineHeight:1 },
  logoSub: { fontSize:"0.58rem", color:"#4b5563", letterSpacing:"0.14em", textTransform:"uppercase" },
  nav:     { display:"flex", gap:"2px", flexWrap:"wrap" },
  navBtn:  a => ({ padding:"0.32rem 0.8rem", borderRadius:6, border:"none", fontSize:"0.7rem", fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif", background:a?"#c9a84c":"transparent", color:a?"#09090f":"#6b7280" }),
  main:    { maxWidth:1440, margin:"0 auto", padding:"1.5rem" },
  card:    (b="rgba(255,255,255,0.07)") => ({ background:"rgba(255,255,255,0.022)", border:`1px solid ${b}`, borderRadius:12, padding:"1.25rem", marginBottom:"1.25rem" }),
  secH:    (c="#c9a84c") => ({ fontFamily:"'Bebas Neue',sans-serif", fontSize:"0.95rem", color:c, letterSpacing:"0.1em", marginBottom:"0.85rem" }),
  th:      { background:"rgba(255,255,255,0.03)", color:"#6b7280", padding:"0.48rem 0.7rem", textAlign:"left", fontWeight:700, fontSize:"0.62rem", letterSpacing:"0.08em", textTransform:"uppercase", borderBottom:"1px solid rgba(255,255,255,0.06)", whiteSpace:"nowrap" },
  td:      a => ({ padding:"0.48rem 0.7rem", borderBottom:"1px solid rgba(255,255,255,0.04)", background:a?"rgba(255,255,255,0.01)":"transparent", verticalAlign:"middle" }),
  inp:     (w,left) => ({ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:5, padding:"0.26rem 0.4rem", color:"#93c5fd", fontFamily:"'DM Mono',monospace", fontSize:"0.8rem", width:w||70, textAlign:left?"left":"center" }),
  sel:     w => ({ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:5, padding:"0.26rem 0.4rem", color:"#e2e2e6", fontFamily:"'DM Sans',sans-serif", fontSize:"0.8rem", width:w||120, cursor:"pointer" }),
  badge:   (c,b) => ({ display:"inline-flex", alignItems:"center", gap:3, padding:"2px 7px", borderRadius:4, fontSize:"0.62rem", fontWeight:700, letterSpacing:"0.06em", color:c, background:b, whiteSpace:"nowrap" }),
  btn:     v => ({ padding:"0.48rem 1rem", borderRadius:7, border:v==="outline"?"1px solid rgba(201,168,76,0.35)":"none", fontSize:"0.73rem", fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif", background:v==="primary"?"#c9a84c":"transparent", color:v==="primary"?"#09090f":"#c9a84c" }),
  locTab:  (c,a) => ({ padding:"0.38rem 0.85rem", borderRadius:7, border:`1px solid ${a?c+"55":"rgba(255,255,255,0.08)"}`, fontSize:"0.73rem", fontWeight:700, fontFamily:"'DM Sans',sans-serif", background:a?`${c}15`:"transparent", color:a?c:"#6b7280", cursor:"pointer" }),
  kpiGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(168px,1fr))", gap:"0.8rem", marginBottom:"1.25rem" },
  kpiCard: c => ({ background:"rgba(255,255,255,0.022)", border:`1px solid ${c}20`, borderLeft:`3px solid ${c}`, borderRadius:10, padding:"0.9rem 1.1rem" }),
  kpiLbl:  { fontSize:"0.6rem", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#4b5563", marginBottom:3 },
  kpiVal:  c => ({ fontFamily:"'Bebas Neue',sans-serif", fontSize:"1.75rem", color:c, lineHeight:1 }),
  kpiSub:  { fontSize:"0.6rem", color:"#374151", marginTop:2 },
  aiBox:   { background:"rgba(201,168,76,0.04)", border:"1px solid rgba(201,168,76,0.18)", borderRadius:12, padding:"1.25rem", marginBottom:"1.25rem" },
  aiText:  { fontSize:"0.84rem", lineHeight:1.78, color:"#d1d5db", whiteSpace:"pre-wrap" },
};

const Spinner = () => (
  <span style={{display:"inline-block",width:13,height:13,border:"2px solid rgba(201,168,76,0.25)",borderTop:"2px solid #c9a84c",borderRadius:"50%",animation:"spin 0.7s linear infinite",verticalAlign:"middle"}}/>
);

function OccBar({ occ, w=52 }) {
  const pct = Math.min(100,Math.round(occ*100));
  const c = occ>=0.92?"#22c55e":occ>=0.80?"#facc15":"#f87171";
  return (
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <div style={{width:w,height:5,background:"#1f2937",borderRadius:3,overflow:"hidden"}}>
        <div style={{width:`${pct}%`,height:"100%",background:c,borderRadius:3,transition:"width 0.4s"}}/>
      </div>
      <span style={{fontFamily:"'DM Mono',monospace",fontSize:"0.72rem",color:c}}>{pct}%</span>
    </div>
  );
}

function Sparkline({ data, color="#c9a84c", w=80, h=28 }) {
  if (!data||data.length<2) return <span style={{fontSize:"0.65rem",color:"#374151",fontStyle:"italic"}}>Accumulating...</span>;
  const max=Math.max(...data), min=Math.min(...data), range=max-min||1;
  const pts = data.map((v,i)=>`${(i/(data.length-1))*w},${h-((v-min)/range)*h}`).join(" ");
  const lx=(data.length-1)/(data.length-1)*w, ly=h-((data[data.length-1]-min)/range)*h;
  return (
    <svg width={w} height={h} style={{display:"block"}}>
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" points={pts}/>
      <circle cx={lx} cy={ly} r="2.5" fill={color}/>
    </svg>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const TABS = [
    ["dashboard","📊 Dashboard"],["rates","🏷 Rates"],["dynamic","⚡ Dynamic"],
    ["activity","📋 Activity"],["forecast","📈 Forecast"],["competitors","🏪 Competitors"],["log","📅 Log"],
  ];

  const [tab, setTab]             = useState("dashboard");
  const [activeLoc, setActiveLoc] = useState("airport");

  // Persistent state
  const [allRates, setAllRates]   = useState(()=>{ try{const s=localStorage.getItem("ea5_rates");return s?JSON.parse(s):buildAllRates();}catch{return buildAllRates();} });
  const [compRates, setCompRates] = useState(()=>{ try{const s=localStorage.getItem("ea5_comp");if(s)return JSON.parse(s);}catch{}const i={};for(const c of COMPETITORS)i[c.id]={...c.rates};return i; });
  const [changeLog, setChangeLog] = useState(()=>{ try{const s=localStorage.getItem("ea5_log");return s?JSON.parse(s):[];}catch{return[];} });
  const [promos, setPromos]       = useState(()=>{ try{const s=localStorage.getItem("ea5_promos");return s?JSON.parse(s):[];}catch{return[];} });
  const [activity, setActivity]   = useState(()=>{ try{const s=localStorage.getItem("ea5_activity");return s?JSON.parse(s):[];}catch{return[];} });
  const [occHist, setOccHist]     = useState(()=>{ try{const s=localStorage.getItem("ea5_occhist");return s?JSON.parse(s):{};}catch{return{};} });

  // AI state
  const [aiAdvice, setAiAdvice]   = useState({});
  const [aiLoading, setAiLoading] = useState(false);
  const [compAI, setCompAI]       = useState("");
  const [compLoading, setCompLoading] = useState(false);
  const [briefingDate, setBriefingDate] = useState(()=>localStorage.getItem("ea5_briefing_date")||"");

  // New entry forms
  const [newPromo, setNewPromo]       = useState({locId:"airport",unitId:"10x10",desc:"",discount:"",expiry:""});
  const [newActivity, setNewActivity] = useState({locId:"airport",type:"move_in",unitId:"10x10",note:""});

  useEffect(()=>{ localStorage.setItem("ea5_rates",JSON.stringify(allRates)); },[allRates]);
  useEffect(()=>{ localStorage.setItem("ea5_comp",JSON.stringify(compRates)); },[compRates]);
  useEffect(()=>{ localStorage.setItem("ea5_log",JSON.stringify(changeLog)); },[changeLog]);
  useEffect(()=>{ localStorage.setItem("ea5_promos",JSON.stringify(promos)); },[promos]);
  useEffect(()=>{ localStorage.setItem("ea5_activity",JSON.stringify(activity)); },[activity]);
  useEffect(()=>{ localStorage.setItem("ea5_occhist",JSON.stringify(occHist)); },[occHist]);

  // Auto-snapshot occupancy daily
  useEffect(()=>{
    const today = new Date().toLocaleDateString();
    setOccHist(prev=>{
      const next = {...prev};
      for (const loc of LOCATIONS) {
        const ids = locUnits(loc);
        const rates = allRates[loc.id]||{};
        const totU = ids.reduce((a,id)=>a+(rates[id]?.total||0),0);
        const totO = ids.reduce((a,id)=>a+(rates[id]?.occupied||0),0);
        const occ  = totU>0?Math.round(totO/totU*100):0;
        if (!next[loc.id]) next[loc.id]=[];
        const last = next[loc.id][next[loc.id].length-1];
        if (!last||last.date!==today) next[loc.id]=[...next[loc.id],{date:today,occ}].slice(-30);
      }
      return next;
    });
  },[allRates]);

  // Rate change handler
  const handleRate = useCallback((locId,unitId,field,value)=>{
    const num = parseFloat(value)||0;
    setAllRates(prev=>{
      const old = prev[locId]?.[unitId]?.[field];
      if ((field==="street"||field==="web") && old!==num) {
        const loc=LOCATIONS.find(l=>l.id===locId);
        const def=UNIT_DEFS.find(u=>u.id===unitId);
        setChangeLog(l=>[{
          date:new Date().toLocaleDateString(),
          time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),
          location:loc?.name||locId, unit:def?.label||unitId,
          field:field==="street"?"Street Rate":"Web Rate",
          oldVal:old, newVal:num, change:num-old,
        },...l].slice(0,100));
      }
      return {...prev,[locId]:{...prev[locId],[unitId]:{...prev[locId][unitId],[field]:num}}};
    });
  },[]);

  // Network totals
  const net = (()=>{
    let u=0,o=0,r=0,a=0,wl=0;
    for (const loc of LOCATIONS) {
      const rates=allRates[loc.id]||{};
      for (const uid of locUnits(loc)) {
        const x=rates[uid]||{};
        u+=x.total||0; o+=x.occupied||0; r+=(x.occupied||0)*(x.street||0); wl+=x.waitlist||0;
        const occ=(x.total||0)>0?(x.occupied||0)/(x.total||0):0;
        if (occ>=0.92||occ<0.75) a++;
      }
    }
    return {u,o,occ:u>0?o/u:0,r,a,wl};
  })();

  const mo           = new Date().getMonth();
  const seasonMult   = SEASONAL_MULT[mo];
  const seasonStatus = SEASONAL_STATUS[mo];
  const compAlerts   = getCompAlerts(allRates,compRates);
  const forecast6    = forecastRevenue(allRates,6);
  const activePromos = promos.filter(p=>p.active);
  const todayStr     = new Date().toDateString();
  const briefingDone = briefingDate===todayStr;
  const occColor     = net.occ>=0.90?"#22c55e":net.occ>=0.80?"#facc15":"#f87171";

  // ── AI helper ────────────────────────────────────────────────────────────────
  const callAI = async (prompt, key, setLoad) => {
    setLoad(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "x-api-key":import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version":"2023-06-01",
          "anthropic-dangerous-direct-browser-access":"true",
        },
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1200,messages:[{role:"user",content:prompt}]}),
      });
      const data = await res.json();
      const text = data.content?.map(b=>b.text||"").join("")||"Unable to generate response.";
      if (key==="comp") setCompAI(text);
      else setAiAdvice(prev=>({...prev,[key]:text}));
    } catch {
      const msg = "Connection error. Please try again.";
      if (key==="comp") setCompAI(msg);
      else setAiAdvice(prev=>({...prev,[key]:msg}));
    }
    setLoad(false);
  };

  const getDailyBriefing = useCallback(()=>{
    const locLines = LOCATIONS.map(loc=>{
      const rates=allRates[loc.id]||{};
      const ids=locUnits(loc);
      const totU=ids.reduce((a,id)=>a+(rates[id]?.total||0),0);
      const totO=ids.reduce((a,id)=>a+(rates[id]?.occupied||0),0);
      const occ=totU>0?Math.round(totO/totU*100):0;
      const rev=ids.reduce((a,id)=>a+(rates[id]?.occupied||0)*(rates[id]?.street||0),0);
      const wl=ids.reduce((a,id)=>a+(rates[id]?.waitlist||0),0);
      return `${loc.name}: Occ=${occ}% Rev=$${rev.toLocaleString()}/mo Waitlist=${wl}`;
    }).join("\n");
    const alertLines = compAlerts.length>0
      ? compAlerts.slice(0,3).map(a=>`${a.loc} ${a.unit}: ours $${a.ourPrice} vs ${a.comp} $${a.compPrice} (${a.pct}% higher)`).join("; ")
      : "No major alerts";
    const promoLines = activePromos.map(p=>`${p.locId} ${p.unitId}: ${p.desc}`).join("; ")||"None active";
    const actLines   = activity.slice(0,5).map(a=>`${a.type==="move_in"?"IN":"OUT"} ${a.locId} ${a.unitId}`).join(", ")||"None logged";
    const fcastLines = forecast6.map(f=>`${f.month}=$${(f.rev/1000).toFixed(1)}k`).join(", ");
    const prompt = `You are a self-storage revenue expert for Richmond, VA. Today is ${new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}.

EXTRA ATTIC MINI STORAGE — DAILY BRIEFING
${locLines}

Season: ${seasonStatus} (${SEASONAL_LABEL[mo]}) — ${Math.round(seasonMult*100-100)>0?"+":""}${Math.round(seasonMult*100-100)}% seasonal factor
Network: ${Math.round(net.occ*100)}% occupancy · $${net.r.toLocaleString()}/mo revenue · ${net.wl} waitlisted units
Competitor alerts: ${alertLines}
Active promos: ${promoLines}
Recent activity: ${actLines}
6-month forecast: ${fcastLines}

Write a DAILY BRIEFING with these exact 5 sections:
1. 🚨 URGENT ACTIONS TODAY — specific location, unit size, dollar amount
2. 💰 TOP PRICING OPPORTUNITY THIS WEEK
3. 📣 RECOMMENDED PROMO — based on current season and occupancy
4. 📊 MARKET POSITION — one sentence vs competitors
5. 🔮 REVENUE OUTLOOK — are we on track vs forecast?

Be direct. Dollar amounts required. Max 300 words.`;
    callAI(prompt,"daily",setAiLoading);
    localStorage.setItem("ea5_briefing_date",todayStr);
    setBriefingDate(todayStr);
  },[allRates,compRates,promos,activity,net,compAlerts,forecast6,seasonMult,seasonStatus,mo,todayStr]);

  const getLocAdvice = useCallback((locId)=>{
    const loc=LOCATIONS.find(l=>l.id===locId);
    const rates=allRates[locId]||{};
    const units=locUnits(loc).map(uid=>{
      const def=UNIT_DEFS.find(u=>u.id===uid);
      const u=rates[uid]||{};
      const occ=u.total>0?u.occupied/u.total:0;
      return `${def?.label}: $${u.street} Occ=${Math.round(occ*100)}% Waitlist=${u.waitlist||0} MktAvg=$${mktAvg(uid,compRates)}`;
    }).join("\n");
    const prompt=`Richmond VA self-storage expert. ${loc.name} (${loc.address}).\nSeason: ${seasonStatus} — ${SEASONAL_LABEL[mo]} (${Math.round(seasonMult*100-100)>0?"+":""}${Math.round(seasonMult*100-100)}%)\nUnits:\n${units}\n\nDate: ${new Date().toLocaleDateString()}\n1) Top 3 rate actions with exact dollar amounts, 2) Seasonal adjustment, 3) Best promo for this location. Max 200 words.`;
    callAI(prompt,locId,setAiLoading);
  },[allRates,compRates,seasonStatus,mo,seasonMult]);

  const getCompAI = useCallback(()=>{
    const lines=COMPETITORS.map(c=>{const r=compRates[c.id]||{};return `${c.name}: 5x10=$${r["5x10"]} 10x10=$${r["10x10"]} 10x20=$${r["10x20"]} CC=$${r["cc10x10"]} Promo:"${r.promo}"`;}).join("\n");
    const ourAvg=["5x10","10x10","10x20"].map(uid=>{const v=LOCATIONS.flatMap(l=>allRates[l.id]?.[uid]?.street?[allRates[l.id][uid].street]:[]);return`${uid}=$${v.length?Math.round(v.reduce((a,b)=>a+b)/v.length):0}`;}).join(" ");
    callAI(`Richmond VA storage market. Season:${seasonStatus}\nCompetitors:\n${lines}\nExtra Attic avg:${ourAvg}\n1) Most aggressive competitor, 2) Where we are overpriced, 3) Where to raise rates, 4) Best promo tactic. 200 words.`,"comp",setCompLoading);
  },[compRates,allRates,seasonStatus]);

  // Add promo
  const addPromo = () => {
    if (!newPromo.desc) return;
    setPromos(p=>[{...newPromo,id:Date.now(),active:true,created:new Date().toLocaleDateString()},...p]);
    setNewPromo({locId:"airport",unitId:"10x10",desc:"",discount:"",expiry:""});
  };

  // Add activity and auto-adjust occupancy
  const addActivity = () => {
    setActivity(a=>[{...newActivity,id:Date.now(),date:new Date().toLocaleDateString(),time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})},...a].slice(0,200));
    const delta = newActivity.type==="move_in"?1:-1;
    const u = allRates[newActivity.locId]?.[newActivity.unitId];
    if (u) handleRate(newActivity.locId,newActivity.unitId,"occupied",Math.max(0,(u.occupied||0)+delta));
    setNewActivity({locId:"airport",type:"move_in",unitId:"10x10",note:""});
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={T.app}>
      <style>{CSS}</style>

      {/* TOP BAR */}
      <div style={T.topbar}>
        <div style={{flexShrink:0}}>
          <div style={T.logo}>Extra Attic Mini Storage</div>
          <div style={T.logoSub}>Dynamic Pricing · 4 Locations · Richmond VA</div>
        </div>
        <nav style={T.nav}>
          {TABS.map(([id,label])=>(
            <button key={id} style={T.navBtn(tab===id)} onClick={()=>setTab(id)}>{label}</button>
          ))}
        </nav>
        <div style={{fontSize:"0.6rem",color:"#374151",textAlign:"right",flexShrink:0}}>
          <div style={{color:"#c9a84c",fontWeight:700}}>{new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</div>
          <div style={{color:seasonStatus==="Peak"?"#22c55e":seasonStatus==="Slow"?"#f87171":"#facc15",fontWeight:600,marginTop:1}}>{seasonStatus} Season</div>
        </div>
      </div>

      <div style={T.main}>

        {/* ══════ DASHBOARD ══════ */}
        {tab==="dashboard"&&(
          <div className="fade">
            {/* KPI strip */}
            <div style={T.kpiGrid}>
              {[
                [occColor,"Network Occupancy",`${Math.round(net.occ*100)}%`,`${net.o}/${net.u} units across 4 locations`],
                ["#a78bfa","Monthly Revenue",`$${net.r.toLocaleString()}`,"occupied × street rate"],
                ["#fb923c","Units Need Action",`${net.a}`,"raise or reduce pricing"],
                ["#34d399","Waitlisted Units",`${net.wl}`,"customers waiting for space"],
                [seasonStatus==="Peak"?"#22c55e":seasonStatus==="Slow"?"#f87171":"#facc15","Season",seasonStatus,`${SEASONAL_LABEL[mo]} · ${Math.round(seasonMult*100-100)>=0?"+":""}${Math.round(seasonMult*100-100)}% demand`],
                [compAlerts.length>0?"#f87171":"#22c55e","Competitor Alerts",`${compAlerts.length}`,compAlerts.length>0?"Review overpriced units":"Rates look competitive"],
              ].map(([c,lbl,val,sub])=>(
                <div key={lbl} style={T.kpiCard(c)}>
                  <div style={T.kpiLbl}>{lbl}</div>
                  <div style={T.kpiVal(c)}>{val}</div>
                  <div style={T.kpiSub}>{sub}</div>
                </div>
              ))}
            </div>

            {/* Competitor alert banner */}
            {compAlerts.length>0&&(
              <div style={{...T.card("rgba(251,146,60,0.2)"),borderLeft:"3px solid #fb923c",marginBottom:"1.25rem"}}>
                <div style={{...T.secH("#fb923c"),display:"flex",alignItems:"center",gap:6}}>
                  <span style={{animation:"pulse 2s ease infinite",display:"inline-block"}}>⚠</span> Competitor Price Alerts — Possible Overpricing
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(270px,1fr))",gap:"0.5rem"}}>
                  {compAlerts.map((a,i)=>(
                    <div key={i} style={{background:"rgba(251,146,60,0.06)",border:"1px solid rgba(251,146,60,0.2)",borderRadius:8,padding:"0.65rem 0.9rem"}}>
                      <div style={{fontWeight:700,color:a.locColor,fontSize:"0.76rem"}}>{a.loc} — {a.unit}</div>
                      <div style={{fontSize:"0.7rem",color:"#9ca3af",marginTop:3}}>
                        Ours: <span style={{color:"#f87171",fontFamily:"'DM Mono',monospace"}}>${a.ourPrice}</span>
                        &nbsp;·&nbsp;{a.comp}: <span style={{color:"#22c55e",fontFamily:"'DM Mono',monospace"}}>${a.compPrice}</span>
                        &nbsp;·&nbsp;<span style={{color:"#fb923c",fontWeight:700}}>{a.pct}% higher</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location cards */}
            <div style={T.secH()}>📍 Location Snapshots</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(255px,1fr))",gap:"0.8rem",marginBottom:"1.25rem"}}>
              {LOCATIONS.map(loc=>{
                const ids=locUnits(loc), rates=allRates[loc.id]||{};
                const totU=ids.reduce((a,id)=>a+(rates[id]?.total||0),0);
                const totO=ids.reduce((a,id)=>a+(rates[id]?.occupied||0),0);
                const occ=totU>0?totO/totU:0;
                const rev=ids.reduce((a,id)=>a+(rates[id]?.occupied||0)*(rates[id]?.street||0),0);
                const wl=ids.reduce((a,id)=>a+(rates[id]?.waitlist||0),0);
                const action=getAction(occ);
                const hist=(occHist[loc.id]||[]).map(h=>h.occ);
                return (
                  <div key={loc.id} style={{...T.kpiCard(loc.color),padding:"1rem"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                      <div>
                        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.05rem",color:loc.color,letterSpacing:"0.06em"}}>{loc.name}</div>
                        <div style={{fontSize:"0.6rem",color:"#4b5563"}}>{loc.address}</div>
                      </div>
                      <span style={T.badge(action.color,action.bg)}>{action.icon} {action.label}</span>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4,marginBottom:8}}>
                      <div><div style={T.kpiLbl}>Occ</div><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.25rem",color:action.color}}>{Math.round(occ*100)}%</div></div>
                      <div><div style={T.kpiLbl}>Revenue</div><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.25rem",color:loc.color}}>${(rev/1000).toFixed(1)}k</div></div>
                      <div><div style={T.kpiLbl}>Waitlist</div><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.25rem",color:wl>0?"#f87171":"#4b5563"}}>{wl}</div></div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <OccBar occ={occ}/>
                      <Sparkline data={hist} color={loc.color}/>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Daily AI Briefing */}
            <div style={T.aiBox}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.8rem",flexWrap:"wrap",gap:"0.5rem"}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"0.95rem",color:"#c9a84c",letterSpacing:"0.1em"}}>
                  🤖 Daily AI Briefing
                  {briefingDone&&<span style={{fontSize:"0.6rem",color:"#22c55e",fontFamily:"'DM Sans',sans-serif",fontWeight:400,letterSpacing:0,marginLeft:8}}>✓ Done for today</span>}
                </div>
                <button style={T.btn("primary")} onClick={getDailyBriefing} disabled={aiLoading}>
                  {aiLoading?<><Spinner/>&nbsp;Analyzing...</>:briefingDone?"🔄 Refresh":"⚡ Get Today's Briefing"}
                </button>
              </div>
              {aiAdvice.daily
                ?<div style={T.aiText}>{aiAdvice.daily}</div>
                :<div style={{color:"#374151",fontSize:"0.8rem",fontStyle:"italic"}}>Click "Get Today's Briefing" every morning for your complete daily strategy — urgent actions, promo recommendations, revenue outlook, and competitive position across all 4 locations.</div>
              }
            </div>

            {/* Active promos */}
            {activePromos.length>0&&(
              <div style={T.card("rgba(34,197,94,0.15)")}>
                <div style={T.secH("#22c55e")}>📣 Active Promotions</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"0.5rem"}}>
                  {activePromos.map(p=>{
                    const loc=LOCATIONS.find(l=>l.id===p.locId);
                    return (
                      <div key={p.id} style={{background:"rgba(34,197,94,0.07)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:7,padding:"0.45rem 0.8rem",fontSize:"0.76rem"}}>
                        <span style={{color:loc?.color,fontWeight:700}}>{loc?.name}</span>
                        <span style={{color:"#4b5563",margin:"0 4px"}}>·</span>
                        <span style={{color:"#d1d5db"}}>{p.desc}</span>
                        {p.discount&&<span style={{color:"#22c55e",marginLeft:4,fontWeight:700}}>{p.discount}</span>}
                        {p.expiry&&<span style={{color:"#6b7280",marginLeft:6,fontSize:"0.66rem"}}>Expires {p.expiry}</span>}
                        <button onClick={()=>setPromos(prev=>prev.map(x=>x.id===p.id?{...x,active:false}:x))} style={{marginLeft:8,background:"none",border:"none",color:"#4b5563",fontSize:"0.68rem",cursor:"pointer",padding:0}}>✕</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════ OUR RATES ══════ */}
        {tab==="rates"&&(
          <div className="fade">
            <div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap",marginBottom:"1.25rem"}}>
              {LOCATIONS.map(loc=><button key={loc.id} style={T.locTab(loc.color,activeLoc===loc.id)} onClick={()=>setActiveLoc(loc.id)}>● {loc.name}</button>)}
            </div>
            {LOCATIONS.filter(l=>l.id===activeLoc).map(loc=>(
              <div key={loc.id}>
                <div style={{...T.card(`${loc.color}30`),marginBottom:"1rem"}}>
                  <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:"0.5rem"}}>
                    <div>
                      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.35rem",color:loc.color,letterSpacing:"0.06em"}}>Extra Attic — {loc.name}</div>
                      <div style={{fontSize:"0.75rem",color:"#6b7280"}}>{loc.address}, {loc.city} · {loc.phone} · {loc.email}</div>
                    </div>
                    <div style={{display:"flex",gap:"0.35rem",flexWrap:"wrap"}}>
                      {loc.features.map(f=><span key={f} style={{padding:"2px 7px",borderRadius:4,background:`${loc.color}15`,border:`1px solid ${loc.color}30`,fontSize:"0.65rem",color:loc.color,fontWeight:600}}>{f}</span>)}
                    </div>
                  </div>
                </div>
                <div style={T.card()}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.85rem",flexWrap:"wrap",gap:"0.4rem"}}>
                    <div style={T.secH(loc.color)}>🏷 Rates, Occupancy & Waitlist — {loc.name}</div>
                    <span style={{fontSize:"0.65rem",color:"#4b5563"}}>Blue inputs = editable · Changes auto-saved</span>
                  </div>
                  {loc.unitTypes.map(type=>{
                    const tc={standard:"#60a5fa",climate:"#67e8f9",vehicle:"#a3e635"};
                    const tl={standard:"📦 Standard Units",climate:"🌡 Climate-Controlled",vehicle:"🚗 Vehicle / Boat / RV"};
                    const defs=UNITS_BY_TYPE[type].map(id=>UNIT_DEFS.find(u=>u.id===id)).filter(Boolean);
                    return (
                      <div key={type} style={{marginBottom:"1.5rem"}}>
                        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"0.85rem",color:tc[type],letterSpacing:"0.1em",marginBottom:7,borderBottom:"1px solid rgba(255,255,255,0.05)",paddingBottom:4}}>{tl[type]}</div>
                        <div style={{overflowX:"auto"}}>
                          <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.8rem"}}>
                            <thead><tr>{["Unit","Street $","Web $","Total","Occupied","Waitlist","Occupancy","Mkt Avg","vs Mkt","Action","Seasonal Rec"].map(h=><th key={h} style={T.th}>{h}</th>)}</tr></thead>
                            <tbody>
                              {defs.map((def,idx)=>{
                                const u=allRates[loc.id]?.[def.id]||{street:def.marketAvg,web:Math.round(def.marketAvg*0.88),total:5,occupied:4,waitlist:0};
                                const occ=getOcc(u); const action=getAction(occ);
                                const rec=getRecRate(u.street,occ); const mkt=mktAvg(def.id,compRates);
                                const diff=mkt>0?u.street-mkt:0; const alt=idx%2===1;
                                return (
                                  <tr key={def.id}>
                                    <td style={{...T.td(alt),fontWeight:700,color:"#e2e2e6"}}>{def.label}</td>
                                    {["street","web"].map(f=><td key={f} style={T.td(alt)}><input style={T.inp(68)} value={u[f]} onChange={e=>handleRate(loc.id,def.id,f,e.target.value)} onFocus={e=>e.target.select()}/></td>)}
                                    <td style={T.td(alt)}><input style={T.inp(50)} value={u.total} onChange={e=>handleRate(loc.id,def.id,"total",e.target.value)} onFocus={e=>e.target.select()}/></td>
                                    <td style={T.td(alt)}><input style={T.inp(50)} value={u.occupied} onChange={e=>handleRate(loc.id,def.id,"occupied",e.target.value)} onFocus={e=>e.target.select()}/></td>
                                    <td style={T.td(alt)}><input style={{...T.inp(50),color:(u.waitlist||0)>0?"#f87171":"#93c5fd"}} value={u.waitlist||0} onChange={e=>handleRate(loc.id,def.id,"waitlist",e.target.value)} onFocus={e=>e.target.select()}/></td>
                                    <td style={T.td(alt)}><OccBar occ={occ}/></td>
                                    <td style={{...T.td(alt),fontFamily:"'DM Mono',monospace",color:"#6b7280"}}>{mkt>0?`$${mkt}`:"—"}</td>
                                    <td style={{...T.td(alt),fontFamily:"'DM Mono',monospace",color:diff>12?"#f87171":diff<-5?"#22c55e":"#6b7280"}}>{mkt>0?(diff>=0?"+":"")+diff:"—"}</td>
                                    <td style={T.td(alt)}><span style={T.badge(action.color,action.bg)}>{action.icon} {action.label}</span></td>
                                    <td style={{...T.td(alt),fontFamily:"'DM Mono',monospace",fontWeight:700,color:rec!==u.street?"#c9a84c":"#4b5563"}}>
                                      ${rec}{rec!==u.street&&<span style={{fontSize:"0.6rem",marginLeft:3,color:rec>u.street?"#22c55e":"#f87171"}}>({rec>u.street?"+":""}{rec-u.street})</span>}
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
                <div style={T.aiBox}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.75rem",flexWrap:"wrap",gap:"0.5rem"}}>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"0.95rem",color:loc.color,letterSpacing:"0.1em"}}>🤖 AI Advice — {loc.name}</div>
                    <button style={T.btn("primary")} onClick={()=>getLocAdvice(loc.id)} disabled={aiLoading}>{aiLoading?<><Spinner/>&nbsp;Analyzing...</>:"⚡ Analyze This Location"}</button>
                  </div>
                  {aiAdvice[loc.id]?<div style={T.aiText}>{aiAdvice[loc.id]}</div>:<div style={{color:"#374151",fontSize:"0.8rem",fontStyle:"italic"}}>Get AI pricing advice for {loc.name} including seasonal adjustments for {SEASONAL_LABEL[mo]}.</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════ DYNAMIC PRICING ══════ */}
        {tab==="dynamic"&&(
          <div className="fade">
            {/* Seasonal bar */}
            <div style={T.card()}>
              <div style={T.secH()}>🌦 Seasonal Pricing Engine — <span style={{color:seasonStatus==="Peak"?"#22c55e":seasonStatus==="Slow"?"#f87171":"#facc15"}}>{SEASONAL_LABEL[mo]} is a {seasonStatus} month</span></div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:"0.4rem",marginBottom:"1rem"}}>
                {SEASONAL_LABEL.map((m,i)=>{
                  const mult=SEASONAL_MULT[i]; const isNow=i===mo;
                  const c=mult>=1.08?"#22c55e":mult>=1.0?"#facc15":mult>=0.95?"#fb923c":"#f87171";
                  return (
                    <div key={m} style={{background:isNow?`${c}18`:"rgba(255,255,255,0.02)",border:`1px solid ${isNow?c:"rgba(255,255,255,0.06)"}`,borderRadius:7,padding:"0.5rem",textAlign:"center",borderTop:isNow?`3px solid ${c}`:"3px solid transparent"}}>
                      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"0.8rem",color:isNow?c:"#6b7280",letterSpacing:"0.05em"}}>{m}</div>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:"0.72rem",color:c,marginTop:2}}>{mult>=1?"+":""}{Math.round(mult*100-100)}%</div>
                      <div style={{fontSize:"0.58rem",color:"#4b5563",marginTop:1}}>{SEASONAL_STATUS[i]}</div>
                    </div>
                  );
                })}
              </div>
              <p style={{fontSize:"0.76rem",color:"#6b7280",lineHeight:1.6}}>The seasonal engine applies monthly demand multipliers on top of occupancy-based rules. <strong style={{color:"#c9a84c"}}>{SEASONAL_LABEL[mo]} ({seasonStatus})</strong> rates are adjusted by <strong style={{color:seasonMult>=1?"#22c55e":"#f87171"}}>{seasonMult>=1?"+":""}{Math.round(seasonMult*100-100)}%</strong> from your base street rate in all recommendations.</p>
            </div>

            {/* Auto-suggest table */}
            <div style={T.card()}>
              <div style={T.secH()}>⚡ Auto-Suggested Rate Changes — All Locations</div>
              <p style={{fontSize:"0.73rem",color:"#6b7280",marginBottom:"1rem"}}>Based on occupancy thresholds + {SEASONAL_LABEL[mo]} seasonal factor. Click "Apply" to update the rate instantly.</p>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.8rem"}}>
                  <thead><tr>{["Location","Unit","Current Rate","Occupancy","Action","Seasonal Rec","Change","Apply"].map(h=><th key={h} style={T.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {LOCATIONS.flatMap(loc=>
                      locUnits(loc).map((uid,idx)=>{
                        const def=UNIT_DEFS.find(u=>u.id===uid);
                        const u=allRates[loc.id]?.[uid]||{};
                        const occ=getOcc(u); const action=getAction(occ);
                        const rec=getRecRate(u.street||0,occ); const change=rec-(u.street||0);
                        if (change===0) return null;
                        const alt=idx%2===1;
                        return (
                          <tr key={`${loc.id}-${uid}`}>
                            <td style={{...T.td(alt),fontWeight:700,color:loc.color}}>{loc.name}</td>
                            <td style={{...T.td(alt),fontWeight:600}}>{def?.label}</td>
                            <td style={{...T.td(alt),fontFamily:"'DM Mono',monospace",color:"#93c5fd"}}>${u.street||0}</td>
                            <td style={T.td(alt)}><OccBar occ={occ}/></td>
                            <td style={T.td(alt)}><span style={T.badge(action.color,action.bg)}>{action.icon} {action.label}</span></td>
                            <td style={{...T.td(alt),fontFamily:"'DM Mono',monospace",fontWeight:700,color:"#c9a84c"}}>${rec}</td>
                            <td style={{...T.td(alt),fontFamily:"'DM Mono',monospace",fontWeight:700,color:change>0?"#22c55e":"#f87171"}}>{change>0?"+":""}{change}</td>
                            <td style={T.td(alt)}>
                              <button style={{...T.btn("outline"),padding:"0.18rem 0.55rem",fontSize:"0.66rem",borderColor:change>0?"rgba(34,197,94,0.4)":"rgba(248,113,113,0.4)",color:change>0?"#22c55e":"#f87171"}} onClick={()=>handleRate(loc.id,uid,"street",rec)}>
                                Apply ${rec}
                              </button>
                            </td>
                          </tr>
                        );
                      }).filter(Boolean)
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Competitor alerts */}
            <div style={T.card(compAlerts.length>0?"rgba(251,146,60,0.15)":"rgba(255,255,255,0.07)")}>
              <div style={T.secH("#fb923c")}>🔔 Competitor Price Alerts</div>
              {compAlerts.length===0
                ?<p style={{color:"#22c55e",fontSize:"0.8rem"}}>✓ No significant price gaps detected. Your pricing looks competitive across all tracked units.</p>
                :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))",gap:"0.55rem"}}>
                  {compAlerts.map((a,i)=>(
                    <div key={i} style={{background:"rgba(251,146,60,0.06)",border:"1px solid rgba(251,146,60,0.18)",borderRadius:8,padding:"0.65rem 0.9rem"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontWeight:700,color:a.locColor,fontSize:"0.76rem"}}>{a.loc} — {a.unit}</span>
                        <span style={T.badge("#fb923c","rgba(251,146,60,0.12)")}>{a.pct}% higher</span>
                      </div>
                      <div style={{fontSize:"0.7rem",color:"#9ca3af",marginTop:3}}>
                        Ours: <span style={{color:"#f87171",fontFamily:"'DM Mono',monospace"}}>${a.ourPrice}</span>
                        &nbsp;·&nbsp;{a.comp}: <span style={{color:"#22c55e",fontFamily:"'DM Mono',monospace"}}>${a.compPrice}</span>
                        &nbsp;·&nbsp;Difference: <span style={{color:"#fb923c",fontFamily:"'DM Mono',monospace"}}>${a.diff}</span>
                      </div>
                    </div>
                  ))}
                </div>
              }
            </div>

            {/* Pricing rules */}
            <div style={T.card()}>
              <div style={T.secH()}>📏 Pricing Rules Reference</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"0.65rem"}}>
                {[["≥ 92%","#22c55e","#052e16","▲ RAISE +5%","Apply seasonal multiplier on top"],
                  ["80–91%","#facc15","#1c1917","● HOLD","Apply seasonal multiplier only"],
                  ["75–79%","#fb923c","#1c0a00","⚠ REDUCE -5%","Ignore seasonal — fill units first"],
                  ["< 75%", "#f87171","#2d0a0a","▼ REDUCE -8%","Run promo — 1st month free or 50% off"],
                ].map(([rule,c,b,action,note])=>(
                  <div key={rule} style={{background:b,border:`1px solid ${c}30`,borderRadius:8,padding:"0.7rem",borderTop:`2px solid ${c}`}}>
                    <div style={{color:c,fontWeight:700,fontSize:"0.78rem"}}>{action}</div>
                    <div style={{color:c,fontSize:"0.67rem",fontFamily:"'DM Mono',monospace",margin:"3px 0"}}>{rule} occupied</div>
                    <div style={{color:"#6b7280",fontSize:"0.68rem"}}>{note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════ ACTIVITY ══════ */}
        {tab==="activity"&&(
          <div className="fade">
            {/* Log move-in/out */}
            <div style={T.card()}>
              <div style={T.secH()}>📝 Log Move-In / Move-Out</div>
              <div style={{display:"flex",gap:"0.7rem",flexWrap:"wrap",alignItems:"flex-end"}}>
                {[
                  ["Location", <select style={T.sel(110)} value={newActivity.locId} onChange={e=>setNewActivity(p=>({...p,locId:e.target.value,unitId:locUnits(LOCATIONS.find(l=>l.id===e.target.value)||LOCATIONS[0])[0]}))}>{LOCATIONS.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select>],
                  ["Type",     <select style={T.sel(110)} value={newActivity.type} onChange={e=>setNewActivity(p=>({...p,type:e.target.value}))}><option value="move_in">Move In</option><option value="move_out">Move Out</option></select>],
                  ["Unit",     <select style={T.sel(110)} value={newActivity.unitId} onChange={e=>setNewActivity(p=>({...p,unitId:e.target.value}))}>{locUnits(LOCATIONS.find(l=>l.id===newActivity.locId)||LOCATIONS[0]).map(uid=>{const d=UNIT_DEFS.find(u=>u.id===uid);return<option key={uid} value={uid}>{d?.label||uid}</option>;})}</select>],
                  ["Note",     <input style={{...T.inp(160,true)}} placeholder="optional note" value={newActivity.note} onChange={e=>setNewActivity(p=>({...p,note:e.target.value}))}/>],
                ].map(([label,el])=>(
                  <div key={label}>
                    <div style={{fontSize:"0.62rem",color:"#6b7280",marginBottom:4,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>{label}</div>
                    {el}
                  </div>
                ))}
                <button style={{...T.btn("primary"),alignSelf:"flex-end"}} onClick={addActivity}>Log Entry</button>
              </div>
            </div>

            {/* Promo tracker */}
            <div style={T.card()}>
              <div style={T.secH("#22c55e")}>📣 Promotion Tracker</div>
              <div style={{display:"flex",gap:"0.7rem",flexWrap:"wrap",alignItems:"flex-end",marginBottom:"1.25rem",paddingBottom:"1.25rem",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
                {[
                  ["Location",    <select style={T.sel(110)} value={newPromo.locId} onChange={e=>setNewPromo(p=>({...p,locId:e.target.value}))}>{LOCATIONS.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select>],
                  ["Unit Size",   <select style={T.sel(110)} value={newPromo.unitId} onChange={e=>setNewPromo(p=>({...p,unitId:e.target.value}))}>{UNIT_DEFS.map(d=><option key={d.id} value={d.id}>{d.label}</option>)}</select>],
                  ["Description", <input style={{...T.inp(165,true)}} placeholder="e.g. 1st month free" value={newPromo.desc} onChange={e=>setNewPromo(p=>({...p,desc:e.target.value}))}/>],
                  ["Discount",    <input style={{...T.inp(90,true)}} placeholder="e.g. $45 off" value={newPromo.discount} onChange={e=>setNewPromo(p=>({...p,discount:e.target.value}))}/>],
                  ["Expiry Date", <input style={{...T.inp(110,true)}} placeholder="MM/DD/YYYY" value={newPromo.expiry} onChange={e=>setNewPromo(p=>({...p,expiry:e.target.value}))}/>],
                ].map(([label,el])=>(
                  <div key={label}>
                    <div style={{fontSize:"0.62rem",color:"#6b7280",marginBottom:4,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>{label}</div>
                    {el}
                  </div>
                ))}
                <button style={{...T.btn("primary"),alignSelf:"flex-end"}} onClick={addPromo}>Add Promo</button>
              </div>
              {promos.length===0
                ?<p style={{color:"#374151",fontSize:"0.8rem",fontStyle:"italic"}}>No promotions added yet. Promos you add here appear on the Dashboard automatically.</p>
                :<table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.8rem"}}>
                  <thead><tr>{["Location","Unit","Description","Discount","Expiry","Status",""].map(h=><th key={h} style={T.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {promos.map((p,idx)=>{
                      const loc=LOCATIONS.find(l=>l.id===p.locId);
                      const def=UNIT_DEFS.find(u=>u.id===p.unitId);
                      const alt=idx%2===1;
                      return (
                        <tr key={p.id}>
                          <td style={{...T.td(alt),fontWeight:700,color:loc?.color}}>{loc?.name}</td>
                          <td style={T.td(alt)}>{def?.label||p.unitId}</td>
                          <td style={{...T.td(alt),color:"#d1d5db"}}>{p.desc}</td>
                          <td style={{...T.td(alt),fontFamily:"'DM Mono',monospace",color:"#22c55e"}}>{p.discount||"—"}</td>
                          <td style={{...T.td(alt),color:"#6b7280",fontSize:"0.72rem"}}>{p.expiry||"—"}</td>
                          <td style={T.td(alt)}><span style={T.badge(p.active?"#22c55e":"#4b5563",p.active?"#052e16":"#111")}>{p.active?"● ACTIVE":"○ ENDED"}</span></td>
                          <td style={T.td(alt)}>
                            <button onClick={()=>setPromos(prev=>prev.map(x=>x.id===p.id?{...x,active:!x.active}:x))} style={{...T.btn("outline"),padding:"0.18rem 0.55rem",fontSize:"0.66rem"}}>{p.active?"End":"Reactivate"}</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              }
            </div>

            {/* Activity log */}
            <div style={T.card()}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.85rem"}}>
                <div style={T.secH()}>📋 Move-In / Move-Out Log</div>
                {activity.length>0&&<button style={{...T.btn("outline"),padding:"0.2rem 0.55rem",fontSize:"0.66rem"}} onClick={()=>{if(window.confirm("Clear activity log?"))setActivity([])}}>Clear</button>}
              </div>
              {activity.length===0
                ?<p style={{color:"#374151",fontSize:"0.8rem",fontStyle:"italic"}}>No activity logged yet. Logging a move-in or move-out auto-updates that location's occupancy count.</p>
                :<div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.8rem"}}>
                    <thead><tr>{["Date","Time","Location","Type","Unit","Note"].map(h=><th key={h} style={T.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {activity.map((e,idx)=>{
                        const loc=LOCATIONS.find(l=>l.id===e.locId);
                        const def=UNIT_DEFS.find(u=>u.id===e.unitId);
                        const alt=idx%2===1;
                        return (
                          <tr key={e.id}>
                            <td style={{...T.td(alt),fontFamily:"'DM Mono',monospace",fontSize:"0.7rem",color:"#6b7280"}}>{e.date}</td>
                            <td style={{...T.td(alt),fontFamily:"'DM Mono',monospace",fontSize:"0.7rem",color:"#4b5563"}}>{e.time}</td>
                            <td style={{...T.td(alt),fontWeight:700,color:loc?.color}}>{loc?.name}</td>
                            <td style={T.td(alt)}><span style={T.badge(e.type==="move_in"?"#22c55e":"#f87171",e.type==="move_in"?"#052e16":"#2d0a0a")}>{e.type==="move_in"?"▲ IN":"▼ OUT"}</span></td>
                            <td style={{...T.td(alt),fontWeight:600}}>{def?.label||e.unitId}</td>
                            <td style={{...T.td(alt),color:"#6b7280",fontSize:"0.73rem"}}>{e.note||"—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </div>
        )}

        {/* ══════ FORECAST ══════ */}
        {tab==="forecast"&&(
          <div className="fade">
            <div style={T.card()}>
              <div style={T.secH()}>📈 6-Month Revenue Forecast</div>
              <p style={{fontSize:"0.73rem",color:"#6b7280",marginBottom:"1.25rem"}}>Projected from current occupancy × seasonal demand multipliers. Assumes no rate changes.</p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:"0.7rem",marginBottom:"1.5rem"}}>
                {forecast6.map((f,i)=>{
                  const isNow=i===0;
                  const c=f.status==="Peak"?"#22c55e":f.status==="Slow"?"#f87171":f.status==="Rising"?"#a78bfa":"#facc15";
                  return (
                    <div key={f.month} style={{background:isNow?"rgba(201,168,76,0.07)":"rgba(255,255,255,0.02)",border:`1px solid ${isNow?"rgba(201,168,76,0.3)":"rgba(255,255,255,0.07)"}`,borderRadius:10,padding:"0.9rem",borderTop:`3px solid ${c}`}}>
                      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"0.9rem",color:c,letterSpacing:"0.05em"}}>{f.month}{isNow&&<span style={{fontSize:"0.55rem",color:"#c9a84c",marginLeft:6}}>NOW</span>}</div>
                      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.5rem",color:"#e2e2e6",margin:"4px 0"}}>${(f.rev/1000).toFixed(1)}k</div>
                      <div style={{fontSize:"0.65rem",color:"#4b5563"}}>{f.status} · {f.mult>=1?"+":""}{Math.round(f.mult*100-100)}%</div>
                    </div>
                  );
                })}
              </div>
              {/* Bar chart */}
              <div style={{background:"rgba(255,255,255,0.02)",borderRadius:8,padding:"1rem"}}>
                {(()=>{
                  const maxRev=Math.max(...forecast6.map(f=>f.rev));
                  return forecast6.map((f,i)=>{
                    const pct=maxRev>0?Math.round((f.rev/maxRev)*100):0;
                    const c=f.status==="Peak"?"#22c55e":f.status==="Slow"?"#f87171":f.status==="Rising"?"#a78bfa":"#facc15";
                    return (
                      <div key={f.month} style={{display:"flex",alignItems:"center",gap:"0.75rem",marginBottom:"0.5rem"}}>
                        <div style={{width:34,fontSize:"0.7rem",color:"#6b7280",fontFamily:"'DM Mono',monospace",flexShrink:0}}>{f.month}</div>
                        <div style={{flex:1,height:16,background:"rgba(255,255,255,0.04)",borderRadius:4,overflow:"hidden"}}>
                          <div style={{width:`${pct}%`,height:"100%",background:c,borderRadius:4,transition:"width 0.5s",display:"flex",alignItems:"center",paddingLeft:6}}>
                            {pct>28&&<span style={{fontSize:"0.62rem",color:"rgba(0,0,0,0.7)",fontWeight:700}}>${(f.rev/1000).toFixed(1)}k</span>}
                          </div>
                        </div>
                        <div style={{width:46,fontSize:"0.7rem",color:c,fontFamily:"'DM Mono',monospace",textAlign:"right",flexShrink:0}}>${(f.rev/1000).toFixed(1)}k</div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* 30/60/90 cards */}
            <div style={T.card()}>
              <div style={T.secH()}>🔮 30 / 60 / 90 Day Revenue Outlook</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"1rem"}}>
                {[1,2,3].map(months=>{
                  const proj=forecastRevenue(allRates,months);
                  const total=proj.reduce((a,f)=>a+f.rev,0);
                  const c=months===1?"#60a5fa":months===2?"#a78bfa":"#c9a84c";
                  return (
                    <div key={months} style={T.kpiCard(c)}>
                      <div style={T.kpiLbl}>{months*30}-Day Projected</div>
                      <div style={T.kpiVal(c)}>${(total/1000).toFixed(1)}k</div>
                      <div style={T.kpiSub}>{proj.map(f=>f.month).join(" · ")}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Occupancy history */}
            <div style={T.card()}>
              <div style={T.secH()}>📊 Occupancy History — Last 30 Days</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:"1rem"}}>
                {LOCATIONS.map(loc=>{
                  const hist=occHist[loc.id]||[];
                  const data=hist.map(h=>h.occ);
                  const latest=data[data.length-1]||0;
                  const prev=data[data.length-2]||latest;
                  const trend=latest-prev;
                  return (
                    <div key={loc.id} style={{background:"rgba(255,255,255,0.02)",border:`1px solid ${loc.color}20`,borderRadius:8,padding:"0.85rem",borderLeft:`3px solid ${loc.color}`}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"0.95rem",color:loc.color,letterSpacing:"0.06em"}}>{loc.name}</div>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <span style={{fontFamily:"'DM Mono',monospace",fontSize:"0.95rem",color:latest>=80?"#22c55e":latest>=75?"#facc15":"#f87171",fontWeight:700}}>{latest}%</span>
                          {trend!==0&&<span style={{fontSize:"0.65rem",color:trend>0?"#22c55e":"#f87171"}}>{trend>0?"↑":"↓"}{Math.abs(trend)}%</span>}
                        </div>
                      </div>
                      <Sparkline data={data} color={loc.color}/>
                      <div style={{fontSize:"0.62rem",color:"#374151",marginTop:4}}>{hist.length} days tracked</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══════ COMPETITORS ══════ */}
        {tab==="competitors"&&(
          <div className="fade">
            <div style={T.aiBox}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.8rem",flexWrap:"wrap",gap:"0.5rem"}}>
                <div style={T.secH()}>🤖 AI Competitive Analysis</div>
                <button style={T.btn("primary")} onClick={getCompAI} disabled={compLoading}>{compLoading?<><Spinner/>&nbsp;Analyzing...</>:"🔍 Analyze Competition"}</button>
              </div>
              {compAI?<div style={T.aiText}>{compAI}</div>:<div style={{color:"#374151",fontSize:"0.8rem",fontStyle:"italic"}}>Update rates below then click "Analyze Competition" for AI Richmond market intelligence.</div>}
            </div>
            <div style={T.card()}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.85rem",flexWrap:"wrap",gap:"0.5rem"}}>
                <div style={T.secH()}>📊 Competitor Rate Tracker</div>
                <div style={{display:"flex",gap:"0.4rem"}}>
                  {[["SpareFoot","https://www.sparefoot.com/self-storage/richmond-va.html"],["StorageCafe","https://www.storagecafe.com/storage-units/va/richmond/"]].map(([n,u])=>(
                    <a key={u} href={u} target="_blank" rel="noreferrer" style={{...T.btn("outline"),padding:"0.32rem 0.7rem",textDecoration:"none",display:"inline-block",fontSize:"0.7rem"}}>{n} →</a>
                  ))}
                </div>
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.8rem"}}>
                  <thead><tr>{["Competitor","5×5","5×10","10×10","10×15","10×20","CC 10×10","Promo","Visit"].map(h=><th key={h} style={T.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {COMPETITORS.map((comp,idx)=>{
                      const r=compRates[comp.id]||{}; const alt=idx%2===1;
                      return (
                        <tr key={comp.id}>
                          <td style={{...T.td(alt),fontWeight:700,color:"#e2e2e6",whiteSpace:"nowrap"}}>{comp.name}</td>
                          {["5x5","5x10","10x10","10x15","10x20","cc10x10"].map(uid=>(
                            <td key={uid} style={T.td(alt)}><input style={T.inp(62)} value={r[uid]||""} onChange={e=>setCompRates(prev=>({...prev,[comp.id]:{...prev[comp.id],[uid]:parseFloat(e.target.value)||0}}))} onFocus={e=>e.target.select()}/></td>
                          ))}
                          <td style={{...T.td(alt),minWidth:130}}><input style={{...T.inp(125,true)}} value={r.promo||""} onChange={e=>setCompRates(prev=>({...prev,[comp.id]:{...prev[comp.id],promo:e.target.value}}))}/></td>
                          <td style={T.td(alt)}><a href={comp.url} target="_blank" rel="noreferrer" style={{color:"#c9a84c",fontSize:"0.72rem",textDecoration:"none"}}>Visit →</a></td>
                        </tr>
                      );
                    })}
                    <tr style={{background:"rgba(201,168,76,0.05)"}}>
                      <td style={{...T.td(false),fontWeight:700,color:"#c9a84c"}}>Market Average</td>
                      {["5x5","5x10","10x10","10x15","10x20","cc10x10"].map(uid=>(
                        <td key={uid} style={{...T.td(false),fontFamily:"'DM Mono',monospace",fontWeight:700,color:"#c9a84c"}}>${mktAvg(uid,compRates)||"—"}</td>
                      ))}
                      <td style={T.td(false)} colSpan={2}/>
                    </tr>
                    <tr style={{background:"rgba(34,197,94,0.04)"}}>
                      <td style={{...T.td(false),fontWeight:700,color:"#22c55e"}}>Extra Attic Avg</td>
                      {["5x5","5x10","10x10","10x15","10x20","cc10x10"].map(uid=>{
                        const vals=LOCATIONS.flatMap(l=>allRates[l.id]?.[uid]?.street?[allRates[l.id][uid].street]:[]).filter(v=>v>0);
                        const avg=vals.length?Math.round(vals.reduce((a,b)=>a+b)/vals.length):0;
                        const mkt=mktAvg(uid,compRates); const diff=avg&&mkt?avg-mkt:0;
                        return (
                          <td key={uid} style={{...T.td(false),fontFamily:"'DM Mono',monospace",fontWeight:700}}>
                            {avg?<><span style={{color:"#22c55e"}}>${avg}</span>{mkt>0&&<span style={{fontSize:"0.58rem",marginLeft:3,color:diff>10?"#f87171":diff<-5?"#22c55e":"#6b7280"}}>({diff>=0?"+":""}{diff})</span>}</>:"—"}
                          </td>
                        );
                      })}
                      <td style={T.td(false)} colSpan={2}/>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div style={T.card()}>
              <div style={T.secH()}>🔗 Quick Links</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:"0.45rem"}}>
                {[["SpareFoot Richmond","https://www.sparefoot.com/self-storage/richmond-va.html"],["StorageCafe Richmond","https://www.storagecafe.com/storage-units/va/richmond/"],...COMPETITORS.map(c=>[c.name,c.url])].map(([name,url])=>(
                  <a key={url} href={url} target="_blank" rel="noreferrer" style={{padding:"0.35rem 0.8rem",borderRadius:6,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:"#c9a84c",fontSize:"0.7rem",textDecoration:"none",fontWeight:600}}>{name} →</a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════ LOG ══════ */}
        {tab==="log"&&(
          <div className="fade">
            <div style={T.card()}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.85rem"}}>
                <div style={T.secH()}>📅 Rate Change History</div>
                {changeLog.length>0&&<button style={{...T.btn("outline"),padding:"0.2rem 0.55rem",fontSize:"0.66rem"}} onClick={()=>{if(window.confirm("Clear history?"))setChangeLog([])}}>Clear</button>}
              </div>
              {changeLog.length===0
                ?<p style={{color:"#374151",fontSize:"0.8rem",fontStyle:"italic"}}>No rate changes logged yet. Street and web rate changes auto-log here.</p>
                :<div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.8rem"}}>
                    <thead><tr>{["Date","Time","Location","Unit","Field","Old","New","Change"].map(h=><th key={h} style={T.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {changeLog.map((e,idx)=>{
                        const loc=LOCATIONS.find(l=>l.name===e.location);
                        const alt=idx%2===1;
                        return (
                          <tr key={idx}>
                            <td style={{...T.td(alt),fontFamily:"'DM Mono',monospace",fontSize:"0.7rem",color:"#6b7280"}}>{e.date}</td>
                            <td style={{...T.td(alt),fontFamily:"'DM Mono',monospace",fontSize:"0.7rem",color:"#4b5563"}}>{e.time}</td>
                            <td style={{...T.td(alt),fontWeight:700,color:loc?.color||"#e2e2e6"}}>{e.location}</td>
                            <td style={{...T.td(alt),fontWeight:600}}>{e.unit}</td>
                            <td style={{...T.td(alt),fontSize:"0.7rem",color:"#6b7280"}}>{e.field}</td>
                            <td style={{...T.td(alt),fontFamily:"'DM Mono',monospace",color:"#4b5563"}}>${e.oldVal}</td>
                            <td style={{...T.td(alt),fontFamily:"'DM Mono',monospace",color:"#93c5fd",fontWeight:700}}>${e.newVal}</td>
                            <td style={{...T.td(alt),fontFamily:"'DM Mono',monospace",fontWeight:700,color:e.change>0?"#22c55e":"#f87171"}}>{e.change>0?"+":""}{e.change} ({e.change>0?"+":""}{Math.round((e.change/e.oldVal)*100)}%)</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              }
            </div>
            <div style={T.card()}>
              <div style={T.secH()}>📍 Location Directory</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:"0.8rem"}}>
                {LOCATIONS.map(loc=>(
                  <div key={loc.id} style={{background:`${loc.color}07`,border:`1px solid ${loc.color}20`,borderRadius:8,padding:"0.85rem",borderLeft:`3px solid ${loc.color}`}}>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"0.95rem",color:loc.color,letterSpacing:"0.06em",marginBottom:4}}>{loc.name}</div>
                    <div style={{fontSize:"0.72rem",color:"#6b7280",lineHeight:1.7}}>
                      <div>{loc.address}</div><div>{loc.city}</div>
                      <div style={{color:loc.color,marginTop:2}}>{loc.phone}</div>
                      <div style={{color:"#4b5563"}}>{loc.email}</div>
                    </div>
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
