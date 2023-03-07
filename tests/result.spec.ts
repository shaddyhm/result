import * as assert from "assert";

import { Result, PotentialPromise } from "../src/result";

class Person {
  public firstName: string;
  public lastName: string;
  public age: number;
}

class AnotherPerson {
  public anotherFirstName: string;
  public anotherLastName: string;
  public anotherAge: number;
}

describe("Test Result", () => {
  const firstName = "Shaddy";
  const lastName = "Mansour";
  const age = 34;

  it("ensure: should fail skipping subsequent onsuccess calls", () => {
    const result = (fn: (v: Person) => PotentialPromise<boolean>) =>
      Result.from(new Person())
        .onSuccess((x) => {
          x.firstName = firstName;
        })
        .onSuccess((x) => {
          x.lastName = "Man Sour";
        })
        .ensure(fn, "not a good look ma!")
        .onSuccess((x) => {
          x.age = age;
        })
        .getOrThrow();
    assert.rejects(async () => await result((v) => v.lastName == lastName));
    assert.rejects(
      async () => await result(async (v) => v.lastName == lastName)
    );
  });

  describe("getordefault tests", () => {
    it("getordefault: should get the value", async () => {
      const person: Person | null = (await Result.from(new Person())
        .onSuccess((x) => {
          x.firstName = firstName;
          x.lastName = lastName;
          x.age = age;
        })
        .getOrDefault(null)) as Person;
      assert.equal(person.firstName, firstName);
      assert.equal(person.lastName, lastName);
      assert.equal(person.age, age);
    });

    it("getordefault: should get default value", async () => {
      const person: Person | number = await Result.from(new Person())
        .onSuccess((x) => {
          x.firstName = firstName;
          x.lastName = lastName;
          x.age = age;
        })
        .ensure((x) => x.firstName === "Chad", "not the name I had hoped for!")
        .getOrDefault(420);
      assert.equal(person, 420);
    });
  });

  describe("getorthrow tests", () => {
    it("getorthrow: should get the value", async () => {
      const person: Person = await Result.from(new Person())
        .onSuccess((x) => {
          x.firstName = firstName;
        })
        .onSuccess((x) => {
          x.lastName = lastName;
        })
        .onSuccess((x) => {
          x.age = age;
        })
        .getOrThrow();
      assert.equal(person.firstName, firstName);
      assert.equal(person.lastName, lastName);
      assert.equal(person.age, age);
    });

    it("getorthrow: should throw the error", () => {
      assert.rejects(
        async () =>
          await Result.from(new Person())
            .onSuccess((x) => {
              x.firstName = firstName;
            })
            .onSuccess((x) => {
              x.lastName = lastName;
            })
            .onSuccess((x) => {
              x.age = age;
            })
            .ensure((x) => x.age <= 21, "too old!")
            .getOrThrow()
      );
    });
  });

  it("map: should map from an object to another", async () => {
    const transform = (person: Person): AnotherPerson => {
      const anotherPerson = new AnotherPerson();
      anotherPerson.anotherFirstName = person.firstName;
      anotherPerson.anotherLastName = person.lastName;
      anotherPerson.anotherAge = person.age;
      return anotherPerson;
    };
    const result = (fn: (v: Person) => PotentialPromise<AnotherPerson>) =>
      Result.from(new Person())
        .onSuccess((x) => {
          x.firstName = firstName;
          x.lastName = lastName;
          x.age = age;
        })
        .map(fn)
        .getOrThrow();
    const anotherPerson = await result((x) => transform(x));
    const anotherPersonAsync = await result(async (x) => transform(x));
    assert.equal(firstName, anotherPerson.anotherFirstName);
    assert.equal(lastName, anotherPerson.anotherLastName);
    assert.equal(age, anotherPerson.anotherAge);
    assert.equal(firstName, anotherPersonAsync.anotherFirstName);
    assert.equal(lastName, anotherPersonAsync.anotherLastName);
    assert.equal(age, anotherPersonAsync.anotherAge);
  });

  it("onfailure: should call onfailure when ensure pred return false", async () => {
    const newLastName = "Man Sour";
    const newAge = 21;
    let person = new Person();
    const result = (fn: (e: Error) => PotentialPromise<void>) =>
      Result.from(person)
        .onSuccess((x) => {
          x.firstName = firstName;
        })
        .onSuccess((x) => {
          x.lastName = newLastName;
        })
        .ensure((x) => x.lastName == lastName, "not a good look ma!")
        .onFailure(fn)
        .onSuccess((x) => {
          x.age = age;
        })
        .getOrDefault(person);
    person = await result(() => {
      person.age = newAge;
    });
    const personAsync = await result(async () => {
      person.age = newAge;
    });
    assert.equal(person.firstName, firstName);
    assert.equal(person.lastName, newLastName);
    assert.equal(person.age, newAge);
    assert.notEqual(person.lastName, lastName);
    assert.notEqual(person.age, age);
    assert.equal(personAsync.firstName, firstName);
    assert.equal(personAsync.lastName, newLastName);
    assert.equal(personAsync.age, newAge);
    assert.notEqual(personAsync.lastName, lastName);
    assert.notEqual(personAsync.age, age);
  });

  it("onsuccess: should call onsuccess all the way down", async () => {
    const person: Person = await Result.from(new Person())
      .onSuccess((x) => {
        x.firstName = firstName;
      })
      .onSuccess(async (x) => {
        x.lastName = lastName;
      })
      .onSuccess((x) => {
        x.age = age;
      })
      .getOrThrow();
    assert.equal(person.firstName, firstName);
    assert.equal(person.lastName, lastName);
    assert.equal(person.age, age);
  });
});
