---
path: java.classes
title: Classes & Objects
section: oop
difficulty: intermediate
estimatedMins: 15
sortOrder: 1
tags: [java, oop, classes, objects, constructors, this]
isDeepDive: false
---

:::text
A class is a blueprint that defines the state (fields) and behaviour (methods) of objects. An object is a concrete instance of a class created with the new keyword. Java programs are built from objects collaborating together — this is the core idea of Object-Oriented Programming.
:::

:::concept icon=📐 title="Class & Fields"
A class declares fields (variables) that each object will own. Fields hold the object's state — e.g., a Dog has name, breed, age. Declared outside any method at the class level.
:::

:::concept icon=🏗️ title="Constructors"
Special methods with the same name as the class, no return type. Called automatically by new Dog(). Used to initialise fields. If you define none, Java provides a default no-arg constructor.
:::

:::concept icon=👆 title="this Keyword"
Refers to the current object instance. Used to distinguish between fields and parameters with the same name: `this.name = name`. Also used to call another constructor: `this(...)`.
:::

:::concept icon=⚡ title="static vs instance"
static members belong to the class itself — shared across all instances. Instance members belong to each object separately. static methods can't access instance fields or use this.
:::

:::concept icon=🔑 title="Access Modifiers"
private: only within the class. public: accessible everywhere. protected: same package + subclasses. Default (no keyword): same package only. Encapsulation relies on private.
:::

:::concept icon=♻️ title="Object Lifecycle"
Created with new → used → dereferenced → Garbage Collector reclaims memory. The GC runs in the background. You can hint with System.gc() but cannot force it.
:::

:::diagram diagramKey=java_classobject title="Class Blueprint → Objects"
:::

:::code language=java filename=Dog.java runnable=true
// -- Class definition --
class Dog {
    // Fields (state of each object)
    private String name;
    private String breed;
    private int    age;

    // Static field — shared by all Dog instances
    static int dogCount = 0;

    // -- Constructor --
    Dog(String name, String breed, int age) {
        this.name  = name;   // this.name = field, name = parameter
        this.breed = breed;
        this.age   = age;
        dogCount++;
    }

    // -- Instance methods --
    void bark() {
        System.out.println(name + " says: Woof!");
    }

    String describe() {
        return name + " (" + age + "y) | breed: " + breed;
    }

    // -- Getter (access private field) --
    String getName() { return name; }

    // -- Static method --
    static int getCount() { return dogCount; }
}

public class DogDemo {
    public static void main(String[] args) {
        Dog d1 = new Dog("Buddy", "Husky", 3);
        Dog d2 = new Dog("Rex",   "Lab",   5);
        Dog d3 = new Dog("Luna",  "Poodle", 2);

        d1.bark();
        d2.bark();

        System.out.println(d1.describe());
        System.out.println(d3.describe());

        // static — call via class name
        System.out.println("Total dogs: " + Dog.getCount());
    }
}
---output
Buddy says: Woof!
Rex says: Woof!
Buddy (3y) | breed: Husky
Luna (2y) | breed: Poodle
Total dogs: 3
:::

:::quiz questionId=q_java_cls_001
question: What is the purpose of the this keyword in a constructor?
options:
* It refers to the parent class
* It distinguishes instance fields from constructor parameters with the same name
* It calls the superclass constructor
* It creates a new object
answer: 2
explanation: When a constructor parameter has the same name as a field, this.name refers to the field and name refers to the parameter. Without this, the assignment name = name would just assign the parameter to itself.
:::

:::quiz questionId=q_java_cls_002
question: Which statement about static fields is correct?
options:
* Each object gets its own copy of a static field
* Static fields are private by default
* Static fields are shared across all instances of the class
* Static fields cannot be accessed from static methods
answer: 3
explanation: A static field belongs to the class, not to any instance. All objects share the same static field. Changing it from one object changes it for all objects.
:::

:::quiz questionId=q_java_cls_003
question: What happens if you declare no constructor in a Java class?
options:
* The class won't compile
* Java provides a default no-arg constructor automatically
* All fields are initialised to their declared values only
* Objects cannot be created
answer: 2
explanation: Java automatically provides a no-arg constructor if you declare none. Once you declare any constructor, the automatic default is removed — you must provide a no-arg version manually if you still need it.
:::
