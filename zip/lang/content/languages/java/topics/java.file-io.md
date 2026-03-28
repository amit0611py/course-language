---
path: java.file-io
title: File I/O
section: advanced
difficulty: intermediate
estimatedMins: 14
sortOrder: 3
tags: [java, file-io, nio2, bufferedreader, files, path]
isDeepDive: false
---

:::text
Java provides two generations of file I/O: the classic java.io package (FileReader, BufferedReader) and the modern java.nio.file package (NIO.2, Java 7+). The NIO.2 Files utility class covers most common operations in a single line. Always use try-with-resources to prevent resource leaks.
:::

:::concept icon=📂 title="File & Path"
java.io.File (older) vs java.nio.file.Path (modern). Use `Path.of("data.txt")` or `Paths.get("data.txt")`. Path is immutable and works with the Files utility class.
:::

:::concept icon=📖 title="Reading Files"
Files.readAllLines(path) → List<String>. Files.readString(path) → one String. BufferedReader.lines() → Stream<String> for large files processed lazily line by line.
:::

:::concept icon=✏️ title="Writing Files"
Files.write(path, lines) overwrites. Files.writeString(path, text). Files.write(path, lines, StandardOpenOption.APPEND) to append. Creates file if it doesn't exist.
:::

:::concept icon=⚡ title="BufferedReader/Writer"
Wraps FileReader/FileWriter with a buffer — far faster for large text files. readLine() returns null at end-of-file. 8 KB buffer reduces OS system calls dramatically.
:::

:::concept icon=🔒 title="try-with-resources"
`try (BufferedReader br = new BufferedReader(new FileReader(file)))` — br.close() is called automatically on exit, even if an exception is thrown. Prevents resource leaks.
:::

:::concept icon=🗂️ title="File Operations"
Files.copy(), Files.move(), Files.delete(), Files.exists(), Files.isDirectory(), Files.createDirectories(), Files.size(), Files.list(dir) for directory contents.
:::

:::diagram diagramKey=java_fileio title="File I/O"
:::

:::code language=java filename=FileIO.java runnable=true
import java.io.*;
import java.nio.file.*;
import java.util.List;

public class FileIO {
    public static void main(String[] args) throws IOException {

        Path file = Path.of("students.txt");

        // -- Write: NIO.2 --
        List<String> lines = List.of(
            "Alice,92,Math",
            "Bob,65,Science",
            "Carol,88,Math",
            "David,45,History"
        );
        Files.write(file, lines);
        System.out.println("Wrote " + lines.size() + " students to students.txt");

        // -- Append --
        Files.writeString(file, "\nEva,95,Science",
            StandardOpenOption.APPEND);
        System.out.println("Appended: Eva,95,Science");

        // -- Read all at once --
        List<String> all = Files.readAllLines(file);
        System.out.println("\n--- Student Report ---");
        all.forEach(line -> {
            String[] parts = line.split(",");
            if (parts.length == 3) {
                System.out.printf("  %-10s %3s  %s%n",
                    parts[0], parts[1], parts[2]);
            }
        });

        // -- BufferedReader with try-with-resources --
        System.out.println("\n--- Scores above 70 ---");
        try (BufferedReader br = Files.newBufferedReader(file)) {
            String line;
            while ((line = br.readLine()) != null) {
                String[] parts = line.split(",");
                if (parts.length == 3 && Integer.parseInt(parts[1]) >= 70) {
                    System.out.println("  " + parts[0] + ": " + parts[1]);
                }
            }
        }

        // -- File operations --
        System.out.println("\nExists: " + Files.exists(file));
        System.out.println("Size  : " + Files.size(file) + " bytes");

        // cleanup
        Files.delete(file);
        System.out.println("Deleted: " + !Files.exists(file));
    }
}
---output
Wrote 4 students to students.txt
Appended: Eva,95,Science

--- Student Report ---
  Alice       92  Math
  Bob         65  Science
  Carol       88  Math
  David       45  History
  Eva         95  Science

--- Scores above 70 ---
  Alice: 92
  Carol: 88
  Eva: 95

Exists: true
Size  : 88 bytes
Deleted: true
:::

:::quiz questionId=q_java_fio_001
question: Why should you use try-with-resources when working with files?
options:
* It makes file reading faster
* It automatically closes the resource even if an exception is thrown, preventing leaks
* It is required by the Java compiler for file operations
* It improves file system compatibility
answer: 2
explanation: File handles are OS resources — if an exception throws before close() is called, the handle leaks. try-with-resources guarantees close() is called on exit from the try block, regardless of whether the block completed normally or threw an exception.
:::

:::quiz questionId=q_java_fio_002
question: What does Files.readAllLines() return?
options:
* A single String with all content
* An InputStream of bytes
* A List<String> where each element is one line
* A Stream<String>
answer: 3
explanation: Files.readAllLines(path) reads the entire file into a List<String> — one String per line, newlines stripped. Best for small-to-medium files where you need random access to lines. For large files, use Files.lines(path) which returns a lazy Stream<String>.
:::

:::quiz questionId=q_java_fio_003
question: How do you append text to an existing file using Files.write()?
options:
* Files.write() always appends by default
* Pass StandardOpenOption.APPEND as an extra argument
* Call Files.append() instead
* Set a property on the Path object
answer: 2
explanation: By default Files.write() overwrites the file. Pass StandardOpenOption.APPEND (and optionally CREATE) to append: `Files.write(path, data, StandardOpenOption.APPEND)`. You can also use Files.writeString() with the same options.
:::
