---
path: java.collections
title: Collections Framework
section: core-language
difficulty: intermediate
estimatedMins: 15
sortOrder: 10
tags: [java, collections, list, set, map, queue, generics]
isDeepDive: false
---

:::text
The Java Collections Framework provides ready-made data structures for storing, retrieving, and manipulating groups of objects. Choosing the right collection is a key skill — each has different performance characteristics and semantics. All collections are generic: List<String>, Map<Integer, User>.
:::

:::concept icon=📋 title="List"
Ordered, index-accessible sequence. Duplicates allowed. ArrayList uses a resizable array (O(1) get, O(n) insert). LinkedList uses doubly-linked nodes (O(1) insert/delete at ends).
:::

:::concept icon=🎯 title="Set"
Unique values only — no duplicates. HashSet (O(1) average, unordered), LinkedHashSet (insertion order), TreeSet (sorted, O(log n)). add() returns false if element already exists.
:::

:::concept icon=🗺️ title="Map"
Key→value pairs. Keys must be unique; values can repeat. HashMap (O(1) average, unordered), LinkedHashMap (insertion order), TreeMap (sorted keys, O(log n)).
:::

:::concept icon=🚶 title="Queue & Deque"
Queue = FIFO (first-in-first-out). Deque = double-ended. ArrayDeque is faster than LinkedList for both. PriorityQueue returns elements by natural order or Comparator.
:::

:::concept icon=🛠️ title="Collections Utility"
java.util.Collections provides sort(), shuffle(), reverse(), binarySearch(), unmodifiableList(), synchronizedList(), min(), max(), frequency().
:::

:::concept icon=🔠 title="Generics"
Collections are generic — List<String>, Map<Integer, User>. Generics provide compile-time type safety and eliminate explicit casting. The diamond operator <> infers types.
:::

:::diagram diagramKey=java_collections title="Collections Framework"
:::

:::code language=java filename=Collections.java runnable=true
import java.util.*;

public class Collections {
    public static void main(String[] args) {

        // -- List --
        List<String> list = new ArrayList<>();
        list.add("Mango"); list.add("Apple"); list.add("Banana"); list.add("Mango");
        System.out.println("List  : " + list);
        System.out.println("Index 1: " + list.get(1));
        list.remove("Banana");
        java.util.Collections.sort(list);
        System.out.println("Sorted: " + list);

        // -- Set --
        Set<String> set = new LinkedHashSet<>(list); // insertion order, no dupes
        set.add("Mango");    // ignored — already present
        set.add("Cherry");
        System.out.println("Set   : " + set);

        // -- Map --
        Map<String, Integer> scores = new HashMap<>();
        scores.put("Alice", 98);
        scores.put("Bob",   87);
        scores.put("Carol", 92);
        System.out.println("Map   : " + scores);
        System.out.println("Alice : " + scores.get("Alice"));
        scores.putIfAbsent("Bob", 100);            // ignored — key exists
        scores.forEach((k, v) -> System.out.println("  " + k + " -> " + v));

        // -- Queue --
        Queue<String> queue = new ArrayDeque<>();
        queue.offer("Task-1"); queue.offer("Task-2"); queue.offer("Task-3");
        System.out.println("Poll  : " + queue.poll()); // Task-1 (FIFO)
        System.out.println("Peek  : " + queue.peek()); // Task-2 (no remove)

        // -- TreeMap — sorted keys --
        Map<String, Integer> tree = new TreeMap<>(scores);
        System.out.println("Sorted keys: " + tree.keySet());
    }
}
---output
List  : [Mango, Apple, Banana, Mango]
Index 1: Apple
Sorted: [Apple, Mango, Mango]
Set   : [Apple, Mango, Cherry]
Map   : {Alice=98, Bob=87, Carol=92}
Alice : 98
  Alice -> 98
  Bob -> 87
  Carol -> 92
Poll  : Task-1
Peek  : Task-2
Sorted keys: [Alice, Bob, Carol]
:::

:::quiz questionId=q_java_col_001
question: Which collection guarantees element uniqueness?
options:
* ArrayList
* LinkedList
* HashSet
* ArrayDeque
answer: 3
explanation: Set implementations (HashSet, LinkedHashSet, TreeSet) reject duplicates — add() returns false if the element already exists. List and Queue allow duplicates. Use Set when you need to track "has this been seen before?"
:::

:::quiz questionId=q_java_col_002
question: What is the main performance advantage of HashMap over TreeMap?
options:
* HashMap uses less memory
* HashMap has O(1) average get/put vs TreeMap's O(log n)
* HashMap preserves insertion order
* HashMap supports null keys unlike TreeMap
answer: 2
explanation: HashMap hashes the key for O(1) average-case operations. TreeMap maintains a balanced BST for sorted order, giving O(log n) operations. Choose HashMap for speed, TreeMap when you need sorted key iteration.
:::

:::quiz questionId=q_java_col_003
question: What does Queue.poll() do differently from Queue.remove()?
options:
* poll() adds an element; remove() deletes one
* poll() returns null on empty queue; remove() throws NoSuchElementException
* poll() looks at the head; remove() deletes the tail
* There is no difference
answer: 2
explanation: poll() is the safe version: it returns null if the queue is empty. remove() throws NoSuchElementException on an empty queue. Similarly, peek() is safe (returns null) while element() throws. Always use poll()/peek() in production.
:::
