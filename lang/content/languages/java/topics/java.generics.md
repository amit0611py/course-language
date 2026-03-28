---
path: java.generics
title: Generics
section: core-language
difficulty: intermediate
estimatedMins: 14
sortOrder: 11
tags: [java, generics, type-parameters, wildcards, type-erasure]
isDeepDive: false
---

:::text
Generics allow you to write classes and methods that work with any type while preserving type safety at compile time. Instead of using Object and casting, you parameterise with a type placeholder. The compiler verifies types — ClassCastException at runtime becomes a compile error.
:::

:::concept icon=🔠 title="Type Parameters"
`<T>` is a placeholder for any type. Convention: T=Type, E=Element, K=Key, V=Value, N=Number. T is decided when the class or method is used, not when it's written.
:::

:::concept icon=📦 title="Generic Classes"
`class Box<T> { T value; }` — T is decided at instantiation: `Box<String>` or `Box<Integer>`. The compiler enforces that only the declared type is stored or returned.
:::

:::concept icon=🔧 title="Generic Methods"
A method can have its own type parameter: `<T> T identity(T item)`. The compiler infers T from the argument. No casting needed — the return type matches the input type.
:::

:::concept icon=⬆️ title="Upper Bounded Wildcard"
`<T extends Number>` accepts Number or any subclass (Integer, Double, Long). Allows reading as Number. Use when you need to call methods of the bound type.
:::

:::concept icon=⬇️ title="Lower Bounded Wildcard"
`<? super Integer>` accepts Integer or any superclass (Number, Object). Use when you need to add/write Integer values into a collection (PECS: Producer Extends, Consumer Super).
:::

:::concept icon=🫥 title="Type Erasure"
Generics exist only at compile time. At runtime, `List<String>` becomes raw `List`. The JVM never sees type parameters — they are erased after compilation. Arrays don't have this.
:::

:::diagram diagramKey=java_generics title="Generics"
:::

:::code language=java filename=Generics.java runnable=true
// -- Generic class --
class Pair<A, B> {
    private A first;
    private B second;
    Pair(A first, B second) { this.first = first; this.second = second; }
    A getFirst()  { return first; }
    B getSecond() { return second; }
    @Override public String toString() {
        return "(" + first + ", " + second + ")";
    }
}

// -- Generic method --
class MathUtils {
    static <T extends Comparable<T>> T max(T a, T b) {
        return a.compareTo(b) >= 0 ? a : b;
    }

    // Upper bounded wildcard — read numbers, sum as double
    static double sumList(java.util.List<? extends Number> list) {
        double sum = 0;
        for (Number n : list) sum += n.doubleValue();
        return sum;
    }
}

public class Generics {
    public static void main(String[] args) {
        // Generic class with different type combos
        Pair<String, Integer> person = new Pair<>("Sheoran", 28);
        System.out.println("Person: " + person);
        System.out.println("Name  : " + person.getFirst());
        System.out.println("Age   : " + person.getSecond());

        // Generic method — compiler infers T
        System.out.println("Max(3,7): "   + MathUtils.max(3, 7));
        System.out.println("Max(a,z): "   + MathUtils.max('a', 'z'));
        System.out.println("Max(pi,e): "  + MathUtils.max(3.14, 2.71));

        // Wildcard — works with List<Integer> or List<Double>
        java.util.List<Integer> ints = java.util.List.of(1, 2, 3, 4, 5);
        System.out.println("Sum ints   : " + MathUtils.sumList(ints));

        java.util.List<Double> doubles = java.util.List.of(1.5, 2.5, 3.0);
        System.out.println("Sum doubles: " + MathUtils.sumList(doubles));
    }
}
---output
Person: (Sheoran, 28)
Name  : Sheoran
Age   : 28
Max(3,7): 7
Max(a,z): z
Max(pi,e): 3.14
Sum ints   : 15.0
Sum doubles: 7.0
:::

:::quiz questionId=q_java_gen_001
question: What problem do generics solve compared to using raw Object types?
options:
* Generics make code run faster
* Generics catch type mismatches at compile time, avoiding ClassCastException at runtime
* Generics allow storing primitive types in collections
* Generics reduce memory usage
answer: 2
explanation: Without generics, you'd use Object and cast — a wrong cast causes ClassCastException at runtime. With generics, the compiler verifies types — the error appears at compile time, before the program ever runs. This is the core value of generics.
:::

:::quiz questionId=q_java_gen_002
question: What does <T extends Number> mean on a method parameter?
options:
* T can only be exactly Number
* T must be Number or any subclass of Number
* T must be a superclass of Number
* T can be any type including primitives
answer: 2
explanation: extends in a type bound means "this type or any subtype". <T extends Number> accepts Integer, Double, Long, Float, etc. — anything that IS-A Number. This lets you call Number methods (doubleValue(), intValue()) on T safely.
:::

:::quiz questionId=q_java_gen_003
question: What is type erasure in Java generics?
options:
* The JVM removes unused generic classes from memory
* Generic type information is removed at compile time — at runtime, List<String> is just List
* Generics only exist in the IDE and are never compiled
* Type parameters are erased when passed to methods
answer: 2
explanation: Java implements generics via type erasure — generic type parameters are replaced with Object (or the bound type) at compile time. At runtime the JVM sees no generics. This ensures backward compatibility with pre-generics code but means you can't do new T() or check instanceof T<String>.
:::
