import { useEffect } from "react";

// ─────────────────────────────────────────────────────────────
// GLOBAL STYLES — injected once at app root
// Preserves all animations from the original code-mastery design
// ─────────────────────────────────────────────────────────────
export default function GlobalStyles() {
  useEffect(() => {
    const el = document.createElement("style");
    el.id = "code-mastery-global";
    el.textContent = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html, body, #root { height: 100%; }
      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-track { background: #0d0d20; }
      ::-webkit-scrollbar-thumb { background: #2a2a50; border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: #4a4a80; }

      @keyframes fadeUp   { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
      @keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
      @keyframes slideIn  { from { opacity:0; transform:translateX(-16px) } to { opacity:1; transform:translateX(0) } }
      @keyframes spin     { to { transform: rotate(360deg) } }
      @keyframes float    { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-8px) } }
      @keyframes shimmer  { 0% { opacity:.5 } 50% { opacity:1 } 100% { opacity:.5 } }
      @keyframes glow     { 0%,100% { box-shadow:0 0 12px rgba(245,158,11,.25) } 50% { box-shadow:0 0 32px rgba(245,158,11,.6) } }
      @keyframes pulse    { 0%,100% { transform:scale(1) } 50% { transform:scale(1.04) } }
      @keyframes skeleton { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }

      .fu  { animation: fadeUp  .45s ease-out both }
      .fi  { animation: fadeIn  .3s  ease-out      }
      .si  { animation: slideIn .3s  ease-out      }
      .float   { animation: float  3s  ease-in-out infinite }
      .spin    { animation: spin   .9s linear       infinite; display:inline-block }
      .shimmer { animation: shimmer 2s ease-in-out  infinite }
      .glow    { animation: glow   2s ease-in-out   infinite }
      .skeleton-pulse {
        background: linear-gradient(90deg, #0d0d20 25%, #12122a 50%, #0d0d20 75%);
        background-size: 200% 100%;
        animation: skeleton 1.4s ease-in-out infinite;
        border-radius: 6px;
      }
      .card-hover:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,.5) !important; }
      .nav-row:hover    { background: rgba(255,255,255,.05) !important; }
      .quiz-opt:hover   { border-color: #3a3a70 !important; background: rgba(255,255,255,.03) !important; }
      .code-ln:hover    { background: rgba(255,255,255,.025) }
      button { cursor: pointer; border: none; outline: none; font-family: inherit; }
      a      { text-decoration: none; color: inherit; }
    `;
    // Avoid duplicates on HMR
    const existing = document.getElementById("code-mastery-global");
    if (existing) existing.remove();
    document.head.appendChild(el);
    return () => el.remove();
  }, []);
  return null;
}
