import { C } from "../theme";

// ─────────────────────────────────────────────────────────────
// SYNTAX BLOCK — multi-language code highlighter
// Dracula colour scheme, preserved from original code-mastery
// ─────────────────────────────────────────────────────────────

// ── Java token sets ──────────────────────────────────────────
const JAVA_KW = new Set([
  "public","private","protected","class","interface","abstract","extends","implements",
  "new","return","void","static","final","this","super","import","package",
  "for","while","do","if","else","switch","case","break","continue","default",
  "try","catch","finally","throw","throws","null","true","false","instanceof","enum","var",
]);

const JAVA_TYPES = new Set([
  "int","String","boolean","double","float","long","char","byte","short",
  "Integer","Boolean","Double","Float","Long","Character","Object",
  "List","ArrayList","HashMap","Map","Set","HashSet","LinkedList","Queue","Stack",
  "Optional","Stream","Thread","Runnable","Exception","StringBuilder","Arrays","Collections",
]);

// ── TypeScript / JS keyword set ──────────────────────────────
const TS_KW = new Set([
  "const","let","var","function","return","class","extends","import","export","default",
  "if","else","for","while","do","switch","case","break","continue",
  "new","this","typeof","instanceof","void","null","undefined","true","false",
  "async","await","try","catch","finally","throw","interface","type","enum",
  "readonly","abstract","public","private","protected","static","from","of","in",
]);

const TS_TYPES = new Set([
  "string","number","boolean","any","unknown","never","object","symbol","bigint",
  "Promise","Array","Record","Map","Set","Partial","Required","Readonly",
  "void","null","undefined",
]);

// ── Python keyword set ────────────────────────────────────────
const PY_KW = new Set([
  "def","class","import","from","return","if","elif","else","for","while",
  "try","except","finally","raise","with","as","pass","break","continue",
  "True","False","None","in","not","and","or","is","lambda","yield","async","await",
  "global","nonlocal","del","assert",
]);

// ── Dracula token colours ─────────────────────────────────────
const COLORS = {
  kw:  "#ff79c6",
  type:"#8be9fd",
  cls: "#50fa7b",
  str: "#f1fa8c",
  cmt: "#6272a4",
  num: "#bd93f9",
  ann: "#ffb86c",
  op:  "#ff79c6",
  txt: "#f8f8f2",
  var: "#f8f8f2",
};

type Token = { t: keyof typeof COLORS; v: string };

// ── Java tokenizer ────────────────────────────────────────────
function tokenizeJava(code: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < code.length) {
    if (code[i] === "/" && code[i + 1] === "/") {
      let j = i;
      while (j < code.length && code[j] !== "\n") j++;
      out.push({ t: "cmt", v: code.slice(i, j) }); i = j; continue;
    }
    if (code[i] === "/" && code[i + 1] === "*") {
      let j = i + 2;
      while (j < code.length - 1 && !(code[j] === "*" && code[j + 1] === "/")) j++;
      out.push({ t: "cmt", v: code.slice(i, j + 2) }); i = j + 2; continue;
    }
    if (code[i] === '"') {
      let j = i + 1;
      while (j < code.length && code[j] !== '"' && code[j] !== "\n") {
        if (code[j] === "\\") j++;
        j++;
      }
      out.push({ t: "str", v: code.slice(i, j + 1) }); i = j + 1; continue;
    }
    if (code[i] === "@") {
      let j = i + 1;
      while (j < code.length && /\w/.test(code[j])) j++;
      out.push({ t: "ann", v: code.slice(i, j) }); i = j; continue;
    }
    if (/\d/.test(code[i])) {
      let j = i;
      while (j < code.length && /[\d.fLd]/.test(code[j])) j++;
      out.push({ t: "num", v: code.slice(i, j) }); i = j; continue;
    }
    if (/[a-zA-Z_$]/.test(code[i])) {
      let j = i;
      while (j < code.length && /\w/.test(code[j])) j++;
      const w = code.slice(i, j);
      if (JAVA_KW.has(w))         out.push({ t: "kw",   v: w });
      else if (JAVA_TYPES.has(w)) out.push({ t: "type", v: w });
      else if (/^[A-Z]/.test(w)) out.push({ t: "cls",  v: w });
      else                        out.push({ t: "txt",  v: w });
      i = j; continue;
    }
    if (/[+\-*\/=<>!&|^%~?:]/.test(code[i])) {
      out.push({ t: "op", v: code[i] }); i++; continue;
    }
    out.push({ t: "txt", v: code[i] }); i++;
  }
  return out;
}

// ── TypeScript/JS tokenizer ───────────────────────────────────
function tokenizeTS(code: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < code.length) {
    if (code[i] === "/" && code[i + 1] === "/") {
      let j = i;
      while (j < code.length && code[j] !== "\n") j++;
      out.push({ t: "cmt", v: code.slice(i, j) }); i = j; continue;
    }
    if (code[i] === "/" && code[i + 1] === "*") {
      let j = i + 2;
      while (j < code.length - 1 && !(code[j] === "*" && code[j + 1] === "/")) j++;
      out.push({ t: "cmt", v: code.slice(i, j + 2) }); i = j + 2; continue;
    }
    if (code[i] === '"' || code[i] === "'" || code[i] === "`") {
      const q = code[i]; let j = i + 1;
      while (j < code.length && code[j] !== q) {
        if (code[j] === "\\") j++;
        j++;
      }
      out.push({ t: "str", v: code.slice(i, j + 1) }); i = j + 1; continue;
    }
    if (/\d/.test(code[i])) {
      let j = i;
      while (j < code.length && /[\d.nxX_a-fA-F]/.test(code[j])) j++;
      out.push({ t: "num", v: code.slice(i, j) }); i = j; continue;
    }
    if (/[a-zA-Z_$]/.test(code[i])) {
      let j = i;
      while (j < code.length && /\w/.test(code[j])) j++;
      const w = code.slice(i, j);
      if (TS_KW.has(w))         out.push({ t: "kw",   v: w });
      else if (TS_TYPES.has(w)) out.push({ t: "type", v: w });
      else if (/^[A-Z]/.test(w)) out.push({ t: "cls", v: w });
      else                       out.push({ t: "txt", v: w });
      i = j; continue;
    }
    if (/[+\-*\/=<>!&|^%~?:]/.test(code[i])) {
      out.push({ t: "op", v: code[i] }); i++; continue;
    }
    out.push({ t: "txt", v: code[i] }); i++;
  }
  return out;
}

// ── Python tokenizer ──────────────────────────────────────────
function tokenizePython(code: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < code.length) {
    if (code[i] === "#") {
      let j = i;
      while (j < code.length && code[j] !== "\n") j++;
      out.push({ t: "cmt", v: code.slice(i, j) }); i = j; continue;
    }
    if (code[i] === '"' || code[i] === "'") {
      const q = code[i]; let j = i + 1;
      while (j < code.length && code[j] !== q) {
        if (code[j] === "\\") j++;
        j++;
      }
      out.push({ t: "str", v: code.slice(i, j + 1) }); i = j + 1; continue;
    }
    if (/\d/.test(code[i])) {
      let j = i;
      while (j < code.length && /[\d._]/.test(code[j])) j++;
      out.push({ t: "num", v: code.slice(i, j) }); i = j; continue;
    }
    if (/[a-zA-Z_]/.test(code[i])) {
      let j = i;
      while (j < code.length && /\w/.test(code[j])) j++;
      const w = code.slice(i, j);
      if (PY_KW.has(w))          out.push({ t: "kw",  v: w });
      else if (/^[A-Z]/.test(w)) out.push({ t: "cls", v: w });
      else                       out.push({ t: "txt", v: w });
      i = j; continue;
    }
    if (/[+\-*\/=<>!&|^%~?:]/.test(code[i])) {
      out.push({ t: "op", v: code[i] }); i++; continue;
    }
    out.push({ t: "txt", v: code[i] }); i++;
  }
  return out;
}

// ── Plain text fallback ───────────────────────────────────────
function tokenizePlain(code: string): Token[] {
  return [{ t: "txt", v: code }];
}

function getTokenizer(lang?: string) {
  const l = (lang ?? "").toLowerCase();
  if (l === "java")  return tokenizeJava;
  if (l === "typescript" || l === "ts" || l === "tsx" || l === "javascript" || l === "js" || l === "jsx")
    return tokenizeTS;
  if (l === "python" || l === "py") return tokenizePython;
  // Default to Java (original behavior)
  return tokenizeJava;
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────
interface SyntaxBlockProps {
  code: string;
  language?: string;  // "java" | "typescript" | "python" | … defaults to java
}

export default function SyntaxBlock({ code, language }: SyntaxBlockProps) {
  const tokenize = getTokenizer(language);

  return (
    <div
      style={{
        fontFamily: "'Fira Code','JetBrains Mono',monospace",
        fontSize: 13, lineHeight: 1.7,
      }}
    >
      {code.split("\n").map((line, li) => (
        <div key={li} className="code-ln" style={{ display: "flex", padding: "1px 4px", borderRadius: 3 }}>
          <span
            style={{
              color: C.dim, minWidth: 30, textAlign: "right",
              paddingRight: 14, userSelect: "none", fontSize: 11, flexShrink: 0,
            }}
          >
            {li + 1}
          </span>
          <span>
            {tokenize(line).map((tok, ti) => (
              <span key={ti} style={{ color: COLORS[tok.t] ?? COLORS.txt }}>{tok.v}</span>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}
