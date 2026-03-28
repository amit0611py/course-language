---
path: java.exceptions
title: Exceptions & Error Handling
section: core-language
difficulty: intermediate
estimatedMins: 13
sortOrder: 9
tags: [java, exceptions, try-catch, throws, custom-exceptions]
isDeepDive: false
---

:::text
Exceptions are events that disrupt normal program flow. Java has a robust exception-handling mechanism: try-catch-finally lets you intercept errors gracefully, throws declares what a method may propagate, and custom exceptions give your domain-specific errors meaningful names.
:::

:::concept icon=🌳 title="Throwable Hierarchy"
Everything extends Throwable → Error (JVM-level, don't catch) | Exception. Checked exceptions must be handled. Unchecked (RuntimeException) are optional to catch.
:::

:::concept icon=🛡️ title="try-catch-finally"
try wraps risky code. catch handles specific exception types. finally always runs — even if no exception occurred — perfect for cleanup like closing streams or DB connections.
:::

:::concept icon=✅ title="Checked Exceptions"
Must be declared with throws or handled with try-catch. The compiler enforces this. Examples: IOException, SQLException, ClassNotFoundException. Force callers to acknowledge errors.
:::

:::concept icon=⚡ title="Unchecked Exceptions"
Subclasses of RuntimeException. No compiler enforcement. Examples: NullPointerException, ArrayIndexOutOfBoundsException, IllegalArgumentException. Usually signal programming bugs.
:::

:::concept icon=🔥 title="throw vs throws"
throw is a statement that fires an exception: `throw new IllegalArgumentException("bad")`. throws in a method signature declares that the method may propagate a checked exception.
:::

:::concept icon=🎨 title="Custom Exceptions"
Extend Exception (checked) or RuntimeException (unchecked) to create meaningful domain errors like InsufficientFundsException. Add a message and optionally a cause.
:::

:::diagram diagramKey=java_exceptions title="Exception Hierarchy"
:::

:::code language=java filename=Exceptions.java runnable=true
class InsufficientFundsException extends Exception {
    double shortfall;
    InsufficientFundsException(double shortfall) {
        super("Insufficient funds -- short by " + shortfall);
        this.shortfall = shortfall;
    }
}

class BankAccount {
    private double balance;
    BankAccount(double initial) { this.balance = initial; }

    void withdraw(double amount) throws InsufficientFundsException {
        if (amount > balance) {
            throw new InsufficientFundsException(amount - balance);
        }
        balance -= amount;
        System.out.printf("Withdrew %.1f | Remaining: %.1f%n", amount, balance);
    }

    double getBalance() { return balance; }
}

public class Exceptions {
    public static void main(String[] args) {
        BankAccount acc = new BankAccount(1000.0);

        double[] withdrawals = {400.0, 800.0, 600.0};

        for (double amount : withdrawals) {
            try {
                acc.withdraw(amount);
            } catch (InsufficientFundsException e) {
                System.out.println("ERROR: " + e.getMessage());
                System.out.printf("  Top up at least %.1f%n", e.shortfall);
            } finally {
                System.out.printf("  Balance now: %.1f%n", acc.getBalance());
            }
        }

        // try-with-resources (auto-close)
        try {
            int[] arr = {1, 2, 3};
            System.out.println(arr[10]); // throws ArrayIndexOutOfBoundsException
        } catch (ArrayIndexOutOfBoundsException e) {
            System.out.println("Caught: " + e.getClass().getSimpleName());
        }
    }
}
---output
Withdrew 400.0 | Remaining: 600.0
  Balance now: 600.0
ERROR: Insufficient funds -- short by 200.0
  Top up at least 200.0
  Balance now: 600.0
Withdrew 600.0 | Remaining: 0.0
  Balance now: 0.0
Caught: ArrayIndexOutOfBoundsException
:::

:::quiz questionId=q_java_exc_001
question: Which block always executes, whether or not an exception was thrown?
options:
* try
* catch
* finally
* throws
answer: 3
explanation: finally always executes — success, exception, or even a return statement inside try/catch. It's the right place to close resources. The only exception (pun intended): System.exit() or a JVM crash.
:::

:::quiz questionId=q_java_exc_002
question: What is the difference between checked and unchecked exceptions?
options:
* Checked exceptions are faster at runtime
* Checked exceptions must be declared or handled; unchecked ones don't require it
* Unchecked exceptions are more severe than checked ones
* There is no functional difference
answer: 2
explanation: Checked exceptions (IOException, SQLException) must either be caught with try-catch or declared with throws — the compiler enforces this. Unchecked exceptions (RuntimeException and subclasses) are optional to handle. They usually indicate programmer errors.
:::

:::quiz questionId=q_java_exc_003
question: You want to create a domain-specific exception for payment failures. Which is the best base class?
options:
* Throwable
* Error
* Exception or RuntimeException depending on whether callers must handle it
* Object
answer: 3
explanation: Extend Exception if callers should be forced to handle it (checked). Extend RuntimeException if it's a programming error or the call stack is deep and checked propagation would be noisy (unchecked). Never extend Throwable or Error directly.
:::
