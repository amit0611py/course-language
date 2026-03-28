---
path: java.streams
title: Streams & Lambdas
section: advanced
difficulty: advanced
estimatedMins: 16
sortOrder: 2
tags: [java, streams, lambda, functional, collectors, optional]
isDeepDive: false
---

:::text
Java 8 introduced the Stream API and lambda expressions, enabling functional-style programming. A stream is a pipeline that processes elements lazily — intermediate operations build up the pipeline, and a terminal operation triggers execution. Streams don't store data; they describe how to compute it.
:::

:::concept icon=λ title="Lambda Expressions"
`(params) -> expression`. A concise anonymous function that implements a functional interface. No class boilerplate needed. `(a, b) -> a + b` replaces an entire anonymous class.
:::

:::concept icon=🔗 title="Method References"
Shorthand for lambdas that call an existing method: `Class::staticMethod`, `obj::instanceMethod`, `Class::new`. e.g. `System.out::println` replaces `x -> System.out.println(x)`.
:::

:::concept icon=🌊 title="Stream Pipeline"
source → intermediate ops (lazy, return Stream) → terminal op (triggers execution). Streams are single-use — once consumed, create a new one. Parallel streams with .parallelStream().
:::

:::concept icon=🔍 title="filter / map / flatMap"
filter keeps elements matching a predicate. map transforms each element. flatMap flattens nested collections into one stream — turns `Stream<List<T>>` into `Stream<T>`.
:::

:::concept icon=📦 title="reduce / collect"
reduce folds elements to a single value (sum, product). collect gathers into List, Set, Map, or joined String via Collectors.toList(), groupingBy(), joining(), etc.
:::

:::concept icon=❓ title="Optional<T>"
A container that may or may not hold a value — replaces null checks. findFirst() returns Optional<T>. Use orElse(), orElseGet(), ifPresent(), map() — avoid get() without isPresent().
:::

:::diagram diagramKey=java_streams title="Stream Pipeline"
:::

:::code language=java filename=Streams.java runnable=true
import java.util.*;
import java.util.stream.*;

public class Streams {

    record Student(String name, int grade, String subject) {}

    public static void main(String[] args) {
        List<Student> students = List.of(
            new Student("Alice",  92, "Math"),
            new Student("Bob",    65, "Science"),
            new Student("Carol",  88, "Math"),
            new Student("David",  45, "History"),
            new Student("Eva",    95, "Science"),
            new Student("Frank",  78, "Math")
        );

        // filter + map + collect
        List<String> topStudents = students.stream()
            .filter(s -> s.grade() >= 80)
            .sorted(Comparator.comparing(Student::grade).reversed())
            .map(Student::name)
            .collect(Collectors.toList());
        System.out.println("Top students: " + topStudents);

        // groupingBy + averagingInt
        Map<String, Double> avgBySubject = students.stream()
            .collect(Collectors.groupingBy(
                Student::subject,
                Collectors.averagingInt(Student::grade)
            ));
        System.out.println("Avg by subject: " + avgBySubject);

        // reduce — total grades
        int total = students.stream()
            .mapToInt(Student::grade)
            .sum();
        System.out.println("Total grades: " + total);

        // findFirst + Optional
        Optional<Student> topScorer = students.stream()
            .max(Comparator.comparingInt(Student::grade));
        topScorer.ifPresent(s ->
            System.out.println("Top scorer: " + s.name() + " (" + s.grade() + ")")
        );

        // Method reference
        System.out.print("All: ");
        students.stream()
            .map(Student::name)
            .forEach(name -> System.out.print(name + " "));
        System.out.println();
    }
}
---output
Top students: [Eva, Alice, Carol, Frank]
Avg by subject: {Math=86.0, Science=80.0, History=45.0}
Total grades: 463
Top scorer: Eva (95)
All: Alice Bob Carol David Eva Frank 
:::

:::quiz questionId=q_java_str_stream_001
question: When does a Stream pipeline actually execute?
options:
* When stream() is called on the source
* When any intermediate operation like filter() is called
* Only when a terminal operation like collect() or forEach() is called
* Immediately as each line is executed
answer: 3
explanation: Stream intermediate operations are lazy — filter(), map(), sorted() don't execute immediately. They build a pipeline description. Execution only triggers when a terminal operation (collect, forEach, count, findFirst, reduce) is called. This allows the JVM to optimise the whole pipeline.
:::

:::quiz questionId=q_java_str_stream_002
question: What does flatMap() do differently from map()?
options:
* flatMap() is faster than map()
* flatMap() flattens nested collections — Stream<List<T>> becomes Stream<T>
* flatMap() applies the function in reverse order
* flatMap() only works with String types
answer: 2
explanation: map() transforms each element 1-to-1. flatMap() transforms each element 1-to-many AND flattens the result. Example: if each Student has a List<String> hobbies, flatMap(Student::getHobbies) produces a single Stream<String> of all hobbies across all students.
:::

:::quiz questionId=q_java_str_stream_003
question: What does Optional.orElse("default") do?
options:
* It throws an exception if the value is absent
* It returns the contained value if present, or the given default if absent
* It returns null if the Optional is empty
* It replaces the Optional's value with the given default
answer: 2
explanation: Optional.orElse() is the safe way to extract a value with a fallback. If the Optional contains a value, it returns that value. If empty (Optional.empty()), it returns the argument. This is cleaner than if(opt.isPresent()) opt.get() else default.
:::
