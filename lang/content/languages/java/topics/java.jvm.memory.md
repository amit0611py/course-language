---
path: java.jvm.memory
title: JVM Memory Model
section: jvm-internals
difficulty: intermediate
estimatedMins: 10
sortOrder: 1
tags: [jvm, memory, heap, stack, gc]
isDeepDive: true
---

:::text
The JVM organises memory into distinct regions, each with a specific purpose. Misunderstanding these regions is the root cause of most memory-related issues: OutOfMemoryError, stack overflows, and GC pauses.
:::

:::concept icon=🏔️ title="Heap"
Shared across all threads. Stores all objects and arrays. Managed by the Garbage Collector. Divided into Young Generation and Old Generation for GC efficiency.
:::

:::concept icon=📚 title="JVM Stack"
One per thread. Stores call frames — each method call pushes a frame with local variables, operand stack, and return address. Popped when the method returns.
:::

:::concept icon=📖 title="Method Area"
Shared across all threads. Stores class metadata: bytecode, field names, method signatures, static variables. Called Metaspace in Java 8+ (grows off-heap automatically).
:::

:::concept icon=🎯 title="PC Register"
One per thread. Holds the address of the currently executing JVM instruction. Points into bytecode for interpreted methods, undefined for native methods.
:::

:::concept icon=💥 title="StackOverflowError"
A thread's stack exceeded its limit (-Xss). Almost always caused by runaway recursion — a recursive method with no base case, or extremely deep call chains.
:::

:::concept icon=🚨 title="OutOfMemoryError"
Heap is full and GC cannot free enough space. Profile with VisualVM or async-profiler before blindly increasing -Xmx. Could be a memory leak (objects held in static collections).
:::

:::diagram diagramKey=jvm_memory_model type=mermaid
graph LR
    subgraph JVM Memory
        Heap["Heap\n(objects, arrays)"]
        Stack["JVM Stack\n(frames, locals)"]
        MethodArea["Method Area\n(class metadata)"]
        PC["PC Register\n(per thread)"]
        Native["Native Stack\n(JNI calls)"]
    end
:::

:::warning
`java.lang.StackOverflowError` means a thread's stack exceeded `-Xss`. This almost always indicates runaway recursion.
`java.lang.OutOfMemoryError: Java heap space` means the heap is full. Profile with VisualVM or async-profiler before blindly increasing `-Xmx`.
:::

:::quiz questionId=q_jvm_mem_001
questionText: Which JVM memory region is shared across all threads?
questionType: mcq
options: [{"id":"a","text":"JVM Stack","correct":false},{"id":"b","text":"PC Register","correct":false},{"id":"c","text":"Heap","correct":true},{"id":"d","text":"All of the above","correct":false}]
explanation: The Heap (and Method Area) is shared across all threads. Each thread gets its own JVM Stack and PC Register.
:::
