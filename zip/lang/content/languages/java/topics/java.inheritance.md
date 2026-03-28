---
path: java.inheritance
title: Inheritance
section: oop
difficulty: intermediate
estimatedMins: 14
sortOrder: 2
tags: [java, oop, inheritance, extends, override, super]
isDeepDive: false
---

:::text
Inheritance lets a class acquire fields and methods from another class. The child class (subclass) extends the parent class (superclass) using the extends keyword. This models IS-A relationships: a Dog IS-A Animal. Inheritance promotes code reuse and enables polymorphism.
:::

:::concept icon=🔗 title="extends"
`class Dog extends Animal` — Dog inherits all non-private members of Animal. Dog IS-A Animal. Java supports single inheritance only — a class can extend exactly one class.
:::

:::concept icon=📞 title="super()"
Calls the parent constructor. Must be the FIRST statement in a child constructor. If omitted, Java inserts `super()` implicitly — which fails if the parent has no no-arg constructor.
:::

:::concept icon=✏️ title="@Override"
Redefines a parent method in the child with new behaviour. The @Override annotation tells the compiler to verify you're actually overriding — it catches typos in method names.
:::

:::concept icon=1️⃣ title="Single Inheritance"
A Java class can only extend ONE class. This avoids the diamond problem. Use interfaces to achieve multiple-type inheritance when needed.
:::

:::concept icon=🔒 title="final class / method"
final class cannot be subclassed. final method cannot be overridden. String is final — you cannot extend it. Useful for security and design intent.
:::

:::concept icon=🔍 title="Method Resolution"
JVM walks up the chain: Dog → Animal → Object. First match wins. Always calls the most specific override. This is the foundation of runtime polymorphism.
:::

:::diagram diagramKey=java_inheritance title="Inheritance Hierarchy"
:::

:::code language=java filename=Inheritance.java runnable=true
class Animal {
    String name;

    Animal(String name) {
        this.name = name;
    }

    void eat() {
        System.out.println(name + " is eating");
    }

    void sleep() {
        System.out.println(name + " is sleeping");
    }
}

class Dog extends Animal {
    String breed;

    Dog(String name, String breed) {
        super(name); // MUST be first — calls Animal(name)
        this.breed = breed;
    }

    @Override
    void eat() {
        super.eat();                            // call parent version first
        System.out.println("  (chewing loudly)");
    }

    void bark() {
        System.out.println(name + " says: Woof!");
    }

    @Override
    String toString() {
        return name + " (age 3) | breed: " + breed;
    }
}

class Guidedog extends Dog {
    Guidedog(String name, String breed) {
        super(name, breed);
    }

    void guide() {
        System.out.println(name + " is guiding its owner");
    }
}

public class Inheritance {
    public static void main(String[] args) {
        Dog dog = new Dog("Buddy", "Husky");
        dog.eat();       // overridden — calls Dog.eat() which calls super.eat()
        dog.bark();
        System.out.println(dog);

        Guidedog gd = new Guidedog("Rex", "Lab");
        gd.guide();
        gd.eat();        // inherits from Dog → Animal chain
    }
}
---output
Buddy is eating
  (chewing loudly)
Buddy says: Woof!
Buddy (age 3) | breed: Husky
Rex is guiding its owner
Rex is eating
  (chewing loudly)
:::

:::quiz questionId=q_java_inh_001
question: What must super() be in a constructor?
options:
* The last statement
* The first statement
* Anywhere in the constructor body
* It is optional in all cases
answer: 2
explanation: super() must be the very first statement in a child constructor. If omitted, Java automatically inserts super() — which requires the parent to have a no-arg constructor. If the parent only has parameterised constructors, you must call super(args) explicitly as the first line.
:::

:::quiz questionId=q_java_inh_002
question: What does the @Override annotation do?
options:
* It forces the method to run faster
* It prevents the method from being overridden further
* It tells the compiler to verify that the method actually overrides a parent method
* It makes the method available to all subclasses
answer: 3
explanation: @Override is a compile-time check. If you misspell the method name, the compiler will error because no parent method matches. Without @Override, a typo creates a NEW method instead of overriding — a hard-to-find bug.
:::

:::quiz questionId=q_java_inh_003
question: If Dog extends Animal, which statement is true?
options:
* Animal is-a Dog
* Dog is-a Animal
* Dog has-a Animal
* Animal contains-a Dog
answer: 2
explanation: Inheritance models IS-A relationships. Dog extends Animal means Dog IS-A Animal. Every Dog is an Animal, but not every Animal is a Dog. This is why an Animal reference can hold a Dog object.
:::
