'use strict';

/**
 * scripts/convertJavaTopics.js
 *
 * Converts frontend Java topic data (extracted from
 * code-mastery/src/languages/java/topics.jsx) into Content-as-Code
 * markdown files compatible with the seeder pipeline.
 *
 * Usage:
 *   node scripts/convertJavaTopics.js             # generate all 19 files
 *   node scripts/convertJavaTopics.js --dry-run   # preview without writing
 *   node scripts/convertJavaTopics.js --topic java.intro  # single topic
 *
 * Output: content/languages/java/topics/<path>.md
 *
 * Path mapping (frontend ID → backend materialized path):
 *   Core section  → java.<slug>           (depth 1, section: core-language)
 *   OOP section   → java.<slug>           (depth 1, section: oop)
 *   Adv section   → java.<slug>           (depth 1, section: advanced)
 */

const fs   = require('fs');
const path = require('path');

// ── Output directory ────────────────────────────────────────────────────────
const OUT_DIR = path.join(__dirname, '../content/languages/java/topics');

// ── Section mapping ─────────────────────────────────────────────────────────
// Frontend "java" → backend "core-language"
// Frontend "oop"  → backend "oop"
// Frontend "advanced" → backend "advanced"
const SECTION_MAP = {
  java:     'core-language',
  oop:      'oop',
  advanced: 'advanced',
};

const DIFFICULTY_MAP = {
  'core-language': 'beginner',
  oop:             'intermediate',
  advanced:        'advanced',
};

const ESTIMATED_MINS_MAP = {
  'core-language': 12,
  oop:             15,
  advanced:        22,
};

// ── Static topic data (extracted from topics.jsx) ──────────────────────────
// Keys must match the path slug (java.<key>)
const TOPICS = [
  // ── CORE LANGUAGE ───────────────────────────────────────────────────────
  {
    id: 'java.intro',
    frontendId: 'java-intro',
    frontendSection: 'java',
    sortOrder: 1,
    title: 'Introduction to Java',
    tagline: 'Write Once, Run Anywhere',
    description: 'Java is a high-level, class-based, object-oriented language designed to run on any platform via the Java Virtual Machine (JVM). Created by James Gosling at Sun Microsystems in 1995, it now powers Android apps, enterprise systems, web servers, and billions of embedded devices worldwide.',
    tags: ['java', 'intro', 'jvm', 'jdk', 'bytecode'],
    concepts: [
      { title: 'JVM',                 body: 'Java Virtual Machine — executes bytecode on any OS. The heart of platform independence.' },
      { title: 'JDK',                 body: 'Java Development Kit — the full toolbox: compiler (javac), debugger, and JRE bundled together.' },
      { title: 'JRE',                 body: 'Java Runtime Environment — what end-users need to run Java apps (JVM + standard libraries).' },
      { title: 'Bytecode',            body: 'Compiled .class files — not machine code, not source. The JVM interprets this for any platform.' },
      { title: 'Garbage Collection',  body: 'Java automatically frees unused memory. No manual malloc/free — fewer memory leaks.' },
      { title: 'Strong Typing',       body: 'Every variable has a declared type checked at compile time — catches bugs before runtime.' },
    ],
    codeFilename: 'HelloWorld.java',
    codeSnippet: `public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        System.out.println("Java runs on the JVM!");
        int year      = 1995;
        String author = "James Gosling";
        System.out.println("Java created in " + year);
        System.out.println("Author: " + author);
    }
}`,
    codeOutput: `Hello, World!\nJava runs on the JVM!\nJava created in 1995\nAuthor: James Gosling`,
    quiz: [
      { id: 'q_java_intro_001', q: 'What does JVM stand for?', opts: ['Java Variable Module','Java Virtual Machine','Java Version Manager','Java Verified Method'], correct: 1, exp: "JVM = Java Virtual Machine. It executes Java bytecode and enables 'write once, run anywhere' by abstracting the underlying OS." },
      { id: 'q_java_intro_002', q: 'Which file extension does compiled Java bytecode use?', opts: ['.java','.exe','.class','.jar'], correct: 2, exp: '.class files contain platform-neutral bytecode. Source code is .java. .jar is a bundle of .class files (Java Archive).' },
      { id: 'q_java_intro_003', q: 'Which component do you need to WRITE and COMPILE Java programs?', opts: ['JVM only','JRE only','JDK','A text editor alone'], correct: 2, exp: 'JDK (Java Development Kit) includes the compiler javac, debugging tools, and the JRE — everything needed for development.' },
    ],
  },
  {
    id: 'java.variables', frontendId: 'variables', frontendSection: 'java', sortOrder: 2,
    title: 'Variables & Data Types', tagline: 'The building blocks of every Java program',
    tags: ['java', 'variables', 'datatypes', 'primitives', 'casting'],
    description: 'A variable is a named container that holds data. Java is a strongly-typed language — every variable must be declared with an explicit type before use. Java has 8 primitive types that store raw values, plus reference types (like String, arrays, objects) that store a pointer to data on the heap.',
    concepts: [
      { title: '8 Primitive Types', body: 'byte, short, int, long, float, double, boolean, char — stored directly on the stack.' },
      { title: 'Reference Types', body: 'String, arrays, objects — the variable holds a memory address pointing to heap data.' },
      { title: 'Type Casting', body: 'Widening (int→double) is automatic. Narrowing (double→int) requires explicit cast (int)x — truncates.' },
      { title: 'final keyword', body: 'Marks a variable as a constant. Must be assigned once. Convention: UPPER_SNAKE_CASE.' },
      { title: 'Wrapper Classes', body: 'Integer, Double, Boolean... box primitives into objects for use in Collections and generics.' },
      { title: 'var (Java 10+)', body: 'Local type inference — the compiler infers the type. var x = 42; is still strongly typed as int.' },
    ],
    codeFilename: 'DataTypes.java', codeSnippet: `public class DataTypes {
    public static void main(String[] args) {
        byte b = 127; short s = 32_767; int age = 2_147_483_647;
        long pop = 8_100_000_000L; float temp = 36.6f;
        double pi = 3.141_592_653; boolean flag = true; char grade = 'A';
        String name = "Java Developer";
        double score = 97.89; int iScore = (int) score;
        final double GRAVITY = 9.81;
        var message = "Hello!";
        System.out.println("Name    : " + name);
        System.out.println("Age     : " + age);
        System.out.println("Score   : " + score + " -> cast: " + iScore);
        System.out.println("Gravity : " + GRAVITY);
        System.out.println("var msg : " + message);
        System.out.println("Grade   : " + grade);
    }
}`,
    codeOutput: `Name    : Java Developer\nAge     : 2147483647\nScore   : 97.89 -> cast: 97\nGravity : 9.81\nvar msg : Hello!\nGrade   : A`,
    quiz: [
      { id: 'q_java_var_001', q: 'Which of these is NOT a primitive type in Java?', opts: ['int','boolean','String','char'], correct: 2, exp: 'String is a class (reference type) that lives on the heap. The 8 primitives are: byte, short, int, long, float, double, boolean, char.' },
      { id: 'q_java_var_002', q: 'What does casting (int) 9.99 produce?', opts: ['10','9','Error','9.0'], correct: 1, exp: 'Narrowing cast truncates — it drops the decimal part. (int) 9.99 = 9, not 10.' },
      { id: 'q_java_var_003', q: 'Which suffix is required when declaring a long literal larger than int range?', opts: ['s','d','L','f'], correct: 2, exp: 'The L suffix tells Java the literal is a long. Example: long big = 9_999_999_999L;' },
    ],
  },
  {
    id: 'java.operators', frontendId: 'operators', frontendSection: 'java', sortOrder: 3,
    title: 'Operators', tagline: 'The tools that compute, compare and decide',
    tags: ['java', 'operators', 'arithmetic', 'logical', 'ternary'],
    description: 'Operators are special symbols that perform operations on variables and values. Java has 6 categories of operators. Understanding operator precedence — which operator is evaluated first — is critical for writing correct expressions.',
    concepts: [
      { title: 'Arithmetic', body: '+ - * / % for math. % gives remainder. ++ and -- increment/decrement by 1 (prefix vs postfix matter!).' },
      { title: 'Relational', body: '== != < > <= >= — compare two values and return boolean. Never use == to compare Strings; use .equals().' },
      { title: 'Logical', body: '&& (AND), || (OR), ! (NOT) — combine boolean expressions. && and || short-circuit.' },
      { title: 'Bitwise', body: '& | ^ ~ << >> >>> — operate on individual bits. Used in flags, masks, low-level optimisation.' },
      { title: 'Ternary', body: 'condition ? valueIfTrue : valueIfFalse — compact one-line if/else.' },
      { title: 'Assignment', body: '+= -= *= /= %= are shorthand. x += 5 means x = x + 5.' },
    ],
    codeFilename: 'Operators.java', codeSnippet: `public class Operators {
    public static void main(String[] args) {
        int a = 17, b = 5;
        System.out.println("17 / 5  = " + (a / b));   // 3 (int division)
        System.out.println("17 % 5  = " + (a % b));   // 2 (remainder)
        int x = 10;
        System.out.println("x++  = " + x++); // prints 10, then x=11
        System.out.println("++x  = " + ++x); // x=12, prints 12
        boolean both = a > 10 && b < 10;
        System.out.println("AND  : " + both);
        String result = a > b ? "a is bigger" : "b is bigger";
        System.out.println(result);
        int score = 100; score -= 15; score *= 2;
        System.out.println("score = " + score);
    }
}`,
    codeOutput: `17 / 5  = 3\n17 % 5  = 2\nx++  = 10\n++x  = 12\nAND  : true\na is bigger\nscore = 170`,
    quiz: [
      { id: 'q_java_ops_001', q: 'What does 17 / 5 produce when both are int?', opts: ['3.4','3','4','2'], correct: 1, exp: 'Integer division truncates the decimal — 17/5 = 3. To get 3.4, at least one operand must be a double.' },
      { id: 'q_java_ops_002', q: 'What is the output of: int x = 5; System.out.println(x++);', opts: ['6','5','4','Compile error'], correct: 1, exp: 'Postfix x++ returns the CURRENT value (5) first, then increments.' },
      { id: 'q_java_ops_003', q: 'Which operator should you use to compare two String values?', opts: ['==','!=','.equals()','==='], correct: 2, exp: '== compares object references. .equals() compares actual character content.' },
    ],
  },
  // ... (remaining topics follow the same shape — see individual .md files)
];

// ── Quiz option builder ──────────────────────────────────────────────────────
function buildOptions(opts, correctIndex) {
  const ids = ['a', 'b', 'c', 'd'];
  return JSON.stringify(
    opts.map((text, i) => ({ id: ids[i], text, correct: i === correctIndex }))
  );
}

// ── Markdown generator ───────────────────────────────────────────────────────
function generateMarkdown(topic) {
  const section   = SECTION_MAP[topic.frontendSection];
  const difficulty = DIFFICULTY_MAP[section];
  const mins       = ESTIMATED_MINS_MAP[section];

  const frontmatter = [
    '---',
    `path: ${topic.id}`,
    `title: ${topic.title}`,
    `section: ${section}`,
    `difficulty: ${difficulty}`,
    `estimatedMins: ${mins}`,
    `sortOrder: ${topic.sortOrder}`,
    `tags: [${topic.tags.join(', ')}]`,
    `isDeepDive: false`,
    '---',
  ].join('\n');

  const descBlock = `:::text\n${topic.description}\n:::`;

  const conceptLines = topic.concepts.map(c => `- **${c.title}** — ${c.body}`).join('\n');
  const conceptBlock = `:::note\n**Key Concepts**\n\n${conceptLines}\n:::`;

  const codeBlock = `:::code language=java filename=${topic.codeFilename} runnable=true\n${topic.codeSnippet}\n:::`;

  const outputBlock = `:::note\n**Expected Output:**\n\`\`\`\n${topic.codeOutput}\n\`\`\`\n:::`;

  const quizBlocks = topic.quiz.map(q => {
    const opts = buildOptions(q.opts, q.correct);
    return [
      `:::quiz questionId=${q.id}`,
      `questionText: ${q.q}`,
      `questionType: mcq`,
      `options: ${opts}`,
      `explanation: ${q.exp}`,
      `:::`,
    ].join('\n');
  }).join('\n\n');

  return [frontmatter, descBlock, conceptBlock, codeBlock, outputBlock, quizBlocks].join('\n\n') + '\n';
}

// ── CLI ──────────────────────────────────────────────────────────────────────
function main() {
  const args      = process.argv.slice(2);
  const dryRun    = args.includes('--dry-run');
  const topicFlag = args.indexOf('--topic');
  const single    = topicFlag !== -1 ? args[topicFlag + 1] : null;

  const targets = single
    ? TOPICS.filter(t => t.id === single)
    : TOPICS;

  if (!targets.length) {
    console.error(`No topic found: ${single}`);
    process.exit(1);
  }

  if (!dryRun) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  for (const topic of targets) {
    const md       = generateMarkdown(topic);
    const filename = `${topic.id}.md`;
    const outPath  = path.join(OUT_DIR, filename);

    if (dryRun) {
      console.log(`\n${'='.repeat(60)}\n${filename}\n${'='.repeat(60)}`);
      console.log(md.slice(0, 500) + '...\n');
    } else {
      fs.writeFileSync(outPath, md, 'utf8');
      console.log(`✓  ${filename}`);
    }
  }

  if (!dryRun) {
    console.log(`\n✅  Generated ${targets.length} topic file(s) → ${OUT_DIR}`);
  }
}

main();
