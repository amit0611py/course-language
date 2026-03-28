---
path: java.jvm.memory.heap
title: Heap Memory in the JVM
section: jvm-internals
difficulty: intermediate
estimatedMins: 12
sortOrder: 1
tags: [jvm, memory, heap, gc, young-gen, old-gen, performance]
isDeepDive: true
---

:::text
The JVM heap is the runtime data area from which memory for all class instances and arrays is allocated. It is created at JVM startup and is the primary area managed by the Garbage Collector. Understanding heap regions is key to diagnosing GC pauses and memory leaks.
:::

:::concept icon=🌱 title="Eden Space"
New objects are allocated here first. Most die young — a minor GC sweeps Eden rapidly. The Generational Hypothesis: most objects have very short lifetimes.
:::

:::concept icon=🔀 title="Survivor Spaces (S0/S1)"
Objects surviving a minor GC are copied between S0 and S1 alternately. After a configured number of GC cycles (tenure threshold), survivors are promoted to Old Gen.
:::

:::concept icon=🏛️ title="Old Generation"
Long-lived objects promoted from Young Gen. Collected less frequently by major (full) GC. Fragmentation here causes long GC pauses — tuned with -XX:NewRatio.
:::

:::concept icon=🗑️ title="Minor vs Major GC"
Minor GC: fast, cleans Young Gen only, milliseconds. Major/Full GC: slow, scans the entire heap, can cause stop-the-world pauses of hundreds of milliseconds.
:::

:::concept icon=🚀 title="G1GC (Default)"
Garbage-First Collector — default since Java 9. Divides heap into equal-sized regions, prioritises collecting regions with most garbage. Targets configurable pause time (-XX:MaxGCPauseMillis).
:::

:::concept icon=⚡ title="ZGC / Shenandoah"
Ultra-low-latency collectors. ZGC handles terabyte heaps with sub-millisecond pauses. Enable with -XX:+UseZGC. Ideal for latency-sensitive services. Available Java 15+ production-ready.
:::

:::diagram diagramKey=jvm_heap_regions type=mermaid
graph TD
    Heap --> YoungGen["Young Generation"]
    Heap --> OldGen["Old Generation (Tenured)"]
    YoungGen --> Eden["Eden Space"]
    YoungGen --> S0["Survivor 0"]
    YoungGen --> S1["Survivor 1"]
:::

:::text
The heap is divided into generations to optimise GC efficiency (Generational Hypothesis: most objects die young):

- **Eden** — new objects are allocated here
- **Survivor spaces (S0/S1)** — objects that survive a minor GC are copied here; they alternate
- **Old Gen** — objects that survive enough GC cycles are promoted here; collected by major GC
:::

:::code language=java filename=HeapDemo.java runnable=true
public class HeapDemo {
    public static void main(String[] args) {
        Runtime rt = Runtime.getRuntime();
        long maxMB   = rt.maxMemory()   / 1024 / 1024;
        long totalMB = rt.totalMemory() / 1024 / 1024;
        long freeMB  = rt.freeMemory()  / 1024 / 1024;
        System.out.printf("Max: %dMB | Total: %dMB | Free: %dMB%n",
            maxMB, totalMB, freeMB);
    }
}
:::

:::note
Configure heap size with JVM flags:
- `-Xms512m` — initial heap size (avoids early resizing pauses)
- `-Xmx2g`   — maximum heap size
- `-XX:NewRatio=3` — ratio of Old:Young gen (default 3 → 75% old, 25% young)
:::

:::warning
In containerised environments, always set `-Xmx` explicitly. Without it, the JVM defaults to 25% of container memory — which can cause it to allocate more than the container limit, triggering an OOM kill by the kernel.
:::

:::quiz questionId=q_heap_001
questionText: Where in the JVM heap are newly created objects allocated by default?
questionType: mcq
options: [{"id":"a","text":"Old Generation","correct":false},{"id":"b","text":"Survivor Space","correct":false},{"id":"c","text":"Eden Space","correct":true},{"id":"d","text":"Method Area","correct":false}]
explanation: New objects are initially allocated in Eden Space. If they survive a minor GC, they are moved to a Survivor space. After enough GC cycles, they are promoted to Old Generation.
:::
