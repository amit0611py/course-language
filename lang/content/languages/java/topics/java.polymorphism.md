---
path: java.polymorphism
title: Polymorphism
section: oop
difficulty: intermediate
estimatedMins: 13
sortOrder: 3
tags: [java, oop, polymorphism, overriding, overloading, dispatch]
isDeepDive: false
---

:::text
Polymorphism means "many forms" — the same method call behaves differently depending on the actual object type. A Dog and Cat both have eat(), but each eats differently. Java supports runtime polymorphism via method overriding and compile-time polymorphism via method overloading.
:::

:::concept icon=🎭 title="Runtime Polymorphism"
`Animal a = new Dog()`. Calling `a.eat()` invokes Dog's eat() — the JVM checks the actual object type at runtime. Called dynamic dispatch. This is the most powerful form.
:::

:::concept icon=⬆️ title="Upcasting"
Assigning a subclass object to a superclass reference. Automatic and always safe. `Animal a = new Dog()` — you lose access to Dog-specific methods through that reference.
:::

:::concept icon=⬇️ title="Downcasting"
Casting back to the subclass. Must be explicit: `Dog d = (Dog) a;`. Throws ClassCastException if the object isn't actually a Dog. Always check with instanceof first.
:::

:::concept icon=🔎 title="instanceof"
`if (a instanceof Dog d)` — checks the real type before casting. Java 16+ pattern matching: the variable d is bound automatically, no explicit cast needed.
:::

:::concept icon=📋 title="Compile-time (Overloading)"
Same method name, different parameters — resolved by compiler. `print(int)` vs `print(String)` — Java picks the right one based on argument types at compile time.
:::

:::concept icon=💡 title="Why It Matters"
Write code against Animal — it works for Dog, Cat, Bird without changes. Add new animals without touching existing code. Open/Closed Principle: open for extension, closed for modification.
:::

:::diagram diagramKey=java_polymorphism title="Polymorphism"
:::

:::code language=java filename=Polymorphism.java runnable=true
abstract class Shape {
    String color;
    Shape(String color) { this.color = color; }
    abstract double area();       // must override
    void draw() {
        System.out.printf("%s %s -> area = %.2f%n", color, getClass().getSimpleName(), area());
    }
}

class Circle extends Shape {
    double radius;
    Circle(String color, double radius) { super(color); this.radius = radius; }
    @Override double area() { return Math.PI * radius * radius; }
}

class Rectangle extends Shape {
    double w, h;
    Rectangle(String color, double w, double h) { super(color); this.w = w; this.h = h; }
    @Override double area() { return w * h; }
}

class Triangle extends Shape {
    double base, height;
    Triangle(String color, double b, double h) { super(color); base = b; height = h; }
    @Override double area() { return 0.5 * base * height; }
}

public class Polymorphism {
    public static void main(String[] args) {
        // Upcast — all stored as Shape references
        Shape[] shapes = {
            new Circle("Red", 5),
            new Rectangle("Blue", 4, 6),
            new Triangle("Green", 6, 4)
        };

        // Polymorphic call — JVM dispatches to each object's real area()
        for (Shape s : shapes) {
            s.draw();
        }

        // instanceof + downcast
        Shape s = shapes[0];
        System.out.println("Is Circle? " + (s instanceof Circle));
        if (s instanceof Circle c) {   // Java 16+ pattern matching
            System.out.println("Radius: " + c.radius);
        }
    }
}
---output
Red Circle -> area = 78.54
Blue Rectangle -> area = 24.00
Green Triangle -> area = 12.00
Is Circle? true
Radius: 5.0
:::

:::quiz questionId=q_java_poly_001
question: What is dynamic dispatch in Java?
options:
* Choosing which method to call based on parameter types at compile time
* The JVM selecting the correct method override at runtime based on the actual object type
* Automatically converting between types
* Dispatching tasks to multiple threads
answer: 2
explanation: Dynamic dispatch (runtime polymorphism) means the JVM looks at the actual object type at runtime — not the reference type — to determine which overridden method to call. An Animal reference to a Dog will call Dog.eat(), not Animal.eat().
:::

:::quiz questionId=q_java_poly_002
question: What exception is thrown by an invalid downcast?
options:
* NullPointerException
* InvalidCastException
* ClassCastException
* TypeMismatchException
answer: 3
explanation: If you cast an Animal reference to Dog but the object is actually a Cat, Java throws ClassCastException at runtime. Use instanceof to check before casting: if (a instanceof Dog d) {...}
:::

:::quiz questionId=q_java_poly_003
question: Which type of polymorphism is method overloading?
options:
* Runtime polymorphism
* Compile-time polymorphism
* Dynamic polymorphism
* Interface polymorphism
answer: 2
explanation: Overloading is resolved at compile time — the compiler picks the right version based on argument types. Runtime polymorphism (dynamic dispatch) is about overriding — resolved by the JVM based on the actual object type.
:::
