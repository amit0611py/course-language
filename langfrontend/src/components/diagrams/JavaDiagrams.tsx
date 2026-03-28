// import { C } from "../../theme";

// // ─────────────────────────────────────────────────────────────
// // ALL JAVA DIAGRAMS — SVG & JSX visual components
// // ─────────────────────────────────────────────────────────────

// export function DiagramJVM() {
//   return (
//     <div style={{ background:C.card, borderRadius:14, padding:24, border:`1px solid ${C.border}`, margin:"24px 0" }}>
//       <h4 style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:1, marginBottom:20, textTransform:"uppercase" }}>
//         How Java Code Runs
//       </h4>
//       <svg viewBox="0 0 720 160" style={{ width:"100%", display:"block" }}>
//         <defs>
//           <marker id="a" markerWidth="8" markerHeight="7" refX="7" refY="3.5" orient="auto">
//             <polygon points="0 0,8 3.5,0 7" fill="#94a3b8"/>
//           </marker>
//           <marker id="ga" markerWidth="8" markerHeight="7" refX="7" refY="3.5" orient="auto">
//             <polygon points="0 0,8 3.5,0 7" fill="#4ade80"/>
//           </marker>
//         </defs>

//         {/* Source */}
//         <rect x="6" y="30" width="148" height="95" rx="12" fill="rgba(245,158,11,.1)" stroke="#f59e0b" strokeWidth="1.5"/>
//         <text x="80" y="58"  textAnchor="middle" fill="#f59e0b" fontSize="22">📄</text>
//         <text x="80" y="80"  textAnchor="middle" fill="#f59e0b" fontSize="13" fontWeight="700">Source Code</text>
//         <text x="80" y="98"  textAnchor="middle" fill="#94a3b8" fontSize="11">HelloWorld.java</text>
//         <text x="80" y="115" textAnchor="middle" fill="#4b5563" fontSize="10">.java file</text>

//         {/* arrow */}
//         <line x1="154" y1="77" x2="196" y2="77" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#a)"/>
//         <text x="175" y="69" textAnchor="middle" fill="#4ade80" fontSize="10" fontWeight="700">javac</text>

//         {/* Bytecode */}
//         <rect x="200" y="30" width="155" height="95" rx="12" fill="rgba(167,139,250,.1)" stroke="#a78bfa" strokeWidth="1.5"/>
//         <text x="277" y="58"  textAnchor="middle" fill="#a78bfa" fontSize="22">⚙️</text>
//         <text x="277" y="80"  textAnchor="middle" fill="#a78bfa" fontSize="13" fontWeight="700">Bytecode</text>
//         <text x="277" y="98"  textAnchor="middle" fill="#94a3b8" fontSize="11">HelloWorld.class</text>
//         <text x="277" y="115" textAnchor="middle" fill="#4b5563" fontSize="10">Platform neutral</text>

//         {/* arrow */}
//         <line x1="355" y1="77" x2="396" y2="77" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#a)"/>
//         <text x="375" y="69" textAnchor="middle" fill="#4ade80" fontSize="10" fontWeight="700">JVM</text>

//         {/* JVM box */}
//         <rect x="400" y="12" width="195" height="132" rx="12" fill="rgba(34,211,238,.07)" stroke="#22d3ee" strokeWidth="1.5"/>
//         <text x="498" y="38" textAnchor="middle" fill="#22d3ee" fontSize="13" fontWeight="700">🖥  JVM</text>
//         {[
//           ["Class Loader",      "rgba(34,211,238,.14)"],
//           ["Bytecode Verifier", "rgba(34,211,238,.10)"],
//           ["Execution Engine",  "rgba(34,211,238,.10)"],
//           ["Garbage Collector", "rgba(34,211,238,.06)"],
//         ].map(([label, bg], i) => (
//           <g key={label}>
//             <rect x="414" y={48+i*20} width="167" height="16" rx="4" fill={bg}/>
//             <text x="498" y={60+i*20} textAnchor="middle" fill="#94a3b8" fontSize="10">{label}</text>
//           </g>
//         ))}

//         {/* arrow */}
//         <line x1="595" y1="77" x2="634" y2="77" stroke="#4ade80" strokeWidth="1.5" markerEnd="url(#ga)"/>

//         {/* Output */}
//         <rect x="638" y="30" width="78" height="95" rx="12" fill="rgba(74,222,128,.1)" stroke="#4ade80" strokeWidth="1.5"/>
//         <text x="677" y="58"  textAnchor="middle" fill="#4ade80" fontSize="22">✅</text>
//         <text x="677" y="78"  textAnchor="middle" fill="#4ade80" fontSize="12" fontWeight="700">Output</text>
//         <text x="677" y="96"  textAnchor="middle" fill="#94a3b8" fontSize="10">Windows</text>
//         <text x="677" y="112" textAnchor="middle" fill="#94a3b8" fontSize="10">Mac/Linux</text>
//       </svg>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────
// // DIAGRAM — STACK vs HEAP MEMORY
// // ─────────────────────────────────────────────────────────────
// export function DiagramMemory() {
//   return (
//     <div style={{ background:C.card, borderRadius:14, padding:24, border:`1px solid ${C.border}`, margin:"24px 0" }}>
//       <h4 style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:1, marginBottom:20, textTransform:"uppercase" }}>
//         Where Variables Live in Memory
//       </h4>
//       <svg viewBox="0 0 680 255" style={{ width:"100%", display:"block" }}>
//         <defs>
//           <marker id="marr" markerWidth="8" markerHeight="7" refX="7" refY="3.5" orient="auto">
//             <polygon points="0 0,8 3.5,0 7" fill="#22d3ee"/>
//           </marker>
//         </defs>

//         {/* ── STACK ── */}
//         <rect x="10" y="10" width="290" height="225" rx="14"
//           fill="rgba(245,158,11,.05)" stroke="#f59e0b" strokeWidth="1.5"/>
//         <text x="155" y="36" textAnchor="middle" fill="#f59e0b" fontSize="14" fontWeight="700">📚 STACK</text>
//         <text x="155" y="52" textAnchor="middle" fill="#4b5563" fontSize="10">Primitives stored directly — fast &amp; automatic</text>

//         {[
//           { label:"byte    b  = 127",      val:"127",    c:"#f59e0b" },
//           { label:"int     age = 25",      val:"25",     c:"#f59e0b" },
//           { label:"double  pi  = 3.14",    val:"3.14",   c:"#f59e0b" },
//           { label:"boolean ok  = true",    val:"true",   c:"#f59e0b" },
//           { label:"String  ref →  (heap)", val:"0x4a2f", c:"#22d3ee" },
//         ].map((row, i) => (
//           <g key={i}>
//             <rect x="24" y={64 + i*32} width="262" height="24" rx="6"
//               fill={`rgba(${row.c === "#22d3ee" ? "34,211,238" : "245,158,11"},${0.15 - i*0.015})`}
//               stroke={row.c} strokeWidth="0.8"/>
//             <text x="36"  y={80 + i*32} fill="#e2e8f0" fontSize="11" fontFamily="monospace">{row.label}</text>
//             <text x="278" y={80 + i*32} textAnchor="end" fill={row.c} fontSize="11" fontWeight="700" fontFamily="monospace">{row.val}</text>
//           </g>
//         ))}
//         <text x="155" y="238" textAnchor="middle" fill="#4b5563" fontSize="9">Freed automatically when method returns</text>

//         {/* ── HEAP ── */}
//         <rect x="360" y="10" width="308" height="225" rx="14"
//           fill="rgba(34,211,238,.04)" stroke="#22d3ee" strokeWidth="1.5"/>
//         <text x="514" y="36" textAnchor="middle" fill="#22d3ee" fontSize="14" fontWeight="700">🏔  HEAP</text>
//         <text x="514" y="52" textAnchor="middle" fill="#4b5563" fontSize="10">Objects &amp; arrays — managed by Garbage Collector</text>

//         <rect x="376" y="64" width="276" height="64" rx="10"
//           fill="rgba(34,211,238,.1)" stroke="#22d3ee" strokeWidth="1"/>
//         <text x="514" y="86"  textAnchor="middle" fill="#22d3ee"  fontSize="11" fontWeight="700">String  @0x4a2f</text>
//         <text x="514" y="104" textAnchor="middle" fill="#94a3b8"  fontSize="10" fontFamily="monospace">value = "Java Developer"</text>
//         <text x="514" y="120" textAnchor="middle" fill="#4b5563"  fontSize="9">char[] + hash + length…</text>

//         <rect x="376" y="143" width="276" height="64" rx="10"
//           fill="rgba(74,222,128,.08)" stroke="#4ade80" strokeWidth="1"/>
//         <text x="514" y="165" textAnchor="middle" fill="#4ade80"  fontSize="11" fontWeight="700">int[]  @0x9c72</text>
//         <text x="514" y="183" textAnchor="middle" fill="#94a3b8"  fontSize="10" fontFamily="monospace">[10, 20, 30, 40]  length=4</text>
//         <text x="514" y="199" textAnchor="middle" fill="#4b5563"  fontSize="9">Random access O(1) · contiguous memory</text>

//         <text x="514" y="238" textAnchor="middle" fill="#4b5563" fontSize="9">GC removes objects with zero references</text>

//         {/* Reference arrow from stack → heap */}
//         <line x1="282" y1="192" x2="374" y2="96"
//           stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="6,3" markerEnd="url(#marr)"/>
//       </svg>

//       {/* Legend */}
//       <div style={{ display:"flex", gap:24, marginTop:12, flexWrap:"wrap" }}>
//         {[
//           { color:"#f59e0b", label:"Primitive — stored directly on stack" },
//           { color:"#22d3ee", label:"Reference — pointer to heap object"   },
//           { color:"#4ade80", label:"Object   — lives on heap, GC managed"  },
//         ].map(l => (
//           <div key={l.label} style={{ display:"flex", alignItems:"center", gap:7 }}>
//             <div style={{ width:10, height:10, borderRadius:3, background:l.color, opacity:.7 }}/>
//             <span style={{ color:C.muted, fontSize:11 }}>{l.label}</span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────
// // DIAGRAM — OPERATOR PRECEDENCE
// // ─────────────────────────────────────────────────────────────
// export function DiagramOperators() {
//   const rows = [
//     { pri:"1 (highest)", ops:"++  --  (postfix)",          type:"Unary",       c:"#f59e0b" },
//     { pri:"2",           ops:"++  --  +  -  !  ~  (prefix)",type:"Unary",       c:"#f59e0b" },
//     { pri:"3",           ops:"*   /   %",                   type:"Arithmetic",  c:"#fb923c" },
//     { pri:"4",           ops:"+   -",                       type:"Arithmetic",  c:"#fb923c" },
//     { pri:"5",           ops:"<<  >>  >>>",                 type:"Bitwise",     c:"#a78bfa" },
//     { pri:"6",           ops:"<   <=  >   >=  instanceof",  type:"Relational",  c:"#4ade80" },
//     { pri:"7",           ops:"==  !=",                      type:"Equality",    c:"#4ade80" },
//     { pri:"8–10",        ops:"&   ^   |",                   type:"Bitwise",     c:"#a78bfa" },
//     { pri:"11–12",       ops:"&&  ||",                      type:"Logical",     c:"#22d3ee" },
//     { pri:"13",          ops:"? :",                         type:"Ternary",     c:"#e879f9" },
//     { pri:"14 (lowest)", ops:"=  +=  -=  *=  /=  %=  …",   type:"Assignment",  c:"#f87171" },
//   ];
//   return (
//     <div style={{ background:C.card, borderRadius:14, padding:24, border:`1px solid ${C.border}`, margin:"24px 0" }}>
//       <h4 style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:1, marginBottom:16, textTransform:"uppercase" }}>
//         Operator Precedence (High → Low)
//       </h4>
//       <div style={{ overflowX:"auto" }}>
//         <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"monospace", fontSize:12 }}>
//           <thead>
//             <tr style={{ borderBottom:`1px solid ${C.border}` }}>
//               {["Priority","Operators","Category"].map(h => (
//                 <th key={h} style={{ padding:"8px 12px", color:C.muted, fontWeight:600, textAlign:"left", fontSize:11 }}>{h}</th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {rows.map((r, i) => (
//               <tr key={i} style={{ borderBottom:`1px solid rgba(255,255,255,.04)`, background: i%2===0 ? "rgba(255,255,255,.015)" : "transparent" }}>
//                 <td style={{ padding:"7px 12px", color:C.dim,  fontSize:11 }}>{r.pri}</td>
//                 <td style={{ padding:"7px 12px", color:C.text, fontSize:12 }}>{r.ops}</td>
//                 <td style={{ padding:"7px 12px" }}>
//                   <span style={{ background:`rgba(${r.c==="f59e0b"||r.c==="#f59e0b"?"245,158,11":r.c==="#fb923c"?"251,146,60":r.c==="#a78bfa"?"167,139,250":r.c==="#4ade80"?"74,222,128":r.c==="#22d3ee"?"34,211,238":r.c==="#e879f9"?"232,121,249":"248,113,113"},.15)`, color:r.c, padding:"2px 8px", borderRadius:10, fontSize:10, fontWeight:700 }}>{r.type}</span>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//       <div style={{ marginTop:12, padding:"10px 14px", background:"rgba(245,158,11,.06)", borderRadius:8, color:C.muted, fontSize:12 }}>
//         💡 <strong style={{ color:C.java }}>Tip:</strong> Use parentheses <code style={{ color:"#f1fa8c" }}>()</code> to make precedence explicit — don't rely on memorising order.
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────
// // DIAGRAM — CONTROL FLOW CHART
// // ─────────────────────────────────────────────────────────────
// export function DiagramControlFlow() {
//   return (
//     <div style={{ background:C.card, borderRadius:14, padding:24, border:`1px solid ${C.border}`, margin:"24px 0" }}>
//       <h4 style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:1, marginBottom:20, textTransform:"uppercase" }}>
//         Control Flow — How Java Makes Decisions &amp; Loops
//       </h4>
//       <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>

//         {/* if / else */}
//         <div>
//           <div style={{ color:C.java, fontSize:12, fontWeight:700, marginBottom:12, textAlign:"center" }}>if / else if / else</div>
//           <svg viewBox="0 0 200 260" style={{ width:"100%", display:"block" }}>
//             <defs>
//               <marker id="cfarr" markerWidth="7" markerHeight="6" refX="6" refY="3" orient="auto">
//                 <polygon points="0 0,7 3,0 6" fill="#94a3b8"/>
//               </marker>
//             </defs>
//             {/* Start */}
//             <rect x="60" y="8" width="80" height="28" rx="14" fill="rgba(74,222,128,.15)" stroke="#4ade80" strokeWidth="1.5"/>
//             <text x="100" y="26" textAnchor="middle" fill="#4ade80" fontSize="11" fontWeight="700">START</text>
//             <line x1="100" y1="36" x2="100" y2="52" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#cfarr)"/>
//             {/* condition diamond */}
//             <polygon points="100,54 150,82 100,110 50,82" fill="rgba(245,158,11,.12)" stroke="#f59e0b" strokeWidth="1.5"/>
//             <text x="100" y="80" textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="700">condition</text>
//             <text x="100" y="94" textAnchor="middle" fill="#f59e0b" fontSize="9">true / false?</text>
//             {/* true */}
//             <line x1="50" y1="82" x2="20" y2="82" stroke="#94a3b8" strokeWidth="1.5"/>
//             <line x1="20" y1="82" x2="20" y2="130" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#cfarr)"/>
//             <text x="35" y="75" textAnchor="middle" fill="#4ade80" fontSize="9">true</text>
//             <rect x="6" y="130" width="68" height="28" rx="7" fill="rgba(74,222,128,.12)" stroke="#4ade80" strokeWidth="1"/>
//             <text x="40" y="148" textAnchor="middle" fill="#4ade80" fontSize="10">if block</text>
//             {/* false */}
//             <line x1="150" y1="82" x2="178" y2="82" stroke="#94a3b8" strokeWidth="1.5"/>
//             <line x1="178" y1="82" x2="178" y2="130" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#cfarr)"/>
//             <text x="165" y="75" textAnchor="middle" fill="#f87171" fontSize="9">false</text>
//             <rect x="130" y="130" width="68" height="28" rx="7" fill="rgba(248,113,113,.12)" stroke="#f87171" strokeWidth="1"/>
//             <text x="164" y="148" textAnchor="middle" fill="#f87171" fontSize="10">else block</text>
//             {/* merge */}
//             <line x1="40" y1="158" x2="40" y2="195" stroke="#94a3b8" strokeWidth="1.5"/>
//             <line x1="164" y1="158" x2="164" y2="195" stroke="#94a3b8" strokeWidth="1.5"/>
//             <line x1="40" y1="195" x2="164" y2="195" stroke="#94a3b8" strokeWidth="1.5"/>
//             <line x1="100" y1="195" x2="100" y2="210" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#cfarr)"/>
//             <rect x="60" y="210" width="80" height="28" rx="14" fill="rgba(248,113,113,.12)" stroke="#f87171" strokeWidth="1.5"/>
//             <text x="100" y="228" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="700">END</text>
//           </svg>
//         </div>

//         {/* for loop */}
//         <div>
//           <div style={{ color:C.java, fontSize:12, fontWeight:700, marginBottom:12, textAlign:"center" }}>for / while loop</div>
//           <svg viewBox="0 0 200 260" style={{ width:"100%", display:"block" }}>
//             <defs>
//               <marker id="larr" markerWidth="7" markerHeight="6" refX="6" refY="3" orient="auto">
//                 <polygon points="0 0,7 3,0 6" fill="#94a3b8"/>
//               </marker>
//             </defs>
//             <rect x="60" y="8" width="80" height="28" rx="14" fill="rgba(74,222,128,.15)" stroke="#4ade80" strokeWidth="1.5"/>
//             <text x="100" y="26" textAnchor="middle" fill="#4ade80" fontSize="11" fontWeight="700">START</text>
//             {/* init */}
//             <line x1="100" y1="36" x2="100" y2="52" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#larr)"/>
//             <rect x="55" y="52" width="90" height="24" rx="6" fill="rgba(34,211,238,.1)" stroke="#22d3ee" strokeWidth="1"/>
//             <text x="100" y="68" textAnchor="middle" fill="#22d3ee" fontSize="10">init  i = 0</text>
//             {/* condition */}
//             <line x1="100" y1="76" x2="100" y2="92" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#larr)"/>
//             <polygon points="100,94 148,120 100,146 52,120" fill="rgba(245,158,11,.12)" stroke="#f59e0b" strokeWidth="1.5"/>
//             <text x="100" y="118" textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="700">i &lt; 5 ?</text>
//             <text x="132" y="110" fill="#4ade80" fontSize="9">true</text>
//             {/* loop body */}
//             <line x1="100" y1="146" x2="100" y2="162" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#larr)"/>
//             <rect x="55" y="162" width="90" height="24" rx="6" fill="rgba(167,139,250,.1)" stroke="#a78bfa" strokeWidth="1"/>
//             <text x="100" y="178" textAnchor="middle" fill="#a78bfa" fontSize="10">loop body</text>
//             {/* update */}
//             <line x1="100" y1="186" x2="100" y2="202" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#larr)"/>
//             <rect x="55" y="202" width="90" height="24" rx="6" fill="rgba(34,211,238,.07)" stroke="#22d3ee" strokeWidth="1"/>
//             <text x="100" y="218" textAnchor="middle" fill="#22d3ee" fontSize="10">update  i++</text>
//             {/* back arrow */}
//             <line x1="55" y1="214" x2="20" y2="214" stroke="#94a3b8" strokeWidth="1.5"/>
//             <line x1="20" y1="214" x2="20" y2="120" stroke="#94a3b8" strokeWidth="1.5"/>
//             <line x1="20" y1="120" x2="50" y2="120" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#larr)"/>
//             {/* false exit */}
//             <line x1="52" y1="120" x2="20" y2="120" stroke="none"/>
//             <line x1="100" y1="146" x2="100" y2="146" stroke="none"/>
//             <text x="36" y="113" textAnchor="middle" fill="#f87171" fontSize="9">false</text>
//             <line x1="52" y1="120" x2="6" y2="120" stroke="none"/>
//             {/* false → end */}
//             <line x1="148" y1="120" x2="178" y2="120" stroke="#94a3b8" strokeWidth="1.5"/>
//             <line x1="178" y1="120" x2="178" y2="240" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#larr)"/>
//             <text x="164" y="113" fill="#f87171" fontSize="9">false</text>
//             <rect x="138" y="240" width="60" height="26" rx="13" fill="rgba(248,113,113,.12)" stroke="#f87171" strokeWidth="1.5"/>
//             <text x="168" y="257" textAnchor="middle" fill="#f87171" fontSize="10" fontWeight="700">END</text>
//           </svg>
//         </div>
//       </div>

//       {/* Switch note */}
//       <div style={{ marginTop:16, padding:"10px 16px", background:"rgba(167,139,250,.07)", borderRadius:8, border:`1px solid rgba(167,139,250,.2)` }}>
//         <span style={{ color:"#a78bfa", fontWeight:700, fontSize:12 }}>switch expression (Java 14+): </span>
//         <code style={{ color:"#f1fa8c", fontSize:12 }}>{"int result = switch(day) { case MON -> 1; case TUE -> 2; default -> 0; };"}</code>
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────
// // DIAGRAM — ARRAYS VISUALISED
// // ─────────────────────────────────────────────────────────────
// export function DiagramArrays() {
//   const vals1D = [10, 25, 7, 42, 18, 99, 3];
//   const vals2D = [[1,2,3],[4,5,6],[7,8,9]];
//   return (
//     <div style={{ background:C.card, borderRadius:14, padding:24, border:`1px solid ${C.border}`, margin:"24px 0" }}>
//       <h4 style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:1, marginBottom:20, textTransform:"uppercase" }}>
//         Arrays — 1D and 2D Visualised
//       </h4>

//       {/* 1D */}
//       <div style={{ marginBottom:28 }}>
//         <div style={{ color:C.java, fontSize:12, fontWeight:700, marginBottom:10 }}>
//           1D Array — <code style={{ color:"#f1fa8c", fontWeight:400 }}>int[] nums = {"{10, 25, 7, 42, 18, 99, 3}"}</code>
//         </div>
//         <div style={{ display:"flex", alignItems:"stretch", gap:0 }}>
//           {vals1D.map((v, i) => (
//             <div key={i} style={{ flex:1, textAlign:"center" }}>
//               <div style={{
//                 padding:"12px 4px", background:`rgba(245,158,11,${0.2 - i*0.02})`,
//                 border:`1px solid rgba(245,158,11,.4)`,
//                 borderRight: i === vals1D.length-1 ? undefined : "none",
//                 borderRadius: i===0 ? "8px 0 0 8px" : i===vals1D.length-1 ? "0 8px 8px 0" : 0,
//                 color:"#f8f8f2", fontSize:14, fontWeight:700,
//               }}>{v}</div>
//               <div style={{ color:C.dim, fontSize:10, marginTop:4 }}>[{i}]</div>
//             </div>
//           ))}
//         </div>
//         <div style={{ display:"flex", gap:16, marginTop:12, flexWrap:"wrap" }}>
//           {[
//             { label:"nums[0]", val:"→ 10  (first element)" },
//             { label:"nums[6]", val:"→ 3   (last element)"  },
//             { label:"nums.length", val:"→ 7" },
//           ].map(r => (
//             <div key={r.label} style={{ fontSize:12, fontFamily:"monospace" }}>
//               <span style={{ color:"#8be9fd" }}>{r.label}</span>
//               <span style={{ color:C.muted }}> {r.val}</span>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* 2D */}
//       <div>
//         <div style={{ color:C.spring, fontSize:12, fontWeight:700, marginBottom:10 }}>
//           2D Array — <code style={{ color:"#f1fa8c", fontWeight:400 }}>int[][] grid = {"{{1,2,3},{4,5,6},{7,8,9}}"}</code>
//         </div>
//         <div style={{ display:"flex", gap:0 }}>
//           <div style={{ display:"flex", flexDirection:"column", marginRight:8, justifyContent:"space-around" }}>
//             {vals2D.map((_, ri) => (
//               <div key={ri} style={{ color:C.dim, fontSize:10, height:38, display:"flex", alignItems:"center" }}>row[{ri}]</div>
//             ))}
//           </div>
//           <div>
//             <div style={{ display:"flex", gap:4, marginBottom:4 }}>
//               {[0,1,2].map(ci => (
//                 <div key={ci} style={{ width:48, textAlign:"center", color:C.dim, fontSize:10 }}>[{ci}]</div>
//               ))}
//             </div>
//             {vals2D.map((row, ri) => (
//               <div key={ri} style={{ display:"flex", gap:4, marginBottom:4 }}>
//                 {row.map((v, ci) => (
//                   <div key={ci} style={{
//                     width:48, height:34, display:"flex", alignItems:"center", justifyContent:"center",
//                     background:`rgba(74,222,128,${0.15 - ri*0.04 - ci*0.01})`,
//                     border:`1px solid rgba(74,222,128,.35)`,
//                     borderRadius:6, color:"#f8f8f2", fontSize:13, fontWeight:700,
//                   }}>{v}</div>
//                 ))}
//               </div>
//             ))}
//           </div>
//           <div style={{ marginLeft:16, display:"flex", flexDirection:"column", justifyContent:"center", gap:6 }}>
//             <div style={{ fontSize:12, fontFamily:"monospace" }}>
//               <span style={{ color:"#8be9fd" }}>grid[1][2]</span>
//               <span style={{ color:C.muted }}> → 6</span>
//             </div>
//             <div style={{ fontSize:12, fontFamily:"monospace" }}>
//               <span style={{ color:"#8be9fd" }}>grid.length</span>
//               <span style={{ color:C.muted }}> → 3 (rows)</span>
//             </div>
//             <div style={{ fontSize:12, fontFamily:"monospace" }}>
//               <span style={{ color:"#8be9fd" }}>grid[0].length</span>
//               <span style={{ color:C.muted }}> → 3 (cols)</span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────
// // DIAGRAM — CALL STACK
// // ─────────────────────────────────────────────────────────────
// export function DiagramCallStack() {
//   const frames = [
//     { name:"main()",        vars:"args, result", c:"#f59e0b", note:"entry point"      },
//     { name:"factorial(4)",  vars:"n=4",          c:"#fb923c", note:"calls factorial(3)"},
//     { name:"factorial(3)",  vars:"n=3",          c:"#e879f9", note:"calls factorial(2)"},
//     { name:"factorial(2)",  vars:"n=2",          c:"#a78bfa", note:"calls factorial(1)"},
//     { name:"factorial(1)",  vars:"n=1",          c:"#4ade80", note:"base case → return 1"},
//   ];
//   return (
//     <div style={{ background:C.card, borderRadius:14, padding:24, border:`1px solid ${C.border}`, margin:"24px 0" }}>
//       <h4 style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:1, marginBottom:6, textTransform:"uppercase" }}>
//         Call Stack — Recursive factorial(4)
//       </h4>
//       <p style={{ color:C.dim, fontSize:11, marginBottom:20 }}>Each call pushes a new frame. Returns unwind from top to bottom.</p>
//       <div style={{ display:"flex", gap:24, alignItems:"flex-start", flexWrap:"wrap" }}>
//         <div style={{ flex:"0 0 auto" }}>
//           <div style={{ color:C.muted, fontSize:10, marginBottom:6, textAlign:"center" }}>▲ top of stack</div>
//           {[...frames].reverse().map((f, i) => (
//             <div key={i} style={{
//               background:`rgba(${f.c==="#f59e0b"?"245,158,11":f.c==="#fb923c"?"251,146,60":f.c==="#e879f9"?"232,121,249":f.c==="#a78bfa"?"167,139,250":"74,222,128"},.12)`,
//               border:`1px solid ${f.c}`, borderRadius:8, padding:"9px 18px",
//               marginBottom:4, minWidth:280,
//             }}>
//               <div style={{ display:"flex", justifyContent:"space-between" }}>
//                 <span style={{ color:f.c, fontFamily:"monospace", fontSize:13, fontWeight:700 }}>{f.name}</span>
//                 <span style={{ color:C.dim, fontSize:10 }}>{f.note}</span>
//               </div>
//               <div style={{ color:C.muted, fontSize:11, fontFamily:"monospace", marginTop:2 }}>locals: {f.vars}</div>
//             </div>
//           ))}
//           <div style={{ color:C.dim, fontSize:10, marginTop:4, textAlign:"center" }}>▼ bottom of stack</div>
//         </div>
//         <div style={{ flex:1, minWidth:180 }}>
//           {[
//             { s:"1", t:"main() calls factorial(4)",            c:"#f59e0b" },
//             { s:"2", t:"Each call pushes its own frame + n",   c:"#fb923c" },
//             { s:"3", t:"Base case n==1 returns 1",             c:"#4ade80" },
//             { s:"4", t:"Stack unwinds: 1×2×3×4 = 24",         c:"#a78bfa" },
//             { s:"5", t:"main() gets 24, frames are popped",    c:"#f59e0b" },
//           ].map(r => (
//             <div key={r.s} style={{ display:"flex", gap:10, marginBottom:10, alignItems:"flex-start" }}>
//               <div style={{ width:20, height:20, borderRadius:"50%", background:`rgba(245,158,11,.15)`, border:`1px solid ${r.c}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
//                 <span style={{ color:r.c, fontSize:10, fontWeight:700 }}>{r.s}</span>
//               </div>
//               <span style={{ color:C.muted, fontSize:12, lineHeight:1.5 }}>{r.t}</span>
//             </div>
//           ))}
//           <div style={{ marginTop:8, padding:"8px 12px", background:"rgba(248,113,113,.06)", borderRadius:8, color:C.muted, fontSize:11 }}>
//             ⚠️ No base case = <span style={{ color:C.error, fontFamily:"monospace" }}>StackOverflowError</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────
// // DIAGRAM — STRING POOL & IMMUTABILITY
// // ─────────────────────────────────────────────────────────────
// export function DiagramStringPool() {
//   return (
//     <div style={{ background:C.card, borderRadius:14, padding:24, border:`1px solid ${C.border}`, margin:"24px 0" }}>
//       <h4 style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:1, marginBottom:20, textTransform:"uppercase" }}>
//         String Pool, Immutability &amp; StringBuilder
//       </h4>
//       <svg viewBox="0 0 680 215" style={{ width:"100%", display:"block" }}>
//         <defs>
//           <marker id="sarr" markerWidth="7" markerHeight="6" refX="6" refY="3" orient="auto">
//             <polygon points="0 0,7 3,0 6" fill="#22d3ee"/>
//           </marker>
//           <marker id="rarrr" markerWidth="7" markerHeight="6" refX="6" refY="3" orient="auto">
//             <polygon points="0 0,7 3,0 6" fill="#f87171"/>
//           </marker>
//           <marker id="garrr" markerWidth="7" markerHeight="6" refX="6" refY="3" orient="auto">
//             <polygon points="0 0,7 3,0 6" fill="#4ade80"/>
//           </marker>
//         </defs>
//         {/* STACK */}
//         <rect x="8" y="8" width="210" height="198" rx="12" fill="rgba(245,158,11,.05)" stroke="#f59e0b" strokeWidth="1.5"/>
//         <text x="113" y="30" textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="700">STACK</text>
//         {[
//           { label:'String a = "Java"',          c:"#22d3ee" },
//           { label:'String b = "Java"',          c:"#22d3ee" },
//           { label:'String c = new String("Java")',c:"#f87171" },
//           { label:'StringBuilder sb',           c:"#4ade80" },
//         ].map((r, i) => (
//           <g key={i}>
//             <rect x="20" y={42+i*38} width="186" height="28" rx="5"
//               fill={`rgba(${r.c==="#22d3ee"?"34,211,238":r.c==="#f87171"?"248,113,113":"74,222,128"},.1)`}
//               stroke={r.c} strokeWidth="0.8"/>
//             <text x="28" y={60+i*38} fill="#e2e8f0" fontSize={i===2?9.5:11} fontFamily="monospace">{r.label}</text>
//           </g>
//         ))}
//         {/* String Pool */}
//         <rect x="268" y="8" width="190" height="130" rx="12" fill="rgba(34,211,238,.06)" stroke="#22d3ee" strokeWidth="1.5"/>
//         <text x="363" y="30" textAnchor="middle" fill="#22d3ee" fontSize="12" fontWeight="700">String Pool (Heap)</text>
//         <rect x="282" y="42" width="162" height="34" rx="7" fill="rgba(34,211,238,.15)" stroke="#22d3ee" strokeWidth="1"/>
//         <text x="363" y="64" textAnchor="middle" fill="#f8f8f2" fontSize="14" fontFamily="monospace" fontWeight="700">"Java"</text>
//         <rect x="282" y="86" width="162" height="28" rx="7" fill="rgba(34,211,238,.06)" stroke="#22d3ee" strokeWidth="1" strokeDasharray="4,2"/>
//         <text x="363" y="104" textAnchor="middle" fill="#4b5563" fontSize="10">"Python"  (other interned string)</text>
//         {/* new String heap */}
//         <rect x="268" y="155" width="190" height="50" rx="12" fill="rgba(248,113,113,.07)" stroke="#f87171" strokeWidth="1.5"/>
//         <text x="363" y="175" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="700">Heap — new String()</text>
//         <text x="363" y="194" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="monospace">"Java"  (separate copy)</text>
//         {/* StringBuilder */}
//         <rect x="506" y="155" width="168" height="50" rx="12" fill="rgba(74,222,128,.07)" stroke="#4ade80" strokeWidth="1.5"/>
//         <text x="590" y="175" textAnchor="middle" fill="#4ade80" fontSize="11" fontWeight="700">StringBuilder</text>
//         <text x="590" y="194" textAnchor="middle" fill="#94a3b8" fontSize="10">char[] — mutable buffer</text>
//         {/* Immutability box */}
//         <rect x="506" y="8" width="168" height="130" rx="12" fill="rgba(245,158,11,.05)" stroke="#f59e0b" strokeWidth="1"/>
//         <text x="590" y="30" textAnchor="middle" fill="#f59e0b" fontSize="11" fontWeight="700">Immutability</text>
//         {['String s = "Hi";', 's += " World";', '// "Hi" still in pool', '// NEW obj created', '// s points to new'].map((l,i)=>(
//           <text key={i} x="518" y={50+i*18} fill={i>=2?"#4b5563":"#f8f8f2"} fontSize="10" fontFamily="monospace">{l}</text>
//         ))}
//         {/* arrows */}
//         <line x1="206" y1="56" x2="266" y2="59" stroke="#22d3ee" strokeWidth="1.5" markerEnd="url(#sarr)"/>
//         <line x1="206" y1="94" x2="266" y2="63" stroke="#22d3ee" strokeWidth="1.5" markerEnd="url(#sarr)"/>
//         <text x="230" y="50" fill="#22d3ee" fontSize="9" fontWeight="700">same ref!</text>
//         <line x1="206" y1="132" x2="266" y2="172" stroke="#f87171" strokeWidth="1.5" markerEnd="url(#rarrr)"/>
//         <text x="222" y="149" fill="#f87171" fontSize="9">new obj</text>
//         <line x1="206" y1="170" x2="504" y2="178" stroke="#4ade80" strokeWidth="1.5" markerEnd="url(#garrr)"/>
//       </svg>
//       <div style={{ display:"flex", gap:20, marginTop:10, flexWrap:"wrap" }}>
//         {[
//           { c:"#22d3ee", t:'a == b → true  (same pool reference)' },
//           { c:"#f87171", t:'a == c → false (different heap object)' },
//           { c:"#4ade80", t:'a.equals(c) → true  (same characters)' },
//         ].map(r => (
//           <div key={r.t} style={{ display:"flex", alignItems:"center", gap:7 }}>
//             <div style={{ width:8, height:8, borderRadius:2, background:r.c }}/>
//             <span style={{ color:C.muted, fontSize:11, fontFamily:"monospace" }}>{r.t}</span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────
// // DIAGRAM — CLASS BLUEPRINT → OBJECTS
// // ─────────────────────────────────────────────────────────────
// export function DiagramClassObject() {
//   const instances = [
//     { name:"dog1", vals:['name="Buddy"','breed="Lab"','age=3'],    c:"#4ade80" },
//     { name:"dog2", vals:['name="Max"','breed="Husky"','age=5'],    c:"#22d3ee" },
//     { name:"dog3", vals:['name="Luna"','breed="Poodle"','age=2'],  c:"#a78bfa" },
//   ];
//   return (
//     <div style={{ background:C.card, borderRadius:14, padding:24, border:`1px solid ${C.border}`, margin:"24px 0" }}>
//       <h4 style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:1, marginBottom:20, textTransform:"uppercase" }}>
//         Class = Blueprint · Object = Instance
//       </h4>
//       <div style={{ display:"flex", alignItems:"center", gap:24, flexWrap:"wrap" }}>
//         {/* Blueprint */}
//         <div style={{ background:"rgba(245,158,11,.08)", border:`2px solid ${C.java}`, borderRadius:14, padding:20, minWidth:210, flexShrink:0 }}>
//           <div style={{ color:C.java, fontSize:13, fontWeight:800, marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
//             📐 Dog <span style={{ color:C.dim, fontSize:10, fontWeight:400 }}>(class / blueprint)</span>
//           </div>
//           <div style={{ color:C.muted, fontSize:10, marginBottom:5, fontWeight:700, letterSpacing:.5 }}>FIELDS</div>
//           {["String  name","String  breed","int     age"].map(f=>(
//             <div key={f} style={{ color:"#8be9fd", fontSize:11, fontFamily:"monospace", padding:"2px 0" }}>{f}</div>
//           ))}
//           <div style={{ color:C.muted, fontSize:10, margin:"10px 0 5px", fontWeight:700, letterSpacing:.5 }}>CONSTRUCTOR &amp; METHODS</div>
//           {["Dog(name, breed, age)","void  bark()","String toString()"].map(m=>(
//             <div key={m} style={{ color:"#50fa7b", fontSize:11, fontFamily:"monospace", padding:"2px 0" }}>{m}</div>
//           ))}
//         </div>
//         {/* Arrow */}
//         <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
//           <span style={{ color:C.java, fontSize:22 }}>→</span>
//           <span style={{ color:C.dim, fontSize:10, whiteSpace:"nowrap" }}>new Dog()</span>
//         </div>
//         {/* Instances */}
//         <div style={{ flex:1, display:"flex", flexDirection:"column", gap:10, minWidth:200 }}>
//           {instances.map(obj=>(
//             <div key={obj.name} style={{
//               background:`rgba(${obj.c==="#4ade80"?"74,222,128":obj.c==="#22d3ee"?"34,211,238":"167,139,250"},.08)`,
//               border:`1px solid ${obj.c}`, borderRadius:10, padding:"10px 16px",
//               display:"flex", alignItems:"center", gap:16,
//             }}>
//               <span style={{ color:obj.c, fontSize:12, fontWeight:700, fontFamily:"monospace", minWidth:46 }}>🐕 {obj.name}</span>
//               <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
//                 {obj.vals.map(v=>(
//                   <span key={v} style={{ color:C.muted, fontSize:11, fontFamily:"monospace" }}>{v}</span>
//                 ))}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//       <div style={{ marginTop:16, padding:"10px 14px", background:"rgba(255,255,255,.03)", borderRadius:8 }}>
//         <span style={{ color:C.java, fontWeight:700, fontSize:12 }}>Key idea: </span>
//         <span style={{ color:C.muted, fontSize:12 }}>One class → unlimited objects. Each object owns its field values. All objects share the same methods. <code style={{ color:"#f1fa8c" }}>this</code> refers to the current instance inside methods.</span>
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────
// // DIAGRAM — INHERITANCE HIERARCHY
// // ─────────────────────────────────────────────────────────────
// export function DiagramInheritance() {
//   return (
//     <div style={{ background:C.card, borderRadius:14, padding:24, border:`1px solid ${C.border}`, margin:"24px 0" }}>
//       <h4 style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:1, marginBottom:20, textTransform:"uppercase" }}>
//         Inheritance Hierarchy — IS-A Relationship
//       </h4>
//       <svg viewBox="0 0 680 280" style={{ width:"100%", display:"block" }}>
//         <defs>
//           <marker id="iharr" markerWidth="10" markerHeight="8" refX="1" refY="4" orient="auto">
//             <polygon points="10 0,10 8,0 4" fill="none" stroke="#4b5563" strokeWidth="1.2"/>
//           </marker>
//         </defs>
//         {/* Object (root) */}
//         <rect x="265" y="6" width="150" height="36" rx="8" fill="rgba(255,255,255,.03)" stroke="#4b5563" strokeWidth="1" strokeDasharray="4,3"/>
//         <text x="340" y="28" textAnchor="middle" fill="#4b5563" fontSize="11" fontWeight="600">Object  (root of all)</text>
//         <line x1="340" y1="42" x2="340" y2="60" stroke="#4b5563" strokeWidth="1.2" strokeDasharray="4,3"/>

//         {/* Animal */}
//         <rect x="220" y="60" width="240" height="52" rx="12" fill="rgba(245,158,11,.12)" stroke="#f59e0b" strokeWidth="2"/>
//         <text x="340" y="82"  textAnchor="middle" fill="#f59e0b" fontSize="14" fontWeight="800">Animal 🐾</text>
//         <text x="340" y="100" textAnchor="middle" fill="#94a3b8" fontSize="10">eat()  sleep()  breathe()  toString()</text>

//         {/* Lines down */}
//         <line x1="340" y1="112" x2="340" y2="132" stroke="#4b5563" strokeWidth="1.5"/>
//         <line x1="100" y1="132" x2="580" y2="132" stroke="#4b5563" strokeWidth="1.5"/>
//         {[100, 340, 580].map(x => <line key={x} x1={x} y1="132" x2={x} y2="148" stroke="#4b5563" strokeWidth="1.5"/>)}

//         {/* Dog */}
//         <rect x="18" y="148" width="164" height="52" rx="10" fill="rgba(74,222,128,.1)" stroke="#4ade80" strokeWidth="1.5"/>
//         <text x="100" y="170" textAnchor="middle" fill="#4ade80" fontSize="13" fontWeight="700">Dog 🐕</text>
//         <text x="100" y="187" textAnchor="middle" fill="#94a3b8" fontSize="10">bark()  fetch()  @Override eat()</text>
//         <text x="100" y="143" textAnchor="middle" fill="#f59e0b" fontSize="9">extends Animal</text>

//         {/* Cat */}
//         <rect x="258" y="148" width="164" height="52" rx="10" fill="rgba(167,139,250,.1)" stroke="#a78bfa" strokeWidth="1.5"/>
//         <text x="340" y="170" textAnchor="middle" fill="#a78bfa" fontSize="13" fontWeight="700">Cat 🐱</text>
//         <text x="340" y="187" textAnchor="middle" fill="#94a3b8" fontSize="10">meow()  purr()  @Override eat()</text>
//         <text x="340" y="143" textAnchor="middle" fill="#f59e0b" fontSize="9">extends Animal</text>

//         {/* Bird */}
//         <rect x="498" y="148" width="164" height="52" rx="10" fill="rgba(34,211,238,.1)" stroke="#22d3ee" strokeWidth="1.5"/>
//         <text x="580" y="170" textAnchor="middle" fill="#22d3ee" fontSize="13" fontWeight="700">Bird 🐦</text>
//         <text x="580" y="187" textAnchor="middle" fill="#94a3b8" fontSize="10">fly()  chirp()  @Override eat()</text>
//         <text x="580" y="143" textAnchor="middle" fill="#f59e0b" fontSize="9">extends Animal</text>

//         {/* GoldenRetriever extends Dog */}
//         <line x1="100" y1="200" x2="100" y2="220" stroke="#4b5563" strokeWidth="1.5"/>
//         <rect x="18" y="220" width="164" height="50" rx="8" fill="rgba(74,222,128,.06)" stroke="#4ade80" strokeWidth="1" strokeDasharray="5,3"/>
//         <text x="100" y="240" textAnchor="middle" fill="#4ade80" fontSize="12" fontWeight="600">GoldenRetriever 🏅</text>
//         <text x="100" y="257" textAnchor="middle" fill="#94a3b8" fontSize="9">retrieve()  swim()  guide()</text>
//         <text x="100" y="215" textAnchor="middle" fill="#4ade80" fontSize="9">extends Dog</text>

//         {/* super() label */}
//         <rect x="400" y="220" width="230" height="52" rx="8" fill="rgba(245,158,11,.05)" stroke="rgba(245,158,11,.3)" strokeWidth="1"/>
//         <text x="515" y="238" textAnchor="middle" fill="#f59e0b" fontSize="11" fontWeight="700">super() call chain</text>
//         <text x="515" y="254" textAnchor="middle" fill="#94a3b8" fontSize="10">GoldenRetriever → Dog → Animal → Object</text>
//         <text x="515" y="268" textAnchor="middle" fill="#4b5563" fontSize="9">each constructor calls super() first</text>
//       </svg>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────
// // DIAGRAM — POLYMORPHISM
// // ─────────────────────────────────────────────────────────────
// export function DiagramPolymorphism() {
//   return (
//     <div style={{ background:C.card, borderRadius:14, padding:24, border:`1px solid ${C.border}`, margin:"24px 0" }}>
//       <h4 style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:1, marginBottom:20, textTransform:"uppercase" }}>
//         Polymorphism — One Reference, Many Behaviours
//       </h4>
//       <svg viewBox="0 0 700 220" style={{ width:"100%", display:"block" }}>
//         <defs>
//           <marker id="parr" markerWidth="7" markerHeight="6" refX="6" refY="3" orient="auto">
//             <polygon points="0 0,7 3,0 6" fill="#94a3b8"/>
//           </marker>
//         </defs>

//         {/* Abstract Shape */}
//         <rect x="225" y="8" width="250" height="52" rx="12" fill="rgba(34,211,238,.08)" stroke="#22d3ee" strokeWidth="2" strokeDasharray="6,3"/>
//         <text x="350" y="30" textAnchor="middle" fill="#22d3ee" fontSize="12" fontWeight="700">«abstract» Shape</text>
//         <text x="350" y="50" textAnchor="middle" fill="#94a3b8" fontSize="10">abstract double area()  |  void draw()</text>

//         {/* Lines */}
//         <line x1="350" y1="60" x2="350" y2="80" stroke="#4b5563" strokeWidth="1.5"/>
//         <line x1="115" y1="80" x2="585" y2="80" stroke="#4b5563" strokeWidth="1.5"/>
//         {[115, 350, 585].map(x => <line key={x} x1={x} y1="80" x2={x} y2="96" stroke="#4b5563" strokeWidth="1.5"/>)}

//         {/* Circle */}
//         <rect x="30" y="96" width="170" height="64" rx="10" fill="rgba(245,158,11,.1)" stroke="#f59e0b" strokeWidth="1.5"/>
//         <text x="115" y="118" textAnchor="middle" fill="#f59e0b" fontSize="13" fontWeight="700">Circle  🔵</text>
//         <text x="115" y="135" textAnchor="middle" fill="#94a3b8" fontSize="10">@Override area()</text>
//         <text x="115" y="150" textAnchor="middle" fill="#f1fa8c" fontSize="10" fontFamily="monospace">→ π × r²</text>

//         {/* Rectangle */}
//         <rect x="265" y="96" width="170" height="64" rx="10" fill="rgba(74,222,128,.1)" stroke="#4ade80" strokeWidth="1.5"/>
//         <text x="350" y="118" textAnchor="middle" fill="#4ade80" fontSize="13" fontWeight="700">Rectangle  🟦</text>
//         <text x="350" y="135" textAnchor="middle" fill="#94a3b8" fontSize="10">@Override area()</text>
//         <text x="350" y="150" textAnchor="middle" fill="#f1fa8c" fontSize="10" fontFamily="monospace">→ w × h</text>

//         {/* Triangle */}
//         <rect x="500" y="96" width="170" height="64" rx="10" fill="rgba(167,139,250,.1)" stroke="#a78bfa" strokeWidth="1.5"/>
//         <text x="585" y="118" textAnchor="middle" fill="#a78bfa" fontSize="13" fontWeight="700">Triangle  🔺</text>
//         <text x="585" y="135" textAnchor="middle" fill="#94a3b8" fontSize="10">@Override area()</text>
//         <text x="585" y="150" textAnchor="middle" fill="#f1fa8c" fontSize="10" fontFamily="monospace">→ ½ × b × h</text>

//         {/* Polymorphic call section */}
//         <rect x="30" y="178" width="640" height="36" rx="8" fill="rgba(255,255,255,.03)" stroke="#2a2a5e" strokeWidth="1"/>
//         <text x="350" y="192" textAnchor="middle" fill="#f59e0b" fontSize="11" fontFamily="monospace" fontWeight="700">Shape s = new Circle(5);</text>
//         <text x="350" y="207" textAnchor="middle" fill="#94a3b8" fontSize="10">s.area() → JVM decides at runtime which area() to call  (Dynamic Dispatch)</text>
//       </svg>

//       {/* Two types */}
//       <div style={{ display:"flex", gap:16, marginTop:8, flexWrap:"wrap" }}>
//         {[
//           { label:"Compile-time (Overloading)", desc:"Same method name, different params — resolved by compiler", c:"#f59e0b" },
//           { label:"Runtime (Overriding)",        desc:"@Override in subclass — JVM picks the right version at runtime", c:"#4ade80" },
//         ].map(r => (
//           <div key={r.label} style={{ flex:1, minWidth:200, padding:"10px 14px", background:"rgba(255,255,255,.02)", borderRadius:8, borderLeft:`3px solid ${r.c}` }}>
//             <div style={{ color:r.c, fontSize:12, fontWeight:700, marginBottom:4 }}>{r.label}</div>
//             <div style={{ color:C.muted, fontSize:11 }}>{r.desc}</div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────
// // DIAGRAM — ABSTRACTION
// // ─────────────────────────────────────────────────────────────
// export function DiagramAbstraction() {
//   return (
//     <div style={{ background:C.card, borderRadius:14, padding:24, border:`1px solid ${C.border}`, margin:"24px 0" }}>
//       <h4 style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:1, marginBottom:20, textTransform:"uppercase" }}>
//         Abstract Class vs Concrete Class vs Interface
//       </h4>
//       <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:20 }}>
//         {[
//           {
//             title:"Abstract Class",
//             icon:"🏛",
//             color:"#f59e0b",
//             lines:[
//               "abstract class Vehicle",
//               "─────────────────────",
//               "String brand  (field ✓)",
//               "void refuel()  (method ✓)",
//               "abstract void drive() ← must override",
//               "────────────────────",
//               "cannot be instantiated",
//               "new Vehicle() ✗",
//             ],
//           },
//           {
//             title:"Concrete Subclass",
//             icon:"🚗",
//             color:"#4ade80",
//             lines:[
//               "class Car extends Vehicle",
//               "─────────────────────────",
//               "int doors  (own field)",
//               "@Override void drive()",
//               "  { // must provide body }",
//               "──────────────────────",
//               "can be instantiated ✓",
//               "new Car() ✓",
//             ],
//           },
//           {
//             title:"Interface",
//             icon:"🔌",
//             color:"#22d3ee",
//             lines:[
//               "interface Chargeable",
//               "────────────────────",
//               "void charge()  (abstract)",
//               "default void showBattery()",
//               "int MAX_CHARGE = 100",
//               "────────────────────",
//               "class EV extends Car",
//               "  implements Chargeable",
//             ],
//           },
//         ].map(col => (
//           <div key={col.title} style={{ background:"rgba(255,255,255,.02)", border:`1px solid ${col.color}`, borderRadius:12, padding:14 }}>
//             <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
//               <span style={{ fontSize:18 }}>{col.icon}</span>
//               <span style={{ color:col.color, fontWeight:700, fontSize:12 }}>{col.title}</span>
//             </div>
//             {col.lines.map((l, i) => (
//               <div key={i} style={{
//                 color: l.startsWith("─") ? C.border : l.includes("✗") ? C.error : l.includes("✓") || l.includes("@Override") ? C.success : l.includes("abstract") ? col.color : C.muted,
//                 fontSize:10, fontFamily:"monospace", padding:"1px 0", lineHeight:1.6,
//               }}>{l}</div>
//             ))}
//           </div>
//         ))}
//       </div>
//       <div style={{ padding:"10px 14px", background:"rgba(245,158,11,.06)", borderRadius:8 }}>
//         <span style={{ color:C.java, fontWeight:700, fontSize:12 }}>Rule: </span>
//         <span style={{ color:C.muted, fontSize:12 }}>
//           Abstract class = partial implementation + shared state. Interface = pure contract (what, not how).
//           A class can <code style={{ color:"#f1fa8c" }}>extend</code> only <strong style={{ color:C.text }}>one</strong> abstract class but <code style={{ color:"#f1fa8c" }}>implement</code> <strong style={{ color:C.text }}>many</strong> interfaces.
//         </span>
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────
// // DIAGRAM — ENCAPSULATION
// // ─────────────────────────────────────────────────────────────
// export function DiagramEncapsulation() {
//   return (
//     <div style={{ background:C.card, borderRadius:14, padding:24, border:`1px solid ${C.border}`, margin:"24px 0" }}>
//       <h4 style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:1, marginBottom:20, textTransform:"uppercase" }}>
//         Encapsulation — Private Fields Behind a Controlled Gate
//       </h4>
//       <div style={{ display:"flex", gap:20, alignItems:"stretch", flexWrap:"wrap" }}>

//         {/* Outside world */}
//         <div style={{ flex:"0 0 auto", display:"flex", flexDirection:"column", gap:8, justifyContent:"center" }}>
//           <div style={{ color:C.muted, fontSize:11, fontWeight:700, marginBottom:4, textAlign:"center" }}>Outside World</div>
//           {["user.setAge(25)", "user.setName(\"Alice\")", "int a = user.getAge()", "String n = user.getName()"].map((c,i) => (
//             <div key={i} style={{ background:"rgba(34,211,238,.08)", border:"1px solid rgba(34,211,238,.3)", borderRadius:7, padding:"6px 12px", fontFamily:"monospace", fontSize:11, color:"#8be9fd" }}>{c}</div>
//           ))}
//         </div>

//         {/* Arrow in */}
//         <div style={{ display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", gap:4 }}>
//           <div style={{ color:"#4ade80", fontSize:18 }}>→</div>
//           <div style={{ color:"#4b5563", fontSize:9, textAlign:"center" }}>validated<br/>access</div>
//           <div style={{ color:"#f87171", fontSize:18 }}>←</div>
//         </div>

//         {/* Class box */}
//         <div style={{ flex:1, minWidth:220, background:"rgba(251,146,60,.06)", border:`2px solid ${C.oop}`, borderRadius:14, padding:18 }}>
//           <div style={{ color:C.oop, fontWeight:800, fontSize:13, marginBottom:14 }}>🔒 BankAccount</div>

//           {/* Private fields */}
//           <div style={{ background:"rgba(248,113,113,.1)", border:"1px solid rgba(248,113,113,.35)", borderRadius:8, padding:"10px 14px", marginBottom:12 }}>
//             <div style={{ color:C.error, fontSize:10, fontWeight:700, marginBottom:6, letterSpacing:.5 }}>PRIVATE FIELDS (hidden)</div>
//             {["private String owner", "private double balance", "private String pin"].map(f => (
//               <div key={f} style={{ color:"#f8f8f2", fontSize:11, fontFamily:"monospace", padding:"2px 0" }}>{f}</div>
//             ))}
//           </div>

//           {/* Getters/Setters */}
//           <div style={{ background:"rgba(74,222,128,.08)", border:"1px solid rgba(74,222,128,.3)", borderRadius:8, padding:"10px 14px" }}>
//             <div style={{ color:C.success, fontSize:10, fontWeight:700, marginBottom:6, letterSpacing:.5 }}>PUBLIC GETTERS / SETTERS (gate)</div>
//             {[
//               "getOwner()  → returns owner",
//               "getBalance() → returns balance",
//               "setBalance(amt) → validates amt ≥ 0",
//               "deposit(amt)   → adds if amt > 0",
//             ].map(m => (
//               <div key={m} style={{ color:"#94a3b8", fontSize:10, fontFamily:"monospace", padding:"2px 0" }}>{m}</div>
//             ))}
//           </div>
//         </div>
//       </div>

//       <div style={{ marginTop:14, padding:"9px 14px", background:"rgba(251,146,60,.06)", borderRadius:8 }}>
//         <span style={{ color:C.oop, fontWeight:700, fontSize:12 }}>Why? </span>
//         <span style={{ color:C.muted, fontSize:12 }}>
//           Setters can <strong style={{color:C.text}}>validate</strong> data before storing it.
//           Nobody can set <code style={{color:"#f1fa8c"}}>balance = -1000</code> from outside — the setter rejects invalid values.
//           Direct field access (<code style={{color:"#f1fa8c"}}>obj.balance = -1000</code>) is blocked by <code style={{color:"#f1fa8c"}}>private</code>.
//         </span>
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────
// // DIAGRAM — INTERFACES (multiple implementation)
// // ─────────────────────────────────────────────────────────────
// export function DiagramInterfaces() {
//   return (
//     <div style={{ background:C.card, borderRadius:14, padding:24, border:`1px solid ${C.border}`, margin:"24px 0" }}>
//       <h4 style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:1, marginBottom:20, textTransform:"uppercase" }}>
//         Interfaces — Multiple Contracts, One Class
//       </h4>
//       <svg viewBox="0 0 700 240" style={{ width:"100%", display:"block" }}>
//         <defs>
//           <marker id="iarr" markerWidth="10" markerHeight="8" refX="1" refY="4" orient="auto">
//             <polygon points="10 0,10 8,0 4" fill="none" stroke="#4b5563" strokeWidth="1.5"/>
//           </marker>
//         </defs>

//         {/* Interface: Flyable */}
//         <rect x="10"  y="30" width="180" height="80" rx="12" fill="rgba(245,158,11,.08)" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="6,3"/>
//         <text x="100" y="54"  textAnchor="middle" fill="#f59e0b" fontSize="11" fontWeight="700">«interface» Flyable</text>
//         <text x="100" y="72"  textAnchor="middle" fill="#94a3b8" fontSize="10">void fly()</text>
//         <text x="100" y="88"  textAnchor="middle" fill="#94a3b8" fontSize="10">int getAltitude()</text>
//         <text x="100" y="103" textAnchor="middle" fill="#4b5563" fontSize="9">default land() &#123; &hellip; &#125;</text>

//         {/* Interface: Swimmable */}
//         <rect x="510" y="30" width="180" height="80" rx="12" fill="rgba(34,211,238,.08)" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="6,3"/>
//         <text x="600" y="54"  textAnchor="middle" fill="#22d3ee" fontSize="11" fontWeight="700">«interface» Swimmable</text>
//         <text x="600" y="72"  textAnchor="middle" fill="#94a3b8" fontSize="10">void swim()</text>
//         <text x="600" y="88"  textAnchor="middle" fill="#94a3b8" fontSize="10">int getDepth()</text>
//         <text x="600" y="103" textAnchor="middle" fill="#4b5563" fontSize="9">default float() &#123; &hellip; &#125;</text>

//         {/* Interface: Feedable */}
//         <rect x="260" y="8" width="180" height="62" rx="12" fill="rgba(167,139,250,.08)" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="6,3"/>
//         <text x="350" y="30"  textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="700">«interface» Feedable</text>
//         <text x="350" y="48"  textAnchor="middle" fill="#94a3b8" fontSize="10">void eat(String food)</text>
//         <text x="350" y="63"  textAnchor="middle" fill="#4b5563" fontSize="9">boolean isHungry()</text>

//         {/* Duck in centre */}
//         <rect x="250" y="135" width="200" height="90" rx="14" fill="rgba(74,222,128,.1)" stroke="#4ade80" strokeWidth="2"/>
//         <text x="350" y="160" textAnchor="middle" fill="#4ade80" fontSize="15" fontWeight="800">Duck 🦆</text>
//         <text x="350" y="178" textAnchor="middle" fill="#94a3b8" fontSize="10">implements Flyable,</text>
//         <text x="350" y="193" textAnchor="middle" fill="#94a3b8" fontSize="10">Swimmable, Feedable</text>
//         <text x="350" y="214" textAnchor="middle" fill="#4b5563" fontSize="9">must implement all abstract methods</text>

//         {/* Lines from interfaces to Duck */}
//         <line x1="190" y1="70"  x2="280" y2="155" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5,3" markerEnd="url(#iarr)"/>
//         <line x1="350" y1="70"  x2="350" y2="133" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="5,3" markerEnd="url(#iarr)"/>
//         <line x1="510" y1="70"  x2="420" y2="155" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="5,3" markerEnd="url(#iarr)"/>

//         {/* implements labels */}
//         <text x="218" y="106" fill="#f59e0b" fontSize="9" transform="rotate(-28,218,106)">implements</text>
//         <text x="310" y="102" fill="#a78bfa" fontSize="9">implements</text>
//         <text x="452" y="106" fill="#22d3ee" fontSize="9" transform="rotate(28,452,106)">implements</text>
//       </svg>
//       <div style={{ display:"flex", gap:14, marginTop:4, flexWrap:"wrap" }}>
//         {[
//           { c:"#f59e0b", t:"Flyable f = new Duck() — use as Flyable only" },
//           { c:"#22d3ee", t:"Swimmable s = new Duck() — use as Swimmable" },
//           { c:"#4ade80", t:"One Duck object satisfies 3 contracts" },
//         ].map(r => (
//           <div key={r.t} style={{ display:"flex", alignItems:"center", gap:7 }}>
//             <div style={{ width:8, height:8, borderRadius:2, background:r.c, flexShrink:0 }}/>
//             <span style={{ color:C.muted, fontSize:11 }}>{r.t}</span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────
// // DIAGRAM — COLLECTIONS FRAMEWORK
// // ─────────────────────────────────────────────────────────────
// export function DiagramCollections() {
//   return (
//     <div style={{ background:C.card, borderRadius:14, padding:24, border:`1px solid ${C.border}`, margin:"24px 0" }}>
//       <h4 style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:1, marginBottom:20, textTransform:"uppercase" }}>
//         Java Collections Framework — Choose the Right Tool
//       </h4>

//       {/* Visual comparison of 3 main types */}
//       <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:20 }}>
//         {[
//           {
//             title:"📋 List",  color:"#f59e0b",
//             sub:"Ordered · Duplicates ✓ · Index access",
//             impls:["ArrayList — fast random access O(1)", "LinkedList — fast insert/delete O(1)"],
//             rows:["[0] \"Alice\"","[1] \"Bob\"","[2] \"Alice\" ← dup OK","[3] \"Charlie\""],
//           },
//           {
//             title:"🎯 Set",   color:"#a78bfa",
//             sub:"Unique values · No duplicates",
//             impls:["HashSet — O(1) add/lookup, unordered", "TreeSet — sorted, O(log n)", "LinkedHashSet — insertion order"],
//             rows:["\"Alice\"","\"Bob\"","\"Charlie\"","(\"Alice\" again → ignored)"],
//           },
//           {
//             title:"🗺  Map",  color:"#22d3ee",
//             sub:"Key → Value pairs · Keys unique",
//             impls:["HashMap — O(1) get/put, unordered", "TreeMap — sorted by key", "LinkedHashMap — insertion order"],
//             rows:["\"name\" → \"Alice\"","\"age\"  → 25","\"city\" → \"NYC\"","(same key → overwrites)"],
//           },
//         ].map(col => (
//           <div key={col.title} style={{ background:"rgba(255,255,255,.02)", border:`1px solid ${col.color}`, borderRadius:12, padding:14 }}>
//             <div style={{ color:col.color, fontSize:13, fontWeight:700, marginBottom:4 }}>{col.title}</div>
//             <div style={{ color:C.dim, fontSize:10, marginBottom:10 }}>{col.sub}</div>
//             {col.rows.map((r,i) => (
//               <div key={i} style={{
//                 background:`rgba(${col.color==="#f59e0b"?"245,158,11":col.color==="#a78bfa"?"167,139,250":"34,211,238"},.1)`,
//                 border:`1px solid rgba(${col.color==="#f59e0b"?"245,158,11":col.color==="#a78bfa"?"167,139,250":"34,211,238"},.25)`,
//                 borderRadius:5, padding:"4px 8px", marginBottom:4,
//                 color: i===3?"#4b5563":"#f8f8f2", fontSize:10, fontFamily:"monospace",
//               }}>{r}</div>
//             ))}
//             <div style={{ marginTop:10 }}>
//               {col.impls.map(im => (
//                 <div key={im} style={{ color:C.dim, fontSize:9, padding:"2px 0" }}>• {im}</div>
//               ))}
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Queue row */}
//       <div style={{ background:"rgba(255,255,255,.02)", border:`1px solid rgba(74,222,128,.3)`, borderRadius:10, padding:"12px 16px", display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
//         <div>
//           <span style={{ color:C.success, fontWeight:700, fontSize:12 }}>🚶 Queue / Deque  </span>
//           <span style={{ color:C.dim, fontSize:10 }}>FIFO (first in, first out)</span>
//         </div>
//         <div style={{ display:"flex", alignItems:"center", gap:6 }}>
//           <div style={{ color:"#4ade80", fontSize:11, fontFamily:"monospace" }}>offer("A") →</div>
//           {["A","B","C","D"].map((v,i)=>(
//             <div key={i} style={{ background:"rgba(74,222,128,.12)", border:"1px solid rgba(74,222,128,.35)", borderRadius:5, padding:"4px 10px", color:"#f8f8f2", fontSize:12, fontWeight:700 }}>{v}</div>
//           ))}
//           <div style={{ color:"#f87171", fontSize:11, fontFamily:"monospace" }}>→ poll() = "A"</div>
//         </div>
//         <div style={{ color:C.dim, fontSize:10 }}>ArrayDeque, LinkedList, PriorityQueue</div>
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────
// // DIAGRAM — EXCEPTION HIERARCHY
// // ─────────────────────────────────────────────────────────────
// export function DiagramExceptions() {
//   return (
//     <div style={{ background:C.card, borderRadius:14, padding:24, border:`1px solid ${C.border}`, margin:"24px 0" }}>
//       <h4 style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:1, marginBottom:20, textTransform:"uppercase" }}>
//         Exception Hierarchy &amp; try-catch-finally Flow
//       </h4>
//       <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>

//         {/* Hierarchy tree */}
//         <div>
//           <div style={{ color:C.muted, fontSize:11, fontWeight:700, marginBottom:12 }}>Class Hierarchy</div>
//           <svg viewBox="0 0 300 260" style={{ width:"100%", display:"block" }}>
//             {/* Throwable */}
//             <rect x="75" y="6" width="150" height="32" rx="8" fill="rgba(248,113,113,.15)" stroke="#f87171" strokeWidth="1.5"/>
//             <text x="150" y="26" textAnchor="middle" fill="#f87171" fontSize="12" fontWeight="700">Throwable</text>
//             <line x1="150" y1="38" x2="150" y2="55" stroke="#4b5563" strokeWidth="1.5"/>
//             <line x1="70"  y1="55" x2="230" y2="55" stroke="#4b5563" strokeWidth="1.5"/>
//             {[70,230].map(x=><line key={x} x1={x} y1="55" x2={x} y2="70" stroke="#4b5563" strokeWidth="1.5"/>)}

//             {/* Error */}
//             <rect x="10" y="70" width="110" height="30" rx="7" fill="rgba(248,113,113,.1)" stroke="#f87171" strokeWidth="1"/>
//             <text x="65" y="88" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="600">Error</text>
//             <text x="65" y="116" textAnchor="middle" fill="#4b5563" fontSize="9">OutOfMemoryError</text>
//             <text x="65" y="128" textAnchor="middle" fill="#4b5563" fontSize="9">StackOverflowError</text>
//             <text x="65" y="140" textAnchor="middle" fill="#f87171" fontSize="9">don't catch these</text>

//             {/* Exception */}
//             <rect x="170" y="70" width="120" height="30" rx="7" fill="rgba(245,158,11,.12)" stroke="#f59e0b" strokeWidth="1.5"/>
//             <text x="230" y="88" textAnchor="middle" fill="#f59e0b" fontSize="11" fontWeight="700">Exception</text>
//             <line x1="230" y1="100" x2="230" y2="118" stroke="#4b5563" strokeWidth="1.5"/>
//             <line x1="175" y1="118" x2="285" y2="118" stroke="#4b5563" strokeWidth="1.5"/>
//             {[175,285].map(x=><line key={x} x1={x} y1="118" x2={x} y2="132" stroke="#4b5563" strokeWidth="1.5"/>)}

//             {/* Checked */}
//             <rect x="130" y="132" width="96" height="28" rx="6" fill="rgba(74,222,128,.1)" stroke="#4ade80" strokeWidth="1"/>
//             <text x="178" y="148" textAnchor="middle" fill="#4ade80" fontSize="10" fontWeight="600">Checked</text>
//             <text x="130" y="173" fill="#4b5563" fontSize="8" fontFamily="monospace">IOException</text>
//             <text x="130" y="185" fill="#4b5563" fontSize="8" fontFamily="monospace">SQLException</text>
//             <text x="130" y="197" fill="#4ade80" fontSize="8">compiler forces try/catch</text>

//             {/* Unchecked */}
//             <rect x="238" y="132" width="56" height="28" rx="6" fill="rgba(167,139,250,.1)" stroke="#a78bfa" strokeWidth="1"/>
//             <text x="266" y="148" textAnchor="middle" fill="#a78bfa" fontSize="9" fontWeight="600">Runtime</text>
//             <text x="238" y="173" fill="#4b5563" fontSize="8" fontFamily="monospace">NullPointer</text>
//             <text x="238" y="185" fill="#4b5563" fontSize="8" fontFamily="monospace">ArrayIndex…</text>
//             <text x="238" y="197" fill="#a78bfa" fontSize="8">optional catch</text>

//             <text x="150" y="225" textAnchor="middle" fill="#4b5563" fontSize="9">Custom: class AppException extends RuntimeException</text>
//           </svg>
//         </div>

//         {/* try-catch-finally flow */}
//         <div>
//           <div style={{ color:C.muted, fontSize:11, fontWeight:700, marginBottom:12 }}>try-catch-finally Execution</div>
//           {[
//             { block:"try { }", color:"#4ade80",  text:"Risky code runs here. If exception thrown → jumps to matching catch." },
//             { block:"catch (Ex e)", color:"#f59e0b", text:"Handles the exception. Can have multiple catch blocks for different types." },
//             { block:"finally { }", color:"#22d3ee", text:"ALWAYS runs — whether exception occurred or not. Perfect for closing resources." },
//             { block:"try-with-resources", color:"#a78bfa", text:"try (FileReader f = ...) { } — resource auto-closed. Java 7+. Best practice." },
//             { block:"throw / throws", color:"#f87171", text:"throw new Ex() — manually throw. throws in signature = declares checked exceptions." },
//           ].map((r,i) => (
//             <div key={i} style={{ display:"flex", gap:10, marginBottom:10, alignItems:"flex-start" }}>
//               <div style={{ background:`rgba(${r.color==="#4ade80"?"74,222,128":r.color==="#f59e0b"?"245,158,11":r.color==="#22d3ee"?"34,211,238":r.color==="#a78bfa"?"167,139,250":"248,113,113"},.15)`, border:`1px solid ${r.color}`, borderRadius:5, padding:"3px 8px", fontFamily:"monospace", fontSize:10, color:r.color, whiteSpace:"nowrap", flexShrink:0 }}>{r.block}</div>
//               <div style={{ color:C.muted, fontSize:11, lineHeight:1.5 }}>{r.text}</div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────
// // DIAGRAM — GENERICS
// // ─────────────────────────────────────────────────────────────
// export function DiagramGenerics() {
//   const box = (label: string, color: string, sub?: string) => (
//     <div style={{ background:`${color}18`, border:`2px solid ${color}`, borderRadius:10, padding:"10px 16px", textAlign:"center", minWidth:110 }}>
//       <div style={{ color, fontWeight:700, fontSize:13 }}>{label}</div>
//       {sub && <div style={{ color:C.dim, fontSize:11, marginTop:3 }}>{sub}</div>}
//     </div>
//   );
//   const arrow = (label: string) => (
//     <div style={{ display:"flex", flexDirection:"column", alignItems:"center", margin:"0 4px" }}>
//       <div style={{ color:C.adv, fontSize:10, marginBottom:2 }}>{label}</div>
//       <div style={{ color:C.adv, fontSize:20, lineHeight:1 }}>→</div>
//     </div>
//   );
//   return (
//     <div style={{ background:C.card, borderRadius:14, padding:24, border:`1px solid ${C.border}`, margin:"24px 0" }}>
//       <div style={{ color:C.adv, fontWeight:700, fontSize:15, marginBottom:16 }}>🔠 Generics — Type Safety Without Casting</div>

//       {/* Raw vs Generic */}
//       <div style={{ display:"flex", gap:16, marginBottom:20, flexWrap:"wrap" }}>
//         <div style={{ flex:1, background:`#ff000012`, border:`1px solid #ff4444`, borderRadius:10, padding:14 }}>
//           <div style={{ color:"#ff6b6b", fontWeight:700, marginBottom:8, fontSize:12 }}>❌ Without Generics (Raw)</div>
//           <code style={{ color:C.dim, fontSize:11, display:"block", lineHeight:1.8 }}>
//             List list = new ArrayList();<br/>
//             list.add("hello");<br/>
//             list.add(42);<br/>
//             <span style={{ color:"#ff6b6b" }}>String s = (String) list.get(1); // 💥 ClassCastException</span>
//           </code>
//         </div>
//         <div style={{ flex:1, background:`#00ff0012`, border:`1px solid #44ff88`, borderRadius:10, padding:14 }}>
//           <div style={{ color:"#4ade80", fontWeight:700, marginBottom:8, fontSize:12 }}>✅ With Generics (Type-safe)</div>
//           <code style={{ color:C.dim, fontSize:11, display:"block", lineHeight:1.8 }}>
//             List&lt;String&gt; list = new ArrayList&lt;&gt;();<br/>
//             list.add("hello");<br/>
//             <span style={{ color:"#ff6b6b" }}>// list.add(42); // ✗ compile error!</span><br/>
//             <span style={{ color:"#4ade80" }}>String s = list.get(0); // ✓ no cast needed</span>
//           </code>
//         </div>
//       </div>

//       {/* Type Parameter Pipeline */}
//       <div style={{ marginBottom:20 }}>
//         <div style={{ color:C.dim, fontSize:12, marginBottom:10 }}>Generic Box‹T› — T is replaced at compile time:</div>
//         <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
//           {box("Box‹T›", C.adv, "definition")}
//           {arrow("use as")}
//           {box("Box‹String›", "#f59e0b", "T = String")}
//           {arrow("or")}
//           {box("Box‹Integer›", "#4ade80", "T = Integer")}
//           {arrow("or")}
//           {box("Box‹User›", "#fb923c", "T = User")}
//         </div>
//       </div>

//       {/* Bounded Wildcards */}
//       <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
//         {[
//           { sym:"‹T›",              label:"Unbounded",        desc:"Any type",                    color:C.adv },
//           { sym:"‹T extends X›",  label:"Upper Bounded",    desc:"T must be X or subclass",     color:"#f59e0b" },
//           { sym:"‹T super X›",    label:"Lower Bounded",    desc:"T must be X or superclass",   color:"#4ade80" },
//           { sym:"‹?›",            label:"Wildcard",         desc:"Unknown type — read only",    color:"#fb923c" },
//         ].map(w => (
//           <div key={w.sym} style={{ flex:1, minWidth:130, background:`${w.color}15`, border:`1px solid ${w.color}40`, borderRadius:8, padding:"10px 12px" }}>
//             <code style={{ color:w.color, fontSize:12, fontWeight:700 }}>{w.sym}</code>
//             <div style={{ color:C.text, fontSize:11, fontWeight:600, marginTop:4 }}>{w.label}</div>
//             <div style={{ color:C.dim, fontSize:10, marginTop:2 }}>{w.desc}</div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────
// // DIAGRAM — THREADS
// // ─────────────────────────────────────────────────────────────
// export function DiagramThreads() {
//   const state = (label: string, color: string, desc: string) => (
//     <div style={{ background:`${color}20`, border:`2px solid ${color}`, borderRadius:10, padding:"8px 14px", textAlign:"center", minWidth:100 }}>
//       <div style={{ color, fontWeight:700, fontSize:12 }}>{label}</div>
//       <div style={{ color:C.dim, fontSize:10, marginTop:2 }}>{desc}</div>
//     </div>
//   );
//   return (
//     <div style={{ background:C.card, borderRadius:14, padding:24, border:`1px solid ${C.border}`, margin:"24px 0" }}>
//       <div style={{ color:C.adv, fontWeight:700, fontSize:15, marginBottom:16 }}>🧵 Thread Lifecycle & Concurrency</div>

//       {/* Thread State Machine */}
//       <div style={{ marginBottom:20 }}>
//         <div style={{ color:C.dim, fontSize:12, marginBottom:10 }}>Thread State Machine:</div>
//         <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
//           {state("NEW","#4ade80","created")}
//           <div style={{ color:"#4ade80", fontSize:18 }}>→ <span style={{ fontSize:10, color:C.dim }}>start()</span></div>
//           {state("RUNNABLE","#f59e0b","ready/running")}
//           <div style={{ color:"#f59e0b", fontSize:18 }}>→ <span style={{ fontSize:10, color:C.dim }}>wait()/sleep()</span></div>
//           {state("BLOCKED/WAITING","#fb923c","paused")}
//           <div style={{ color:"#4ade80", fontSize:18 }}>→ <span style={{ fontSize:10, color:C.dim }}>notify()</span></div>
//           {state("TERMINATED","#ef4444","done")}
//         </div>
//       </div>

//       {/* Race condition vs synchronized */}
//       <div style={{ display:"flex", gap:14, flexWrap:"wrap", marginBottom:16 }}>
//         <div style={{ flex:1, background:"#ff000012", border:"1px solid #ff4444", borderRadius:10, padding:14 }}>
//           <div style={{ color:"#ff6b6b", fontWeight:700, fontSize:12, marginBottom:8 }}>⚠️ Race Condition (unsafe)</div>
//           {[
//             { thread:"Thread-1", op:"reads counter = 5" },
//             { thread:"Thread-2", op:"reads counter = 5" },
//             { thread:"Thread-1", op:"writes counter = 6" },
//             { thread:"Thread-2", op:"writes counter = 6  ← lost update!" },
//           ].map((r,i) => (
//             <div key={i} style={{ display:"flex", gap:8, marginBottom:4, alignItems:"center" }}>
//               <span style={{ color: r.thread==="Thread-1" ? "#f59e0b":"#4ade80", fontSize:10, minWidth:64, fontWeight:600 }}>{r.thread}</span>
//               <span style={{ color:C.dim, fontSize:10 }}>{r.op}</span>
//             </div>
//           ))}
//         </div>
//         <div style={{ flex:1, background:"#00ff0012", border:"1px solid #4ade80", borderRadius:10, padding:14 }}>
//           <div style={{ color:"#4ade80", fontWeight:700, fontSize:12, marginBottom:8 }}>✅ Synchronized (safe)</div>
//           <code style={{ color:C.dim, fontSize:10, display:"block", lineHeight:1.9 }}>
//             synchronized(lock) {'{'}<br/>
//             &nbsp;&nbsp;// only ONE thread<br/>
//             &nbsp;&nbsp;// at a time here<br/>
//             &nbsp;&nbsp;counter++;<br/>
//             {'}'}<br/>
//             <span style={{ color:"#4ade80" }}>// ✓ atomic operation</span>
//           </code>
//         </div>
//       </div>

//       {/* ExecutorService */}
//       <div style={{ background:`${C.adv}15`, border:`1px solid ${C.adv}40`, borderRadius:10, padding:12 }}>
//         <div style={{ color:C.adv, fontWeight:700, fontSize:12, marginBottom:6 }}>🏊 Thread Pool (ExecutorService)</div>
//         <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
//           <div style={{ background:C.bg, borderRadius:6, padding:"6px 10px", fontSize:10, color:C.text }}>Task Queue</div>
//           <div style={{ color:C.adv }}>→</div>
//           {["Worker-1","Worker-2","Worker-3"].map(w => (
//             <div key={w} style={{ background:`${C.adv}25`, border:`1px solid ${C.adv}`, borderRadius:6, padding:"6px 10px", fontSize:10, color:C.adv }}>{w}</div>
//           ))}
//           <div style={{ color:C.adv }}>→</div>
//           <div style={{ background:C.bg, borderRadius:6, padding:"6px 10px", fontSize:10, color:"#4ade80" }}>Results</div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────
// // DIAGRAM — STREAMS & LAMBDA
// // ─────────────────────────────────────────────────────────────
// export function DiagramStreams() {
//   const step = (icon: string, label: string, code: string, color: string) => (
//     <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
//       <div style={{ background:`${color}20`, border:`2px solid ${color}`, borderRadius:10, padding:"10px 14px", textAlign:"center", minWidth:110 }}>
//         <div style={{ fontSize:18 }}>{icon}</div>
//         <div style={{ color, fontWeight:700, fontSize:11, marginTop:4 }}>{label}</div>
//         <code style={{ color:C.dim, fontSize:10, marginTop:4, display:"block" }}>{code}</code>
//       </div>
//     </div>
//   );
//   return (
//     <div style={{ background:C.card, borderRadius:14, padding:24, border:`1px solid ${C.border}`, margin:"24px 0" }}>
//       <div style={{ color:C.adv, fontWeight:700, fontSize:15, marginBottom:16 }}>🌊 Stream Pipeline — Lazy, Functional, Chainable</div>

//       {/* Pipeline */}
//       <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap", marginBottom:20, overflowX:"auto" }}>
//         {step("📋","Source","list.stream()", "#64748b")}
//         <div style={{ color:C.adv, fontSize:22 }}>→</div>
//         {step("🔍","filter","x -> x > 10", "#f59e0b")}
//         <div style={{ color:C.adv, fontSize:22 }}>→</div>
//         {step("🔄","map","x -> x * 2", "#4ade80")}
//         <div style={{ color:C.adv, fontSize:22 }}>→</div>
//         {step("🏷️","sorted","naturalOrder()", "#fb923c")}
//         <div style={{ color:C.adv, fontSize:22 }}>→</div>
//         {step("📦","collect","toList()", C.adv)}
//       </div>

//       {/* Intermediate vs Terminal */}
//       <div style={{ display:"flex", gap:14, flexWrap:"wrap", marginBottom:16 }}>
//         <div style={{ flex:1, background:"#f59e0b15", border:"1px solid #f59e0b40", borderRadius:10, padding:12 }}>
//           <div style={{ color:"#f59e0b", fontWeight:700, fontSize:12, marginBottom:6 }}>⚙️ Intermediate (lazy — returns Stream)</div>
//           {["filter(Predicate)","map(Function)","flatMap(Function)","sorted()","distinct()","limit(n)","peek(Consumer)"].map(m => (
//             <div key={m} style={{ color:C.dim, fontSize:11, padding:"2px 0" }}>• {m}</div>
//           ))}
//         </div>
//         <div style={{ flex:1, background:`${C.adv}15`, border:`1px solid ${C.adv}40`, borderRadius:10, padding:12 }}>
//           <div style={{ color:C.adv, fontWeight:700, fontSize:12, marginBottom:6 }}>🏁 Terminal (triggers execution)</div>
//           {["collect(Collectors.toList())","forEach(Consumer)","count()","findFirst() / findAny()","reduce(identity, BinaryOp)","min() / max()","anyMatch() / allMatch()"].map(m => (
//             <div key={m} style={{ color:C.dim, fontSize:11, padding:"2px 0" }}>• {m}</div>
//           ))}
//         </div>
//       </div>

//       {/* Lambda shorthand */}
//       <div style={{ background:`${C.adv}10`, border:`1px solid ${C.adv}30`, borderRadius:10, padding:12 }}>
//         <div style={{ color:C.adv, fontWeight:700, fontSize:12, marginBottom:6 }}>λ Lambda Evolution</div>
//         <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
//           <code style={{ color:"#64748b", fontSize:11 }}>new Comparator() {'{ compare(a,b){...} }'}</code>
//           <div style={{ color:C.adv }}>→</div>
//           <code style={{ color:"#f59e0b", fontSize:11 }}>(a, b) → a.compareTo(b)</code>
//           <div style={{ color:C.adv }}>→</div>
//           <code style={{ color:"#4ade80", fontSize:11 }}>String::compareTo</code>
//         </div>
//         <div style={{ color:C.dim, fontSize:10, marginTop:4 }}>Anonymous class → Lambda → Method Reference</div>
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────
// // DIAGRAM — FILE I/O
// // ─────────────────────────────────────────────────────────────
// export function DiagramFileIO() {
//   const layer = (label: string, sub: string, color: string, icon: string) => (
//     <div style={{ background:`${color}18`, border:`2px solid ${color}`, borderRadius:10, padding:"10px 16px", marginBottom:6, display:"flex", alignItems:"center", gap:10 }}>
//       <span style={{ fontSize:20 }}>{icon}</span>
//       <div>
//         <div style={{ color, fontWeight:700, fontSize:12 }}>{label}</div>
//         <div style={{ color:C.dim, fontSize:10 }}>{sub}</div>
//       </div>
//     </div>
//   );
//   return (
//     <div style={{ background:C.card, borderRadius:14, padding:24, border:`1px solid ${C.border}`, margin:"24px 0" }}>
//       <div style={{ color:C.adv, fontWeight:700, fontSize:15, marginBottom:16 }}>📂 File I/O — Stream Layers & NIO.2</div>

//       <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
//         {/* Classic I/O Stack */}
//         <div style={{ flex:1, minWidth:220 }}>
//           <div style={{ color:C.dim, fontSize:11, marginBottom:8, fontWeight:600 }}>Classic java.io Stack (text files):</div>
//           {layer("BufferedReader / BufferedWriter","Buffered — fast, line-by-line","#4ade80","📄")}
//           <div style={{ textAlign:"center", color:C.dim, fontSize:12 }}>wraps ↕</div>
//           {layer("InputStreamReader / OutputStreamWriter","Charset decoder/encoder","#f59e0b","🔤")}
//           <div style={{ textAlign:"center", color:C.dim, fontSize:12 }}>wraps ↕</div>
//           {layer("FileInputStream / FileOutputStream","Raw bytes to/from disk","#fb923c","💾")}
//           <div style={{ textAlign:"center", color:C.dim, fontSize:12 }}>reads/writes ↕</div>
//           {layer("File on Disk","Operating System / Filesystem","#64748b","🗄️")}
//         </div>

//         {/* NIO.2 */}
//         <div style={{ flex:1, minWidth:220 }}>
//           <div style={{ color:C.dim, fontSize:11, marginBottom:8, fontWeight:600 }}>Modern NIO.2 (Java 7+):</div>
//           <div style={{ background:`${C.adv}15`, border:`1px solid ${C.adv}40`, borderRadius:10, padding:14, marginBottom:10 }}>
//             <div style={{ color:C.adv, fontWeight:700, fontSize:12, marginBottom:8 }}>java.nio.file.Files</div>
//             {["Files.readAllLines(path)","Files.write(path, lines)","Files.copy(src, dst)","Files.move(src, dst)","Files.delete(path)","Files.exists(path)"].map(m => (
//               <code key={m} style={{ display:"block", color:C.dim, fontSize:10, padding:"2px 0" }}>{m}</code>
//             ))}
//           </div>
//           <div style={{ background:"#f59e0b15", border:"1px solid #f59e0b40", borderRadius:10, padding:14 }}>
//             <div style={{ color:"#f59e0b", fontWeight:700, fontSize:12, marginBottom:6 }}>try-with-resources</div>
//             <code style={{ color:C.dim, fontSize:10, display:"block", lineHeight:1.8 }}>
//               try (BufferedReader br =<br/>
//               &nbsp;&nbsp;new BufferedReader(<br/>
//               &nbsp;&nbsp;&nbsp;&nbsp;new FileReader(file))) {'{'}<br/>
//               &nbsp;&nbsp;// br auto-closed ✓<br/>
//               {'}'}
//             </code>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export const DIAGRAM_REGISTRY: Record<string, () => JSX.Element> = {
//   jvm:          DiagramJVM,
//   memory:       DiagramMemory,
//   operators:    DiagramOperators,
//   controlflow:  DiagramControlFlow,
//   arrays:       DiagramArrays,
//   callstack:    DiagramCallStack,
//   stringpool:   DiagramStringPool,
//   classobject:  DiagramClassObject,
//   inheritance:  DiagramInheritance,
//   polymorphism: DiagramPolymorphism,
//   abstraction:  DiagramAbstraction,
//   encapsulation: DiagramEncapsulation,
//   interfaces:   DiagramInterfaces,
//   collections:  DiagramCollections,
//   exceptions:   DiagramExceptions,
//   generics:     DiagramGenerics,
//   threads:      DiagramThreads,
//   streams:      DiagramStreams,
//   fileio:       DiagramFileIO,
// };

// export default DIAGRAM_REGISTRY;
