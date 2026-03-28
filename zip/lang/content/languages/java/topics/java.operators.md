---
path: java.operators
title: Operators
section: core-language
difficulty: beginner
estimatedMins: 10
sortOrder: 3
tags: [java, operators, arithmetic, logical, ternary]
isDeepDive: false
---

:::text
Operators are special symbols that perform operations on variables and values. Java has 6 categories of operators. Understanding operator precedence — which operator is evaluated first — is critical for writing correct expressions without relying on guesswork.
:::

:::concept icon=➕ title="Arithmetic"
+ - * / % for math. % gives remainder. ++ and -- increment/decrement by 1. Prefix (++x) increments before use; postfix (x++) after.
:::

:::concept icon=⚖️ title="Relational"
== != < > <= >= compare two values and return boolean. Never use == to compare Strings — use .equals() which compares characters.
:::

:::concept icon=🔀 title="Logical"
&& (AND), || (OR), ! (NOT) combine boolean expressions. && and || short-circuit: they stop evaluating as soon as the result is known.
:::

:::concept icon=🔧 title="Bitwise"
& | ^ ~ << >> >>> operate on individual bits. Used in flags, permission masks, and low-level optimisation. ^ is XOR, ~ is bitwise NOT.
:::

:::concept icon=❓ title="Ternary"
condition ? valueIfTrue : valueIfFalse — compact one-line if/else. Great for simple assignments. Avoid nesting ternary expressions.
:::

:::concept icon=📝 title="Assignment"
+= -= *= /= %= are shorthand. x += 5 means x = x + 5. Always evaluates right side first. Compound operators are more readable.
:::

:::diagram diagramKey=java_operators title="Operator Precedence"
:::

:::code language=java filename=Operators.java runnable=true
public class Operators {
    public static void main(String[] args) {

        // -- Arithmetic --
        int a = 17, b = 5;
        System.out.println("a + b = " + (a + b));   // 22
        System.out.println("a - b = " + (a - b));   // 12
        System.out.println("a * b = " + (a * b));   // 85
        System.out.println("a / b = " + (a / b));   // 3  (integer division!)
        System.out.println("a % b = " + (a % b));   // 2  (remainder)

        // -- Pre vs Post increment --
        int x = 10;
        System.out.println("x++   = " + x++); // prints 10, then x=11
        System.out.println("++x   = " + ++x); // x=12, prints 12

        // -- Relational --
        System.out.println("a > b  : " + (a > b));   // true
        System.out.println("a == b : " + (a == b));  // false

        // -- Logical & short-circuit --
        boolean t = true, f = false;
        System.out.println("t && f : " + (t && f)); // false
        System.out.println("t || f : " + (t || f)); // true
        System.out.println("!t     : " + (!t));      // false

        // -- Ternary --
        int max = (a > b) ? a : b;
        System.out.println("max    = " + max);       // 17

        // -- Compound assignment --
        int score = 100;
        score -= 15;
        score *= 2;
        System.out.println("score  = " + score);    // 170

        // -- Bitwise --
        System.out.println("5 & 3  = " + (5 & 3));  // 1
        System.out.println("5 | 3  = " + (5 | 3));  // 7
        System.out.println("5 ^ 3  = " + (5 ^ 3));  // 6
        System.out.println("1 << 3 = " + (1 << 3)); // 8  (left shift = *8)
    }
}
---output
a + b = 22
a - b = 12
a * b = 85
a / b = 3
a % b = 2
x++   = 10
++x   = 12
a > b  : true
a == b : false
t && f : false
t || f : true
!t     : false
max    = 17
score  = 170
5 & 3  = 1
5 | 3  = 7
5 ^ 3  = 6
1 << 3 = 8
:::

:::quiz questionId=q_java_ops_001
question: What is the result of 17 % 5 in Java?
options:
* 3
* 3.4
* 2
* 0
answer: 3
explanation: The % operator returns the remainder. 17 ÷ 5 = 3 remainder 2. So 17 % 5 = 2.
:::

:::quiz questionId=q_java_ops_002
question: What value does x hold after: int x = 5; int y = x++;
options:
* x = 6, y = 5
* x = 5, y = 5
* x = 6, y = 6
* x = 5, y = 6
answer: 1
explanation: Postfix x++ returns the current value (5) to y first, then increments x to 6. So y = 5, x = 6.
:::

:::quiz questionId=q_java_ops_003
question: Which operator should you use to compare two String values in Java?
options:
* ==
* ===
* .equals()
* .compare()
answer: 3
explanation: == compares object references (memory addresses), not content. .equals() compares the actual characters. Two different String objects with "Hello" would fail == but pass .equals().
:::
