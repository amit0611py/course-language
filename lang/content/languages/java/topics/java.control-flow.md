---
path: java.control-flow
title: Control Flow
section: core-language
difficulty: beginner
estimatedMins: 12
sortOrder: 4
tags: [java, control-flow, loops, if-else, switch]
isDeepDive: false
---

:::text
Control flow statements determine the order in which code executes. Without them, Java runs line by line from top to bottom. if/else makes decisions, switch handles multiple branches cleanly, and loops (for, while, do-while) repeat blocks of code until a condition is met.
:::

:::concept icon=🔀 title="if / else if / else"
Evaluates a boolean condition. Only one branch executes. Chain multiple conditions with else if. Braces are optional for single statements — but always use them.
:::

:::concept icon=🔄 title="switch / switch expr"
Cleaner multi-branch logic than many else-ifs. Java 14+ arrow syntax `case X ->` eliminates fall-through bugs. Works with int, String, enum, and more.
:::

:::concept icon=🔁 title="for loop"
Best when you know how many iterations. Init, condition, update — all in one line: `for (int i = 0; i < n; i++)`. Enhanced for-each for collections: `for (int x : arr)`.
:::

:::concept icon=⏳ title="while loop"
Repeats while condition is true. Checks condition BEFORE the body — may run zero times if condition starts false. Use when iteration count is unknown.
:::

:::concept icon=▶️ title="do-while"
Like while but checks condition AFTER body — always runs at least once. Useful for input validation and menu loops where you need at least one iteration.
:::

:::concept icon=⏩ title="break / continue"
break exits the loop immediately. continue skips to the next iteration. Labelled break (`break outer;`) exits a named outer loop. Use sparingly for readability.
:::

:::diagram diagramKey=java_controlflow title="Control Flow"
:::

:::code language=java filename=ControlFlow.java runnable=true
public class ControlFlow {
    public static void main(String[] args) {

        // -- if / else if / else --
        int score = 75;
        if (score >= 90)      System.out.println("Grade: A");
        else if (score >= 75) System.out.println("Grade: B");
        else if (score >= 60) System.out.println("Grade: C");
        else                  System.out.println("Grade: F");

        // -- switch expression (Java 14+) --
        int day = 3;
        String dayName = switch (day) {
            case 1 -> "Monday";
            case 2 -> "Tuesday";
            case 3 -> "Wednesday";
            case 4 -> "Thursday";
            case 5 -> "Friday";
            default -> "Weekend";
        };
        System.out.println("Day: " + dayName);

        // -- for loop --
        int sum = 0;
        for (int i = 1; i <= 5; i++) {
            sum += i;
        }
        System.out.println("Sum 1-5: " + sum);

        // -- enhanced for-each --
        int[] nums = {10, 20, 30, 40, 50};
        int total = 0;
        for (int n : nums) {
            total += n;
        }
        System.out.println("Total: " + total);

        // -- while loop --
        int count = 1;
        int product = 1;
        while (count <= 5) {
            product *= count;
            count++;
        }
        System.out.println("5! = " + product);

        // -- do-while --
        int val = 10;
        do {
            System.out.println("do-while ran with val=" + val);
            val--;
        } while (val > 10); // false from start, but body ran once

        // -- break & continue --
        for (int i = 0; i < 10; i++) {
            if (i == 3) continue;  // skip 3
            if (i == 6) break;     // stop at 6
            System.out.print(i + " ");
        }
        System.out.println();
    }
}
---output
Grade: B
Day: Wednesday
Sum 1-5: 15
Total: 150
5! = 120
do-while ran with val=10
0 1 2 4 5 
:::

:::quiz questionId=q_java_cf_001
question: Which loop always executes its body at least once?
options:
* for loop
* while loop
* do-while loop
* enhanced for-each
answer: 3
explanation: do-while checks the condition AFTER the body executes, guaranteeing at least one execution. while and for check the condition first and may skip entirely.
:::

:::quiz questionId=q_java_cf_002
question: What does the continue statement do inside a loop?
options:
* Exits the loop immediately
* Skips the rest of the current iteration and goes to the next
* Restarts the loop from the beginning
* Pauses execution temporarily
answer: 2
explanation: continue skips remaining statements in the current iteration and jumps to the loop's update/condition check. break exits the loop entirely.
:::

:::quiz questionId=q_java_cf_003
question: What is the output of: for(int i=0;i<3;i++) System.out.print(i+" ");
options:
* 1 2 3
* 0 1 2
* 0 1 2 3
* 1 2
answer: 2
explanation: i starts at 0, condition i<3 means i goes 0, 1, 2 — then condition fails at i=3. Output is "0 1 2 ".
:::
