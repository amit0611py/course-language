---
path: java.abstraction
title: Abstraction
section: oop
difficulty: intermediate
estimatedMins: 13
sortOrder: 5
tags: [java, oop, abstraction, abstract, interface, template]
isDeepDive: false
---

:::text
Abstraction means exposing what something does while hiding how it does it. You interact with a method without needing to know its implementation. In Java, abstraction is achieved through abstract classes (partial implementation) and interfaces (pure contracts).
:::

:::concept icon=🏛️ title="abstract class"
Declared with abstract keyword. Can have both abstract methods (no body) and concrete methods (with body). Cannot be instantiated with new. Subclasses must implement all abstract methods.
:::

:::concept icon=📋 title="abstract method"
Declared without a body: `abstract void drive();`. Every non-abstract subclass MUST provide an implementation. The compiler enforces this — missing implementations cause errors.
:::

:::concept icon=🔌 title="Interface"
A pure contract — all methods implicitly abstract (Java 7). Java 8+ allows default and static methods. A class can implement many interfaces. Cannot hold state (no instance fields).
:::

:::concept icon=⚖️ title="abstract vs interface"
Abstract class = shared state + partial implementation. Interface = capability contract. Use abstract when subclasses share code; interfaces for cross-hierarchy behaviour.
:::

:::concept icon=🎯 title="Why Abstraction?"
Callers depend on the abstraction, not the detail. Swap implementations freely without breaking callers. Enables testability, maintainability, and flexibility. Mock objects rely on this.
:::

:::concept icon=🧩 title="Template Method"
Abstract class defines the skeleton of an algorithm, deferring some steps to subclasses. The base class calls abstract methods — the order is fixed, the implementations vary.
:::

:::diagram diagramKey=java_abstraction title="Abstraction"
:::

:::code language=java filename=Abstraction.java runnable=true
abstract class Vehicle {
    String brand;

    Vehicle(String brand) { this.brand = brand; }

    // Concrete — shared by all vehicles
    void startEngine() {
        System.out.println(brand + ": Engine started");
    }

    // Abstract — each vehicle implements differently
    abstract void drive();

    // Template method — algorithm skeleton
    final void startJourney() {
        startEngine();
        drive();
        System.out.println("Journey complete");
    }
}

class Tesla extends Vehicle {
    Tesla() { super("Tesla"); }
    @Override void drive() { System.out.println("Tesla gliding silently"); }
}

class BMW extends Vehicle {
    BMW() { super("BMW"); }
    @Override void drive() { System.out.println("BMW roaring down the road"); }
}

// Interface for a separate capability
interface Chargeable {
    int MAX_CHARGE = 100;           // implicitly public static final
    void charge();                  // implicitly public abstract
    default void showBattery() {    // Java 8+ default method
        System.out.println("Charger connected");
    }
}

class ElectricBMW extends BMW implements Chargeable {
    @Override public void charge() { showBattery(); }
}

public class Abstraction {
    public static void main(String[] args) {
        Vehicle t = new Tesla();
        t.startJourney();

        Vehicle b = new BMW();
        b.startJourney();

        ElectricBMW eb = new ElectricBMW();
        eb.charge();
    }
}
---output
Tesla: Engine started
Tesla gliding silently
Journey complete
BMW: Engine started
BMW roaring down the road
Journey complete
Charger connected
:::

:::quiz questionId=q_java_abs_001
question: Can you create an instance of an abstract class?
options:
* Yes, using new AbstractClass()
* No, abstract classes cannot be instantiated
* Yes, but only if it has a public constructor
* Yes, through reflection only
answer: 2
explanation: Abstract classes cannot be instantiated directly. They are blueprints meant to be extended. You create instances of their concrete subclasses, which can then be referenced through the abstract type.
:::

:::quiz questionId=q_java_abs_002
question: What is the key difference between abstract class and interface?
options:
* Abstract classes are faster
* Interfaces can have constructors; abstract classes cannot
* Abstract classes can have instance fields and shared code; interfaces define pure contracts
* There is no practical difference in Java 8+
answer: 3
explanation: Abstract classes can hold instance state (fields), constructors, and concrete methods — good for sharing code between related classes. Interfaces define contracts only — no state. A class can implement multiple interfaces but extend only one abstract class.
:::

:::quiz questionId=q_java_abs_003
question: What must a concrete subclass of an abstract class do?
options:
* Override all methods
* Implement all abstract methods declared in the parent
* Declare itself as final
* Call super() for every method
answer: 2
explanation: A concrete subclass must provide implementations for all inherited abstract methods. If it doesn't, it must also be declared abstract. The compiler enforces this — you'll get a compile error for any unimplemented abstract method.
:::
