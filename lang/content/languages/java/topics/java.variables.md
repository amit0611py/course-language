---
path: java.variables
title: Variables & Data Types
section: core-language
difficulty: beginner
estimatedMins: 12
sortOrder: 2
tags: [java, variables, datatypes, primitives, casting]
isDeepDive: false
---

:::text
A variable is a named container that holds data. Java is a strongly-typed language — every variable must be declared with an explicit type before use. Java has 8 primitive types that store raw values, plus reference types (like String, arrays, objects) that store a pointer to data on the heap.
:::

:::concept icon=🔢 title="Primitive Types"
8 built-in value types: byte, short, int, long, float, double, boolean, char. Stored directly on the stack — no object overhead, fastest access.
:::

:::concept icon=🔗 title="Reference Types"
String, arrays, objects. The variable holds a memory address pointing to data on the heap. Includes all class instances.
:::

:::concept icon=🔄 title="Type Casting"
Widening (int→double) is automatic. Narrowing (double→int) requires explicit cast `(int)x` — truncates, never rounds.
:::

:::concept icon=🔒 title="final Keyword"
Marks a variable as a constant — must be assigned exactly once. Convention: UPPER_SNAKE_CASE. The compiler enforces immutability.
:::

:::concept icon=📦 title="Wrapper Classes"
Integer, Double, Boolean... box primitives into objects for use in Collections and generics. Auto-boxing converts automatically.
:::

:::concept icon=🔍 title="var (Java 10+)"
Local type inference. The compiler infers the type from the right-hand side. `var x = 42;` is still strongly typed as int.
:::

:::diagram diagramKey=java_memory title="Stack vs Heap Memory"
:::

:::code language=java filename=DataTypes.java runnable=true
public class DataTypes {
    public static void main(String[] args) {

        // -- 8 Primitive Types --
        byte    b    = 127;             // -128  to  127
        short   s    = 32_767;          // -32768 to 32767
        int     age  = 2_147_483_647;   // ~2.1 billion
        long    pop  = 8_100_000_000L;  // suffix L required
        float   temp = 36.6f;           // suffix f required
        double  pi   = 3.141_592_653;   // default decimal
        boolean flag = true;            // true / false only
        char    grade = 'A';            // single char, 2 bytes

        // -- Reference Type --
        String name = "Java Developer"; // lives on heap

        // -- Type Casting --
        double  score  = 97.89;
        int     iScore = (int) score;   // narrowing -> 97 (truncated)
        long    lAge   = age;           // widening  -> automatic

        // -- Constants --
        final double GRAVITY = 9.81;    // cannot reassign

        // -- var -- local type inference (Java 10+) --
        var message = "Hello!";         // compiler infers String

        System.out.println("Name    : " + name);
        System.out.println("Age     : " + age);
        System.out.println("Score   : " + score + " -> cast: " + iScore);
        System.out.println("Gravity : " + GRAVITY);
        System.out.println("var msg : " + message);
        System.out.println("Grade   : " + grade);
    }
}
---output
Name    : Java Developer
Age     : 2147483647
Score   : 97.89 -> cast: 97
Gravity : 9.81
var msg : Hello!
Grade   : A
:::

:::quiz questionId=q_java_var_001
questionText: Which of these is NOT a primitive type in Java?
questionType: mcq
options: [{"id":"a","text":"int","correct":false},{"id":"b","text":"boolean","correct":false},{"id":"c","text":"String","correct":true},{"id":"d","text":"char","correct":false}]
explanation: String is a class (reference type) that lives on the heap. The 8 primitives are: byte, short, int, long, float, double, boolean, char.
:::

:::quiz questionId=q_java_var_002
questionText: What does casting (int) 9.99 produce?
questionType: mcq
options: [{"id":"a","text":"10","correct":false},{"id":"b","text":"9","correct":true},{"id":"c","text":"Error","correct":false},{"id":"d","text":"9.0","correct":false}]
explanation: Narrowing cast truncates — it drops the decimal part. (int) 9.99 = 9, not 10. Use Math.round() if you want rounding.
:::

:::quiz questionId=q_java_var_003
questionText: Which suffix is required when declaring a long literal larger than int range?
questionType: mcq
options: [{"id":"a","text":"s","correct":false},{"id":"b","text":"d","correct":false},{"id":"c","text":"L","correct":true},{"id":"d","text":"f","correct":false}]
explanation: The L suffix (uppercase preferred) tells Java the literal is a long. Example: long big = 9_999_999_999L; Without L the compiler treats it as int and overflows.
:::
