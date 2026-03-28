---
path: java.intro
title: Introduction to Java
section: core-language
difficulty: beginner
estimatedMins: 10
sortOrder: 1
tags: [java, intro, jvm, jdk, bytecode]
isDeepDive: false
---

:::text
Java is a high-level, class-based, object-oriented language designed to run on any platform via the Java Virtual Machine (JVM). Created by James Gosling at Sun Microsystems in 1995, it now powers Android apps, enterprise systems, web servers, and billions of embedded devices worldwide.
:::

:::concept icon=☕ title=JVM
Java Virtual Machine — executes bytecode on any OS. The heart of "write once, run anywhere" platform independence.
:::

:::concept icon=🛠️ title=JDK
Java Development Kit — the full toolbox: compiler (javac), debugger, and JRE bundled together. You need this to write and build Java.
:::

:::concept icon=▶️ title=JRE
Java Runtime Environment — what end-users need to run Java apps. Contains the JVM and standard libraries, but not the compiler.
:::

:::concept icon=📦 title=Bytecode
Compiled .class files. Not machine code, not source. The JVM interprets this platform-neutral format for any OS.
:::

:::concept icon=🗑️ title="Garbage Collection"
Java automatically frees unused memory. No manual malloc/free — the GC runs in the background, preventing most memory leaks.
:::

:::concept icon=🔒 title="Strong Typing"
Every variable has a declared type checked at compile time. Type mismatches are caught before the program ever runs.
:::

:::diagram diagramKey=java_compilation_flow title="Java Compilation Flow" type=mermaid
graph LR
    A[".java\nSource"] -->|javac| B[".class\nBytecode"]
    B --> C["JVM\nClassLoader"]
    C --> D["Execution\nEngine"]
    D -->|Interpreter| E["Program\nOutput"]
    D -->|JIT Compiler| E
    style A fill:#f0ad4e,color:#000
    style B fill:#5bc0de,color:#000
    style C fill:#5cb85c,color:#fff
    style D fill:#5cb85c,color:#fff
    style E fill:#d9534f,color:#fff
:::

:::code language=java filename=HelloWorld.java runnable=true
public class HelloWorld {

    // Entry point of every Java application
    public static void main(String[] args) {

        // Print to console
        System.out.println("Hello, World!");
        System.out.println("Java runs on the JVM!");

        // Variables -- strongly typed
        int year      = 1995;
        String author = "James Gosling";

        System.out.println("Java created in " + year);
        System.out.println("Author: " + author);

        // Java is case-sensitive
        // 'year' and 'Year' are different variables
    }
}
---output
Hello, World!
Java runs on the JVM!
Java created in 1995
Author: James Gosling
:::

:::quiz questionId=q_java_intro_001
question: What does JVM stand for?
options:
* Java Variable Module
* Java Virtual Machine
* Java Version Manager
* Java Verified Method
answer: 2
explanation: JVM = Java Virtual Machine. It executes Java bytecode and enables 'write once, run anywhere' by abstracting the underlying OS.
:::

:::quiz questionId=q_java_intro_002
question: Which file extension does compiled Java bytecode use?
options:
* .java
* .exe
* .class
* .jar
answer: 3
explanation: .class files contain platform-neutral bytecode. Source code is .java. .jar is a bundle of .class files (Java Archive).
:::

:::quiz questionId=q_java_intro_003
question: Which component do you need to WRITE and COMPILE Java programs?
options:
* JVM only
* JRE only
* JDK
* A text editor alone
answer: 3
explanation: JDK (Java Development Kit) includes the compiler javac, debugging tools, and the JRE — everything needed for development.
:::
