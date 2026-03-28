---
path: java.basics
title: Java Basics
section: core-language
difficulty: beginner
estimatedMins: 8
sortOrder: 1
tags: [java, basics, syntax, beginner]
---

:::text
Java is a statically typed, compiled-to-bytecode language that runs on the Java Virtual Machine (JVM). Programs are written in `.java` source files, compiled to `.class` bytecode, then executed by the JVM on any platform.
:::

:::concept icon=📄 title="Source File"
Every Java program starts in a .java file. The public class name must exactly match the filename. Java is case-sensitive — `Main` and `main` are different identifiers.
:::

:::concept icon=🚀 title="main Method"
`public static void main(String[] args)` is the entry point for every application. The JVM calls this method to start execution. Without it, the JVM can't run your class.
:::

:::concept icon=🖨️ title="System.out.println"
Prints a line to standard output. System.out.print() prints without a newline. System.out.printf() formats output like C's printf. System.err.println() prints to error stream.
:::

:::concept icon=💬 title="Comments"
`// single line`, `/* multi-line */`, `/** Javadoc */`. Javadoc comments on classes and methods generate API documentation with the javadoc tool.
:::

:::concept icon=📦 title="Packages"
`package com.example.app;` organises classes into namespaces. `import java.util.List;` brings a class into scope. The package name must match the directory structure.
:::

:::concept icon=21️⃣ title="Java 21 LTS"
Java 21 is the current Long-Term Support release with multi-year support. All examples in this course target Java 21. Use `java --version` to check your installed version.
:::

:::diagram diagramKey=java_jvm title="How Java Code Runs"
:::

:::code language=java filename=HelloWorld.java runnable=true
// Single-line comment
/* Multi-line comment */

public class HelloWorld {

    // Entry point — JVM calls this first
    public static void main(String[] args) {

        // Print to console
        System.out.println("Hello, World!");
        System.out.println("Java 21 LTS");

        // Variables — must declare type
        int    year   = 1995;
        String author = "James Gosling";

        System.out.println("Java created: " + year);
        System.out.println("By: " + author);

        // Java 10+ type inference
        var message = "Write once, run anywhere!";
        System.out.println(message);
    }
}
---output
Hello, World!
Java 21 LTS
Java created: 1995
By: James Gosling
Write once, run anywhere!
:::

:::quiz questionId=q_java_basics_001
questionText: What does the JVM stand for?
questionType: mcq
options: [{"id":"a","text":"Java Virtual Machine","correct":true},{"id":"b","text":"Java Variable Manager","correct":false},{"id":"c","text":"Java Version Manager","correct":false},{"id":"d","text":"Java Verification Module","correct":false}]
explanation: JVM stands for Java Virtual Machine — the runtime environment that executes compiled Java bytecode.
:::

:::quiz questionId=q_java_basics_002
question: What must be true about the public class name in a Java file?
options:
* It must be lowercase
* It must exactly match the filename (without .java)
* It must start with "Java"
* It can be any name regardless of the filename
answer: 2
explanation: Java requires that a public class name exactly matches its filename. HelloWorld must be in HelloWorld.java. This is enforced by the compiler — a mismatch causes a compile error.
:::
