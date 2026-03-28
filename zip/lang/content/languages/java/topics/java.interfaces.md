---
path: java.interfaces
title: Interfaces
section: oop
difficulty: intermediate
estimatedMins: 12
sortOrder: 6
tags: [java, oop, interfaces, implements, default, functional]
isDeepDive: false
---

:::text
An interface defines a contract — a set of method signatures that implementing classes must fulfil. Interfaces enable multiple inheritance of type in Java (a class can implement many interfaces) and are the foundation of Java's functional programming model with lambdas.
:::

:::concept icon=📄 title="Interface Declaration"
Declared with interface keyword. All methods are implicitly public abstract unless marked default or static. All fields are implicitly public static final constants.
:::

:::concept icon=🤝 title="implements Keyword"
A class signals it fulfils a contract with `implements InterfaceName`. It must provide bodies for all abstract methods or be declared abstract itself.
:::

:::concept icon=✖️ title="Multiple Implementation"
A single class can implement many interfaces — solving the limitation of single inheritance. `class Duck implements Flyable, Swimmable, Feedable` is valid.
:::

:::concept icon=⚙️ title="Default Methods"
Java 8+ allows interface methods with a body via default keyword. Enables adding new behaviour to interfaces without breaking existing implementations.
:::

:::concept icon=λ title="Functional Interfaces"
An interface with exactly one abstract method. Can be used with lambdas and method references. Examples: Runnable, Comparator, Predicate, Function, Consumer.
:::

:::concept icon=⚖️ title="Interface vs Abstract Class"
Use interfaces for pure contracts and multiple types. Use abstract classes when sharing state or partial implementations between related classes.
:::

:::diagram diagramKey=java_interfaces title="Interfaces"
:::

:::code language=java filename=Interfaces.java runnable=true
// -- Interface definitions --
interface Flyable {
    void fly();
    default String flightMode() { return "wings"; }
}

interface Swimmable {
    void swim();
}

interface Feedable {
    void eat(String food);
}

// -- Class implementing multiple interfaces --
class Duck implements Flyable, Swimmable, Feedable {
    private String name;
    Duck(String name) { this.name = name; }

    @Override public void fly()            { System.out.println(name + " flaps wings and flies!"); }
    @Override public void swim()           { System.out.println(name + " paddles across the pond."); }
    @Override public void eat(String food) { System.out.println(name + " gobbles " + food); }
}

class Eagle implements Flyable {
    @Override public void fly() {
        System.out.println("Eagle soars at 3000 m!");
    }
    @Override public String flightMode() { return "thermals"; }  // override default
}

// -- Functional interface + lambda --
@FunctionalInterface
interface Greeter {
    String greet(String name);
}

public class Interfaces {
    public static void main(String[] args) {
        Duck duck = new Duck("Donald");
        duck.fly();
        duck.swim();
        duck.eat("breadcrumbs");

        System.out.println();

        // Polymorphism through interface references
        Flyable f1 = duck;
        Flyable f2 = new Eagle();
        f1.fly();
        System.out.println("  flight mode: " + f1.flightMode());
        f2.fly();

        System.out.println();

        // Lambda implements Greeter (functional interface)
        Greeter g = name -> "Hello, " + name + "!";
        System.out.println(g.greet("Java"));
    }
}
---output
Donald flaps wings and flies!
Donald paddles across the pond.
Donald gobbles breadcrumbs

Donald flaps wings and flies!
  flight mode: wings
Eagle soars at 3000 m!

Hello, Java!
:::

:::quiz questionId=q_java_intf_001
question: How many interfaces can a Java class implement?
options:
* Only one
* Up to two
* Up to five
* As many as needed
answer: 4
explanation: A Java class can implement any number of interfaces — this is how Java achieves multiple inheritance of type. `class A implements B, C, D, E` is perfectly valid. This is in contrast to class inheritance where only one parent class is allowed.
:::

:::quiz questionId=q_java_intf_002
question: What is a functional interface?
options:
* An interface that extends another interface
* An interface with exactly one abstract method
* An interface with only default methods
* An interface that implements Serializable
answer: 2
explanation: A functional interface has exactly one abstract method. This makes it usable with lambda expressions — Java maps the lambda to the single abstract method. The @FunctionalInterface annotation enforces this at compile time.
:::

:::quiz questionId=q_java_intf_003
question: What did Java 8 add to interfaces?
options:
* The ability to have instance fields
* Constructors
* default methods with implementations
* The ability to extend multiple classes
answer: 3
explanation: Java 8 introduced default methods — interface methods with a body. This allowed adding new methods to existing interfaces without breaking all implementing classes. It also added static methods in interfaces.
:::
