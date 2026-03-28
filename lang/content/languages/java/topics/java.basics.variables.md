---
path: java.basics.variables
title: Variables and Data Types
section: core-language
difficulty: beginner
estimatedMins: 10
sortOrder: 1
tags: [java, variables, types, primitives]
isDeepDive: false
---

:::text
Java has two categories of types: primitive types (stored directly on the stack) and reference types (objects stored on the heap, with a pointer on the stack). Every variable must be declared with a type before use — Java is strictly statically typed.
:::

:::concept icon=🔢 title="Primitive Types"
8 built-in types: byte, short, int, long (integers), float, double (decimals), boolean (true/false), char (single character). Stored by value directly on the stack.
:::

:::concept icon=🔗 title="Reference Types"
String, arrays, and all class instances. The variable holds a memory address pointing to the object on the heap. Can be null — primitives cannot.
:::

:::concept icon=📦 title="Wrapper Classes"
Integer, Double, Boolean, Character... Each primitive has a wrapper class for use in Collections and generics. Auto-boxing converts automatically: `Integer i = 42;`.
:::

:::concept icon=🔍 title="var — Type Inference"
Java 10+ allows `var count = 42;` — the compiler infers int from the right-hand side. Still strongly typed: count IS an int. Only works for local variables.
:::

:::concept icon=🚫 title="null and Primitives"
Primitive types cannot be null — assigning null causes a compile error. Use the wrapper class (Integer, Double) when you need a nullable numeric value.
:::

:::diagram diagramKey=java_type_categories type=mermaid
graph TD
    Types --> Primitives
    Types --> References
    Primitives --> byte
    Primitives --> short
    Primitives --> int
    Primitives --> long
    Primitives --> float
    Primitives --> double
    Primitives --> char
    Primitives --> boolean
    References --> String
    References --> Arrays
    References --> Objects
:::

:::code language=java filename=Variables.java runnable=true
public class Variables {
    public static void main(String[] args) {
        // Primitives — stored on stack
        int     age    = 25;
        double  salary = 75_000.50;  // underscores allowed for readability
        boolean active = true;
        char    grade  = 'A';

        // Reference type — stored on heap
        String name = "Alice";

        // Wrapper class — boxed int
        Integer nullableAge = null;  // primitives can't be null

        // Type inference (Java 10+)
        var count = 42;  // inferred as int

        System.out.println(name + " is " + age + " years old.");
        System.out.println("Salary: " + salary);
        System.out.println("Active: " + active + " | Grade: " + grade);
        System.out.println("Nullable: " + nullableAge);
    }
}
---output
Alice is 25 years old.
Salary: 75000.5
Active: true | Grade: A
Nullable: null
:::

:::warning
Primitive types cannot be null. Assigning null to an `int` causes a compile error. Use `Integer` (the wrapper class) when you need nullable numeric values.
:::

:::quiz questionId=q_java_basics_vars_001
questionText: Which of these is a primitive type in Java?
questionType: mcq
options: [{"id":"a","text":"String","correct":false},{"id":"b","text":"Integer","correct":false},{"id":"c","text":"int","correct":true},{"id":"d","text":"Array","correct":false}]
explanation: int is a primitive type. String, Integer, and arrays are reference types (objects). Integer is the boxed wrapper for int.
:::

:::quiz questionId=q_java_basics_vars_002
question: What is auto-boxing in Java?
options:
* Converting a String to a number automatically
* Automatic conversion between primitives and their wrapper classes
* Wrapping a class in a package
* The JVM boxing memory into the heap
answer: 2
explanation: Auto-boxing is the automatic conversion from a primitive (int) to its wrapper class (Integer) and vice versa (unboxing). Java handles this transparently — `Integer i = 42;` auto-boxes, `int x = i;` auto-unboxes.
:::
