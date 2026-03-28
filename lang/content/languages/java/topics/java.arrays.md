---
path: java.arrays
title: Arrays
section: core-language
difficulty: beginner
estimatedMins: 12
sortOrder: 8
tags: [java, arrays, 2d-arrays, sorting, foreach]
isDeepDive: false
---

:::text
An array is a fixed-size, ordered container that holds elements of a single type. Arrays are objects in Java — they live on the heap. Once created, their size cannot change. For dynamic sizing, use ArrayList. Arrays are the foundation for all other data structures.
:::

:::concept icon=📏 title="Declaration & Creation"
`int[] arr = new int[5];` creates array of 5 zeros. `int[] arr = {1,2,3};` initialises inline. Size is fixed at creation time and stored in arr.length.
:::

:::concept icon=0️⃣ title="Zero-based Indexing"
First element is [0], last is [length-1]. Accessing out of bounds throws ArrayIndexOutOfBoundsException at runtime. Always check bounds in loops.
:::

:::concept icon=🔲 title="2D Arrays"
`int[][] grid = new int[3][4];` — an array of arrays. `grid[row][col]` to access. Rows can have different lengths (jagged arrays). Useful for grids and matrices.
:::

:::concept icon=🔄 title="Enhanced for-each"
`for (int x : arr)` — cleaner iteration when you don't need the index. Read-only: you cannot modify the array elements through the loop variable.
:::

:::concept icon=🛠️ title="Arrays Utility Class"
Arrays.sort(arr), Arrays.fill(arr, 0), Arrays.copyOf(arr, n), Arrays.copyOfRange(arr, from, to), Arrays.toString(arr), Arrays.binarySearch(arr, val).
:::

:::concept icon=🔀 title="Array vs ArrayList"
Arrays: fixed size, supports primitives, slightly faster. ArrayList: dynamic size, generics, rich API (add/remove/contains). Convert: Arrays.asList(arr).
:::

:::diagram diagramKey=java_arrays title="Arrays — 1D and 2D"
:::

:::code language=java filename=Arrays.java runnable=true
import java.util.Arrays;

public class ArraysDemo {
    public static void main(String[] args) {

        // -- 1D array --
        int[] scores = {85, 42, 91, 67, 55, 78, 99};
        System.out.println("Length  : " + scores.length);
        System.out.println("First   : " + scores[0]);
        System.out.println("Last    : " + scores[scores.length - 1]);

        // -- average with loop --
        int sum = 0;
        for (int s : scores) sum += s;
        System.out.println("Average : " + sum / scores.length);

        // -- sort & search --
        Arrays.sort(scores);
        System.out.println("Sorted  : " + Arrays.toString(scores));
        int idx = Arrays.binarySearch(scores, 91);
        System.out.println("91 at index: " + idx);

        // -- copyOfRange --
        int[] slice = Arrays.copyOfRange(scores, 0, 4);
        System.out.println("Copy[0..3]: " + Arrays.toString(slice));

        // -- 2D array --
        int[][] grid = {
            {1, 2, 3},
            {4, 5, 6},
            {7, 8, 9}
        };
        System.out.println("grid[1][2]  : " + grid[1][2]);  // 6
        System.out.println("grid.length : " + grid.length); // 3 rows

        // -- fill --
        int[] zeros = new int[4];
        Arrays.fill(zeros, 7);
        System.out.println("filled  : " + Arrays.toString(zeros));
    }
}
---output
Length  : 7
First   : 85
Last    : 99
Average : 73
Sorted  : [42, 55, 67, 78, 85, 91, 99]
91 at index: 5
Copy[0..3]: [42, 55, 67, 78]
grid[1][2]  : 6
grid.length : 3
filled  : [7, 7, 7, 7]
:::

:::quiz questionId=q_java_arr_001
question: What exception is thrown when you access arr[arr.length] in Java?
options:
* NullPointerException
* IndexOutOfBoundsException
* ArrayIndexOutOfBoundsException
* IllegalArgumentException
answer: 3
explanation: Arrays use ArrayIndexOutOfBoundsException for out-of-bounds access. Valid indices are 0 to arr.length-1. Accessing arr[arr.length] is one past the end.
:::

:::quiz questionId=q_java_arr_002
question: After int[] arr = new int[5]; what are the default values?
options:
* null
* undefined
* 0
* Random garbage values
answer: 3
explanation: Java initialises numeric arrays to 0, boolean arrays to false, and object arrays to null. There are no "garbage values" like in C — Java always zeroes out new arrays.
:::

:::quiz questionId=q_java_arr_003
question: Can you change an array's size after it is created?
options:
* Yes, using arr.resize()
* Yes, using Arrays.grow()
* No, arrays are fixed size — use ArrayList for dynamic sizing
* Yes, but only by one element at a time
answer: 3
explanation: Java arrays are fixed-size. Once created with new int[5], the size is permanent. For dynamic sizing, use ArrayList<Integer> which grows automatically.
:::
