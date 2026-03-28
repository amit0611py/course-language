---
path: java.threads
title: Threads & Concurrency
section: advanced
difficulty: advanced
estimatedMins: 18
sortOrder: 1
tags: [java, threads, concurrency, synchronized, executorservice, volatile]
isDeepDive: false
---

:::text
A thread is the smallest unit of execution. Java supports true multithreading — multiple threads run simultaneously on multiple CPU cores. Concurrency enables parallelism but introduces new challenges: race conditions, visibility issues, and deadlocks must be managed carefully.
:::

:::concept icon=🧵 title="Thread Creation"
Extend Thread or implement Runnable/Callable. Modern approach: use ExecutorService thread pools — they reuse threads and manage the lifecycle for you.
:::

:::concept icon=🔄 title="Thread Lifecycle"
NEW → RUNNABLE → BLOCKED/WAITING/TIMED_WAITING → TERMINATED. Managed by the JVM scheduler. A thread moves between states as it acquires locks, waits, and completes.
:::

:::concept icon=⚠️ title="Race Conditions"
Two threads read-modify-write shared state simultaneously, causing lost updates. counter++ is not atomic — it compiles to read, increment, write — three separate operations.
:::

:::concept icon=🔐 title="synchronized"
A synchronized method/block allows only one thread at a time per object monitor. Prevents race conditions. Every Java object has an intrinsic lock used by synchronized.
:::

:::concept icon=👁️ title="volatile"
Guarantees visibility — a volatile variable is always read from/written to main memory, skipping thread-local CPU caches. Use for simple flags, not compound operations.
:::

:::concept icon=🏊 title="ExecutorService"
Thread pool that reuses threads. newFixedThreadPool(n) limits concurrency. submit() returns a Future<T> holding the async result. shutdown() signals no new tasks.
:::

:::diagram diagramKey=java_threads title="Thread Lifecycle & Concurrency"
:::

:::code language=java filename=Threads.java runnable=true
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

public class Threads {

    // AtomicInteger — thread-safe counter without synchronized
    static AtomicInteger counter = new AtomicInteger(0);

    public static void main(String[] args) throws InterruptedException, ExecutionException {

        // -- ExecutorService thread pool --
        ExecutorService pool = Executors.newFixedThreadPool(2);

        for (int t = 0; t < 4; t++) {
            final int taskId = t + 1;
            pool.submit(() -> {
                String thread = Thread.currentThread().getName();
                System.out.println("Task-" + taskId + " start [" + thread + "]");
                counter.incrementAndGet(); // atomic — no race condition
                System.out.println("Task-" + taskId + " done  [" + thread + "]");
            });
        }
        pool.shutdown();
        pool.awaitTermination(5, TimeUnit.SECONDS);
        System.out.println("Counter: " + counter.get()); // always 4

        // -- Callable + Future for async result --
        ExecutorService exec = Executors.newSingleThreadExecutor();
        Future<Integer> future = exec.submit(() -> {
            Thread.sleep(100); // simulate work
            return 42 * 2;
        });
        System.out.println("Waiting for async result...");
        System.out.println("Async result: " + future.get()); // blocks until ready
        exec.shutdown();
    }
}
---output
Task-1 start [pool-1-thread-1]
Task-2 start [pool-1-thread-2]
Task-1 done  [pool-1-thread-1]
Task-3 start [pool-1-thread-1]
Task-2 done  [pool-1-thread-2]
Task-4 start [pool-1-thread-2]
Task-3 done  [pool-1-thread-1]
Task-4 done  [pool-1-thread-2]
Counter: 4
Waiting for async result...
Async result: 84
:::

:::quiz questionId=q_java_thr_001
question: Why is counter++ not thread-safe?
options:
* The ++ operator is deprecated in multithreaded code
* counter++ compiles to three separate operations (read, increment, write) that can interleave between threads
* Java doesn't allow ++ on shared variables
* It works fine — counter++ is atomic
answer: 2
explanation: counter++ is syntactic sugar for counter = counter + 1, which involves read-modify-write. Thread A may read 5, Thread B reads 5, both write 6 — one increment is lost. Use AtomicInteger.incrementAndGet() or synchronized for thread-safe counters.
:::

:::quiz questionId=q_java_thr_002
question: What is the purpose of ExecutorService over creating raw Thread objects?
options:
* ExecutorService is required by the Java specification
* It manages a thread pool — reusing threads, limiting concurrency, and handling lifecycle
* ExecutorService is faster for single-threaded programs
* It replaces the need for synchronized
answer: 2
explanation: Creating a new Thread for every task is expensive (JVM and OS overhead). ExecutorService maintains a pool of reusable threads, queues tasks efficiently, limits maximum concurrency with a fixed pool, and provides Future for async results. It's the recommended approach since Java 5.
:::

:::quiz questionId=q_java_thr_003
question: What does the volatile keyword guarantee?
options:
* That only one thread can access the variable at a time
* That the variable is always read from main memory — not a thread-local CPU cache
* That the variable cannot be changed after assignment
* That the variable is garbage collected immediately when unused
answer: 2
explanation: volatile ensures visibility — changes by one thread are immediately visible to other threads because every read goes to main memory. It does NOT provide atomicity — volatile int x; x++ is still not thread-safe. Use for simple flags, not read-modify-write operations.
:::
