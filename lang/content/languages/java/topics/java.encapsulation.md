---
path: java.encapsulation
title: Encapsulation
section: oop
difficulty: intermediate
estimatedMins: 11
sortOrder: 4
tags: [java, oop, encapsulation, private, getters, setters]
isDeepDive: false
---

:::text
Encapsulation bundles data (fields) and the methods that operate on it inside one class, while hiding internal implementation details from outside code. The outside world interacts only through a controlled public interface — getters, setters, and validated methods.
:::

:::concept icon=🔒 title="Private Fields"
Declare fields private — they can only be read or modified through the class's own methods. No outside code can directly access or corrupt them.
:::

:::concept icon=🚪 title="Getters & Setters"
Public accessor methods let outsiders read (get) or write (set) a field with optional validation. By convention: getName() and setName(value).
:::

:::concept icon=🫙 title="Data Hiding"
Internal representation is completely hidden. Callers depend only on the public API. You can change how data is stored internally without breaking any callers.
:::

:::concept icon=✅ title="Validation Logic"
Setters can validate new values before accepting them — preventing the object from entering an invalid state. e.g., reject negative balance before setting it.
:::

:::concept icon=🧊 title="Immutable Objects"
When there are only getters (no setters) and fields are final, the object's state cannot change after construction. Immutable objects are inherently thread-safe.
:::

:::concept icon=🫘 title="JavaBeans Standard"
Java convention: private fields + public getters/setters. The canonical pattern used by Spring, Hibernate, Jackson, and virtually all Java frameworks.
:::

:::diagram diagramKey=java_encapsulation title="Encapsulation"
:::

:::code language=java filename=BankAccount.java runnable=true
class BankAccount {
    // Private — hidden from outside
    private String owner;
    private double balance;
    private String pin;

    BankAccount(String owner, String pin, double initialBalance) {
        this.owner   = owner;
        this.pin     = pin;
        this.balance = initialBalance >= 0 ? initialBalance : 0; // validate
    }

    // Getter — read-only access
    String getOwner()   { return owner; }
    double getBalance() { return balance; }

    // No setter for pin — it's write-once at construction

    // Validated deposit
    boolean deposit(double amount) {
        if (amount <= 0) return false;
        balance += amount;
        System.out.printf("Deposited %.1f | Balance: %.1f%n", amount, balance);
        return true;
    }

    // Authenticated withdrawal
    boolean withdraw(double amount, String providedPin) {
        if (!this.pin.equals(providedPin)) {
            System.out.println("Wrong PIN. Withdrawal denied.");
            return false;
        }
        if (amount > balance) {
            System.out.println("Insufficient funds.");
            return false;
        }
        balance -= amount;
        System.out.printf("Withdrew %.1f | Balance: %.1f%n", amount, balance);
        return true;
    }
}

public class BankDemo {
    public static void main(String[] args) {
        BankAccount acc = new BankAccount("Alice", "1234", 5000);
        System.out.println("Owner: " + acc.getOwner());
        System.out.println("Balance: " + acc.getBalance());

        acc.deposit(2000);
        acc.withdraw(1000, "9999"); // wrong PIN
        acc.withdraw(1000, "1234"); // correct PIN
    }
}
---output
Owner: Alice
Balance: 5000.0
Deposited 2000.0 | Balance: 7000.0
Wrong PIN. Withdrawal denied.
Withdrew 1000.0 | Balance: 6000.0
:::

:::quiz questionId=q_java_enc_001
question: Why should class fields be declared private?
options:
* To make the code run faster
* To prevent any access to the field
* To control and validate access through methods, hiding internal details
* To make fields available to subclasses only
answer: 3
explanation: Private fields enforce encapsulation — outside code must go through your methods (getters/setters). This lets you add validation, change internal representation, and protect the object from invalid states without breaking callers.
:::

:::quiz questionId=q_java_enc_002
question: What makes an object immutable in Java?
options:
* Declaring the class as abstract
* Making all fields private with only getters and marking them final
* Using the synchronized keyword
* Implementing the Serializable interface
answer: 2
explanation: Immutability requires: final fields (cannot be reassigned), no setters (no external modification), only getters. Immutable objects are thread-safe by default since their state can never change after construction.
:::

:::quiz questionId=q_java_enc_003
question: A setter method validates a value before storing it. What OOP benefit does this demonstrate?
options:
* Inheritance — the setter inherits validation logic
* Encapsulation — controlled access with validation prevents invalid state
* Polymorphism — the setter behaves differently each time
* Abstraction — hiding the method's implementation
answer: 2
explanation: This is encapsulation in action: the private field is protected behind a setter that enforces business rules. Callers cannot bypass the validation because they cannot access the field directly.
:::
