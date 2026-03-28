---
path: java.strings
title: Strings
section: core-language
difficulty: beginner
estimatedMins: 12
sortOrder: 7
tags: [java, strings, immutability, stringbuilder, methods]
isDeepDive: false
---

:::text
Strings in Java are objects — instances of the java.lang.String class. They are immutable: once created, their content cannot change. Operations like concatenation always create a new String. Java maintains a String Pool to cache literals and save memory.
:::

:::concept icon=🔒 title="Immutability"
Once a String is created, it cannot be changed. Operations like concat or replace always return a NEW String object. The original stays unchanged in memory.
:::

:::concept icon=🏊 title="String Pool"
Java caches string literals in a pool inside the heap. `String a = "Hi"; String b = "Hi";` — both point to the same object. Saves memory and speeds up literal lookups.
:::

:::concept icon=⚖️ title="== vs .equals()"
== compares references (memory address). .equals() compares actual characters. Always use .equals() or equalsIgnoreCase() for Strings — == will mislead you.
:::

:::concept icon=🛠️ title="StringBuilder"
Mutable string buffer. append(), insert(), delete(), reverse() all modify in-place. Use in loops instead of String + to avoid creating garbage objects.
:::

:::concept icon=📚 title="Common Methods"
length(), charAt(i), substring(a,b), indexOf(), contains(), replace(), split(), trim(), strip(), toUpperCase(), toLowerCase(), startsWith(), endsWith().
:::

:::concept icon=🖨️ title="String.format / formatted"
`String.format("Hello %s, you are %d", name, age)` — clean alternative to + concatenation. Java 15+: `"Hello %s".formatted(name)` — same but as instance method.
:::

:::diagram diagramKey=java_stringpool title="String Pool & Immutability"
:::

:::code language=java filename=Strings.java runnable=true
public class Strings {
    public static void main(String[] args) {

        String s = "Hello, Java World!";

        // -- Common methods --
        System.out.println("length   : " + s.length());
        System.out.println("upper    : " + s.toUpperCase());
        System.out.println("contains : " + s.contains("Java"));
        System.out.println("replace  : " + s.replace("Java", "JVM"));
        System.out.println("charAt(7): " + s.charAt(7));
        System.out.println("substr   : " + s.substring(7, 11));
        System.out.println("indexOf  : " + s.indexOf("World"));

        // -- == vs equals --
        String a = "Java";
        String b = "Java";
        String c = new String("Java"); // forces a new object on heap
        System.out.println("a == b   : " + (a == b));       // true  (same pool ref)
        System.out.println("a == c   : " + (a == c));       // false (different obj)
        System.out.println("a.eq(c)  : " + a.equals(c));    // true  (same content)

        // -- StringBuilder for loops --
        StringBuilder sb = new StringBuilder();
        for (int i = 1; i <= 5; i++) {
            sb.append(i);
            if (i < 5) sb.append(", ");
        }
        System.out.println("sb       : " + sb);

        // -- format --
        String msg = String.format("Score: %d / %d (%.1f%%)", 87, 100, 87.0);
        System.out.println(msg);

        // -- split & join --
        String csv = "Alice,Bob,Carol,David";
        String[] parts = csv.split(",");
        System.out.println("parts[1] : " + parts[1]);
        System.out.println("joined   : " + String.join(" | ", parts));
    }
}
---output
length   : 18
upper    : HELLO, JAVA WORLD!
contains : true
replace  : Hello, JVM World!
charAt(7): J
substr   : Java
indexOf  : 13
a == b   : true
a == c   : false
a.eq(c)  : true
sb       : 1, 2, 3, 4, 5
Score: 87 / 100 (87.0%)
parts[1] : Bob
joined   : Alice | Bob | Carol | David
:::

:::quiz questionId=q_java_str_001
question: Why should you use .equals() instead of == when comparing Strings?
options:
* .equals() is faster
* == only works for primitives; .equals() compares object content
* There is no difference for Strings
* .equals() is case-insensitive
answer: 2
explanation: == compares memory references — two String objects with identical text can have different addresses (especially with new String()). .equals() compares the actual character sequences.
:::

:::quiz questionId=q_java_str_002
question: What does String.substring(2, 5) return for "JavaProgramming"?
options:
* "Jav"
* "vaP"
* "ava"
* "avP"
answer: 3
explanation: substring(start, end) is start-inclusive, end-exclusive. Indices 2,3,4 → 'v','a','P' → "vaP". Remember: index 0='J', 1='a', 2='v', 3='a', 4='P'.
:::

:::quiz questionId=q_java_str_003
question: Why is StringBuilder preferred over String concatenation in a loop?
options:
* StringBuilder is always faster than Strings
* Each String + creates a new immutable object; StringBuilder modifies in-place
* Strings cannot be used in loops
* StringBuilder uses less memory overall
answer: 2
explanation: Strings are immutable — every + in a loop creates a new String object, discarding the old one. StringBuilder accumulates characters in a mutable buffer, creating only one final String.
:::
