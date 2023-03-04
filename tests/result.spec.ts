import * as assert from "assert";
import { Result } from "../src/result";

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
    const newLastName = 'Man Sour';
    const msg = "not a good look ma!";
    const result: Result<Person> = Result.from(new Person())
      .onSuccess((x) => (x.firstName = firstName))
      .onSuccess((x) => (x.lastName = newLastName))
      .ensure((x) => x.lastName == lastName, msg)
      .onSuccess((x) => (x.age = age));
    assert.equal(firstName, result.value.firstName);
    assert.equal(newLastName, result.value.lastName);
    assert.notEqual(lastName, result.value.lastName);
    assert.notEqual(age, result.value.age);
    assert.equal(msg, result.error.message);
  });

  it('map: should map from an object to another', () => {
    const result: Result<AnotherPerson> = Result.from(new Person())
      .onSuccess((x) => {
        x.firstName = firstName;
        x.lastName = lastName;
        x.age = age;
      })
      .map(x => {
        const anotherPerson = new AnotherPerson();
        anotherPerson.anotherFirstName = x.firstName;
        anotherPerson.anotherLastName = x.lastName;
        anotherPerson.anotherAge = x.age;
        return anotherPerson;
      });
      assert.equal(firstName, result.value.anotherFirstName);
      assert.equal(lastName, result.value.anotherLastName);
      assert.equal(age, result.value.anotherAge);
  });

  it('onfailure: should call onfailure when ensure pred return false', () => {
    const newLastName = 'Man Sour';
    const msg = "not a good look ma!";
    const newMsg = 'changed error msg!!!';
    const result: Result<Person> = Result.from(new Person())
      .onSuccess((x) => (x.firstName = firstName))
      .onSuccess((x) => (x.lastName = newLastName))
      .ensure((x) => x.lastName == lastName, msg)
      .onSuccess((x) => (x.age = age))
      .onFailure(e => e.message = newMsg);
      assert.equal(firstName, result.value.firstName);
      assert.equal(newLastName, result.value.lastName);
      assert.equal(newMsg, result.error.message);
      assert.notEqual(lastName, result.value.lastName);
      assert.notEqual(age, result.value.age);
      assert.notEqual(msg, result.error.message);
  });

  it("onsuccess: should call onsuccess all the way down", () => {
    const result: Result<Person> = Result.from(new Person())
      .onSuccess((x) => (x.firstName = firstName))
      .onSuccess((x) => (x.lastName = lastName))
      .onSuccess((x) => (x.age = age));
    assert.equal(firstName, result.value.firstName);
    assert.equal(lastName, result.value.lastName);
    assert.equal(age, result.value.age);
  });
});
