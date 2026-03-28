---
path: java.jvm
title: JVM Architecture
section: jvm-internals
difficulty: intermediate
estimatedMins: 12
sortOrder: 1
tags: [jvm, architecture, bytecode, classloader]
---

:::text
The Java Virtual Machine is the foundation of the Java platform. It provides a hardware- and OS-independent execution environment for Java bytecode. Understanding the JVM is essential for writing high-performance Java applications.
:::

:::concept icon=📥 title="Class Loader"
Loads, links, and initialises .class bytecode files into the JVM. Three phases: loading (read bytes), linking (verify + prepare + resolve), and initialisation (run static blocks).
:::

:::concept icon=💾 title="Runtime Data Areas"
Memory regions: Heap (objects/arrays, shared), JVM Stacks (frames/locals, per-thread), Method Area (class metadata, shared), PC Registers (per-thread), Native Method Stack.
:::

:::concept icon=⚙️ title="Execution Engine"
Runs bytecode via an Interpreter (slow but immediate) or JIT Compiler (compiles hot paths to native machine code for speed). The GC also lives here, cleaning up unused heap objects.
:::

:::concept icon=🔥 title="JIT Compiler"
Detects frequently executed bytecode ("hot spots") and compiles them to native machine code, removing interpretation overhead. This is why Java warms up and gets faster over time.
:::

:::concept icon=🗑️ title="Garbage Collector"
Automatically frees heap memory for objects with no references. Modern collectors: G1GC (default), ZGC (low latency), Shenandoah. Tuned via -Xms, -Xmx, -XX:+UseZGC flags.
:::

:::concept icon=🌉 title="JNI — Native Interface"
Java Native Interface lets Java call native C/C++ code and vice versa. Used by the JVM itself for OS interaction, cryptography, and performance-critical operations.
:::

:::diagram diagramKey=jvm_architecture type=mermaid
graph TD
    Source[".java source"] -->|javac| Bytecode[".class bytecode"]
    Bytecode --> ClassLoader
    ClassLoader --> RuntimeAreas["Runtime Data Areas"]
    RuntimeAreas --> MethodArea["Method Area"]
    RuntimeAreas --> Heap
    RuntimeAreas --> Stack["JVM Stacks"]
    RuntimeAreas --> NativeStack["Native Method Stack"]
    RuntimeAreas --> PC["Program Counter"]
    RuntimeAreas --> ExecutionEngine
    ExecutionEngine --> Interpreter
    ExecutionEngine --> JIT["JIT Compiler"]
    ExecutionEngine --> GC["Garbage Collector"]
:::

:::quiz questionId=q_jvm_arch_001
question: What is the role of the JIT compiler in the JVM?
options:
* It compiles .java files to .class bytecode
* It detects hot paths and compiles them to native machine code at runtime
* It interprets bytecode line by line
* It manages heap memory allocation
answer: 2
explanation: The JIT (Just-In-Time) compiler detects "hot" code paths (frequently executed bytecode) and compiles them to native machine code. After warmup, JIT-compiled code runs at near-native speed. This is why Java performance improves after startup.
:::

:::quiz questionId=q_jvm_arch_002
question: Which JVM memory regions are shared across all threads?
options:
* JVM Stack and PC Register
* Only the PC Register
* Heap and Method Area
* All memory regions are per-thread
answer: 3
explanation: The Heap (objects and arrays) and Method Area (class metadata) are shared across all threads — this is why thread safety matters for shared mutable objects. Each thread has its own JVM Stack (call frames + local variables) and PC Register (current instruction pointer).
:::

:::quiz questionId=q_jvm_arch_003
question: What does the ClassLoader do in the JVM?
options:
* It compiles source code to bytecode
* It loads, links, and initialises .class bytecode files into the JVM runtime
* It manages garbage collection
* It handles native method calls
answer: 2
explanation: The ClassLoader is responsible for loading bytecode (.class files) into the JVM. It has three phases: Loading (read bytes from file/network), Linking (verify bytecode correctness, prepare static fields, resolve references), and Initialisation (run static initialisers).
:::
