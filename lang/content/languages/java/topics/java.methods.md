---
path: java.methods
title: Methods
section: core-language
difficulty: beginner
estimatedMins: 12
sortOrder: 6
tags: [java, methods, overloading, recursion, varargs]
isDeepDive: false
---

:::text
A method is a named block of code that performs a task. Methods make programs modular, readable, and reusable. Java methods have a return type, a name, optional parameters, and a body. Methods can call themselves (recursion), and multiple methods can share the same name as long as their parameter lists differ (overloading).
:::

:::concept icon=↩️ title="Parameters & Return"
Parameters are inputs declared in parentheses. The return type comes before the method name. void means no return value. return exits the method and hands back a value.
:::

:::concept icon=🔄 title="Method Overloading"
Same method name, different parameter list (type, count, or order). Java picks the right version at compile time. Return type alone is NOT enough to distinguish overloads.
:::

:::concept icon=🌀 title="Recursion"
A method that calls itself. Must have a base case to stop — otherwise StackOverflowError. Great for divide-and-conquer: trees, fractals, factorial, Fibonacci.
:::

:::concept icon=📌 title="static vs instance"
static methods belong to the class — call via ClassName.method(). Instance methods need an object — call via obj.method(). static methods cannot access instance fields.
:::

:::concept icon=📋 title="varargs (...)"
`int sum(int... nums)` accepts any number of ints. Inside the method, nums is treated as an int[]. Only one varargs parameter is allowed and it must be last.
:::

:::concept icon=🏠 title="Scope & Lifetime"
Variables declared inside a method are local — they exist only during that method call. Parameters are also local. They are stack-allocated and freed when the method returns.
:::

:::diagram diagramKey=java_callstack title="Call Stack"
:::

:::code language=java filename=Methods.java runnable=true
public class Methods {

    // -- Basic method with return value --
    static int add(int a, int b) {
        return a + b;
    }

    // -- Method Overloading --
    static double add(double a, double b) { return a + b; }
    static int    add(int a, int b, int c) { return a + b + c; }

    // -- Recursion: factorial --
    static long factorial(int n) {
        if (n <= 1) return 1;          // base case
        return n * factorial(n - 1);   // recursive call
    }

    // -- varargs --
    static int sum(int... nums) {
        int total = 0;
        for (int n : nums) total += n;
        return total;
    }

    // -- static vs instance --
    private String name;
    Methods(String name) { this.name = name; }
    void greet() { System.out.println("Hello from " + name); }

    public static void main(String[] args) {
        // basic call
        System.out.println("add(3,4)        = " + add(3, 4));
        System.out.println("add(1.5,2.5)    = " + add(1.5, 2.5));
        System.out.println("add(1,2,3)      = " + add(1, 2, 3));

        // recursion
        System.out.println("factorial(6)    = " + factorial(6));

        // varargs
        System.out.println("sum(1..5)       = " + sum(1, 2, 3, 4, 5));
        System.out.println("sum(10,20)      = " + sum(10, 20));

        // instance method
        Methods m = new Methods("Java");
        m.greet();
    }
}
---output
add(3,4)        = 7
add(1.5,2.5)    = 4.0
add(1,2,3)      = 6
factorial(6)    = 720
sum(1..5)       = 15
sum(10,20)      = 30
Hello from Java
:::

:::quiz questionId=q_java_methods_001
question: What makes two methods valid overloads in Java?
options:
* Different return types only
* Different parameter lists (type, count, or order)
* Different access modifiers
* Different method names
answer: 2
explanation: Method overloading requires different parameter lists — different types, count, or order. Return type alone does NOT distinguish overloads. The compiler would reject two methods with same name and same parameters.
:::

:::quiz questionId=q_java_methods_002
question: What happens if a recursive method has no base case?
options:
* It returns null
* It compiles but throws StackOverflowError at runtime
* It won't compile
* It runs forever silently
answer: 2
explanation: Without a base case the method calls itself indefinitely, filling up the call stack until Java throws StackOverflowError. The code compiles fine — the error is only detected at runtime.
:::

:::quiz questionId=q_java_methods_003
question: Which statement about static methods is correct?
options:
* They can access instance fields directly
* They require an object to be called
* They belong to the class, not an instance
* They cannot have parameters
answer: 3
explanation: static methods belong to the class itself. Call them via ClassName.method(). They cannot access instance fields (this) because they run independently of any object.
:::
