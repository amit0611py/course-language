'use strict';

// ══════════════════════════════════════════════════════════════════════════════
// markdownParser.js
// Parses a topic Markdown file into { meta, blocks }.
//
// ── File layout ───────────────────────────────────────────────────────────────
//
//   --- YAML frontmatter (gray-matter) ---   topic metadata
//   --- Body ---  fenced block directives:
//
//   :::text
//   Plain paragraph text here.
//   :::
//
//   :::note
//   Callout / tip / information note.
//   :::
//
//   :::warning
//   Be careful about this.
//   :::
//
//   :::code language=java filename=App.java runnable=true
//   public class App {
//       public static void main(String[] args) {
//           System.out.println("Hello!");
//       }
//   }
//   ---output
//   Hello!
//   :::
//   (---output separator is optional; everything after it becomes expectedOutput)
//
//   :::diagram title=How Java Runs type=flow
//   Optional mermaid / source body
//   :::
//   (also accepts old diagramId= syntax for backward compat)
//
//   :::quiz questionId=q_java_001
//   question: What does JVM stand for?
//   options:
//   * Java Variable Machine
//   * Java Virtual Machine
//   * Java Version Manager
//   answer: 2
//   explanation: JVM stands for Java Virtual Machine.
//   :::
//   — OR — (backward-compat JSON options format)
//   :::quiz questionId=q_java_001
//   questionText: What does JVM stand for?
//   questionType: mcq
//   options: [{"id":"a","text":"...","correct":false},{"id":"b","text":"...","correct":true}]
//   explanation: JVM = Java Virtual Machine.
//   :::
//
//   :::concept icon=☕ title=JVM
//   Executes bytecode on any OS. The heart of platform independence.
//   :::
//
//   (Multiple consecutive :::concept blocks are automatically merged into one
//    concept_cards block: { type:"concept_cards", data:{ items:[...] } })
//
// ── Output block schema ───────────────────────────────────────────────────────
//
//   text:          { type:"text",          data:{ content: string } }
//   note:          { type:"note",          data:{ content: string } }
//   warning:       { type:"warning",       data:{ content: string } }
//   code:          { type:"code",          data:{ language, filename, runnable,
//                                                 snippet, expectedOutput|null } }
//   diagram:       { type:"diagram",       data:{ title, type, diagramId, source } }
//   quiz:          { type:"quiz",          data:{ questionId, questionText,
//                                                 questionType, options, explanation } }
//   concept_cards: { type:"concept_cards", data:{ items:[{icon,title,desc},...] } }
//
// ══════════════════════════════════════════════════════════════════════════════

const matter = require('gray-matter');

// ── Block regex ──────────────────────────────────────────────────────────────
// Matches :::type [attrs]\nbody\n::: with multiline + dotall flags.
// The body capture is non-greedy so nested ::: delimiters work correctly.
const BLOCK_RE = /^:::(\w+)(?:[ \t]+([^\n]*))?\n([\s\S]*?)^:::/gm;

// ── Attribute parser ─────────────────────────────────────────────────────────
// Parses the inline attribute string on a fenced block directive, e.g.:
//
//   language=java filename=App.java runnable=true
//   icon=☕ title="Garbage Collection"
//   title="Java Compilation Flow" type=flow
//
// Rules:
//   key="multi word value"  →  { key: 'multi word value' }
//   key='multi word value'  →  { key: 'multi word value' }
//   key=singleword          →  { key: 'singleword' }
//   barekey                 →  { barekey: true }
//
// Emoji and Unicode are supported in values (matched by \S+ non-whitespace).
const TOKEN_RE = /(\w[\w-]*)=(?:"([^"]*)"|'([^']*)'|(\S+))|(\w[\w-]*)/g;

const parseAttrs = (attrStr) => {
  if (!attrStr) return {};
  const result = {};
  TOKEN_RE.lastIndex = 0;
  let m;
  while ((m = TOKEN_RE.exec(attrStr)) !== null) {
    const key = m[1] ?? m[5];
    // m[2] = double-quoted, m[3] = single-quoted, m[4] = unquoted bare value
    const val = m[2] ?? m[3] ?? m[4];
    result[key] = val !== undefined ? val : true;
  }
  return result;
};

// ── Quiz body parser ─────────────────────────────────────────────────────────
// Supports two formats:
//
// Format A — simple bullet-point (new, human-friendly):
//   question: What does JVM stand for?
//   options:
//   * Java Variable Machine
//   * Java Virtual Machine
//   answer: 2
//   explanation: JVM = Java Virtual Machine.
//
// Format B — JSON options array (backward-compat with existing .md files):
//   questionText: What does JVM stand for?
//   questionType: mcq
//   options: [{"id":"a","text":"...","correct":false}, ...]
//   explanation: ...
//
const parseQuizBody = (body) => {
  const result = {
    questionText: null,
    questionType: 'mcq',
    options:      [],
    explanation:  null,
  };

  const lines         = body.split('\n');
  let collectBullets  = false;
  const bulletOptions = [];
  let correctAnswer   = null; // 1-based index for Format A

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      // A blank line ends bullet collection (but doesn't discard collected items)
      if (collectBullets && bulletOptions.length) collectBullets = false;
      continue;
    }

    // ── question / questionText ──────────────────────────────────────────────
    if (/^(?:question|questionText):/.test(trimmed)) {
      result.questionText = trimmed.replace(/^(?:question|questionText):\s*/, '');
      collectBullets = false;

    // ── questionType ─────────────────────────────────────────────────────────
    } else if (/^questionType:/.test(trimmed)) {
      result.questionType = trimmed.replace(/^questionType:\s*/, '');
      collectBullets = false;

    // ── options: [...] — JSON array on the same line (Format B) ─────────────
    } else if (/^options:\s*\[/.test(trimmed)) {
      const jsonStr = trimmed.replace(/^options:\s*/, '');
      try {
        result.options = JSON.parse(jsonStr);
      } catch (_) {
        // If JSON.parse fails, leave options empty — seeder will log the error
      }
      collectBullets = false;

    // ── options: (nothing) — bullet list follows (Format A) ──────────────────
    } else if (/^options:\s*$/.test(trimmed)) {
      collectBullets = true;

    // ── answer: N — 1-based correct index (Format A) ─────────────────────────
    } else if (/^answer:/.test(trimmed)) {
      const parsed = parseInt(trimmed.replace(/^answer:\s*/, ''), 10);
      if (!Number.isNaN(parsed)) correctAnswer = parsed;
      collectBullets = false;

    // ── explanation ───────────────────────────────────────────────────────────
    } else if (/^explanation:/.test(trimmed)) {
      result.explanation = trimmed.replace(/^explanation:\s*/, '');
      collectBullets = false;

    // ── bullet option line (Format A) ─────────────────────────────────────────
    } else if (collectBullets && /^[*\-•]/.test(trimmed)) {
      bulletOptions.push(trimmed.replace(/^[*\-•]\s*/, ''));
    }
  }

  // If Format A bullet options were collected, convert to option objects
  if (bulletOptions.length > 0) {
    const ids = ['a', 'b', 'c', 'd', 'e'];
    result.options = bulletOptions.map((text, i) => ({
      id:      ids[i] ?? String(i),
      text,
      correct: correctAnswer !== null ? (i + 1 === correctAnswer) : false,
    }));
  }

  return result;
};

// ── Block builders ───────────────────────────────────────────────────────────

const OUTPUT_SEPARATOR = '\n---output\n';

const buildBlock = (type, attrs, body) => {
  switch (type) {

    // ── text ─────────────────────────────────────────────────────────────────
    case 'text':
      return { type: 'text', data: { content: body } };

    // ── note ─────────────────────────────────────────────────────────────────
    case 'note':
      return { type: 'note', data: { content: body } };

    // ── warning ───────────────────────────────────────────────────────────────
    case 'warning':
      return { type: 'warning', data: { content: body } };

    // ── code ──────────────────────────────────────────────────────────────────
    // Optional ---output separator divides snippet from expected output:
    //
    //   :::code language=java filename=App.java runnable=true
    //   public class App { ... }
    //   ---output
    //   Hello!
    //   :::
    case 'code': {
      const sepIdx        = body.indexOf(OUTPUT_SEPARATOR);
      const hasOutput     = sepIdx !== -1;
      const snippet       = hasOutput ? body.slice(0, sepIdx).trim() : body.trim();
      const expectedOutput = hasOutput ? body.slice(sepIdx + OUTPUT_SEPARATOR.length).trim() : null;

      return {
        type: 'code',
        data: {
          language:       attrs.language ?? 'text',
          filename:       attrs.filename  ?? null,
          runnable:       attrs.runnable === 'true' || attrs.runnable === true,
          snippet,
          expectedOutput,
        },
      };
    }

    // ── diagram ───────────────────────────────────────────────────────────────
    // New syntax:    :::diagram diagramKey=java_jvm title="How Java Runs"
    // Legacy syntax: :::diagram diagramId=jvm_heap type=mermaid
    // diagramKey is the canonical attribute; diagramId is kept for back-compat.
    // For mermaid blocks the body is the source string.
    case 'diagram':
      return {
        type: 'diagram',
        data: {
          diagramKey: attrs.diagramKey ?? attrs.diagramId ?? attrs.id ?? null,
          title:      attrs.title ?? null,
          diagramType: attrs.type ?? null,
          // Mermaid source lives in the block body
          mermaid:    (attrs.type === 'mermaid' && body) ? body.trim() : null,
          // SVG blocks have no inline body — content comes from export script
          svg:        null,
        },
      };

    // ── quiz ──────────────────────────────────────────────────────────────────
    // Full question data is parsed from the body and later extracted into
    // quiz_questions table by topicLoader. Only questionId is kept in the block.
    case 'quiz': {
      const parsed = parseQuizBody(body);
      return {
        type: 'quiz',
        data: {
          questionId:   attrs.questionId  ?? null,
          questionText: parsed.questionText,
          questionType: parsed.questionType,
          options:      parsed.options,
          explanation:  parsed.explanation,
        },
      };
    }

    // ── concept ───────────────────────────────────────────────────────────────
    // Individual concept card. icon and title come from attrs; the description
    // goes in the block body (supports multi-word / multi-sentence text).
    //
    //   :::concept icon=☕ title=JVM
    //   Executes bytecode on any OS. The heart of platform independence.
    //   :::
    //
    // Multiple consecutive concept blocks are merged into concept_cards
    // by mergeConceptCards() after all blocks are parsed.
    case 'concept':
      return {
        type: 'concept',
        data: {
          icon:  attrs.icon  ?? null,
          title: attrs.title ?? null,
          desc:  body.trim() || null,
        },
      };

    // ── unknown ───────────────────────────────────────────────────────────────
    default:
      return { type, data: { content: body, attrs } };
  }
};

// ── Post-processing: merge consecutive concept blocks → concept_cards ────────
//
// Before:  [text, concept, concept, concept, code]
// After:   [text, concept_cards{items:[c1,c2,c3]}, code]
//
// Only consecutive concept blocks are merged — a non-concept block between two
// concepts produces two separate concept_cards groups.
const mergeConceptCards = (blocks) => {
  const result = [];
  let i = 0;

  while (i < blocks.length) {
    if (blocks[i].type === 'concept') {
      const items = [];
      while (i < blocks.length && blocks[i].type === 'concept') {
        items.push(blocks[i].data);
        i++;
      }
      result.push({ type: 'concept_cards', data: { items } });
    } else {
      result.push(blocks[i]);
      i++;
    }
  }

  return result;
};

// ── Main parser ──────────────────────────────────────────────────────────────

const parseMarkdownTopic = (raw) => {
  const { data: meta, content } = matter(raw);

  if (!meta.path) {
    throw new Error('Topic file missing required frontmatter field: path');
  }

  const rawBlocks = [];
  let match;
  BLOCK_RE.lastIndex = 0;

  while ((match = BLOCK_RE.exec(content)) !== null) {
    const [, type, attrsRaw = '', body] = match;
    const block = buildBlock(
      type.trim().toLowerCase(),
      parseAttrs(attrsRaw.trim()),
      body.trim()
    );
    if (block) rawBlocks.push(block);
  }

  // Merge consecutive concept blocks into concept_cards
  const blocks = mergeConceptCards(rawBlocks);

  // Derive depth, parentPath, slug from path if not explicitly set in frontmatter
  const path       = meta.path;
  const segments   = path.split('.');
  const depth      = segments.length - 1;
  const slug       = segments[segments.length - 1];
  const parentPath = depth === 0 ? null : segments.slice(0, -1).join('.');

  return {
    meta: {
      path,
      parentPath,
      depth,
      slug,
      title:         meta.title        ?? slug,
      section:       meta.section      ?? null,
      difficulty:    meta.difficulty   ?? 'beginner',
      estimatedMins: meta.estimatedMins ?? 5,
      tags:          meta.tags         ?? [],
      isDeepDive:    meta.isDeepDive   ?? depth >= 2,
      sortOrder:     meta.sortOrder    ?? 0,
      isPublished:   meta.isPublished  ?? true,
      meta:          meta.meta         ?? {},
    },
    blocks,
  };
};

module.exports = { parseMarkdownTopic };