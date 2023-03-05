export class Result<T> {
  public error: Error;
  public value: T;

  private isSuccess: boolean;

  public ensure(fn: (v: T) => boolean, msg: string): Result<T> {
    if (!this.isSuccess) {
      return this;
    }
    try {
      const pred = fn(this.value);
      if (pred) {
        return this;
      }
      return this.exception(new Error(msg));
    } catch (e) {
      return this.exception(e);
    }
  }

  public static from<T>(v: T): Result<T> {
    return Result.ok(v);
  }

  public getOrThrow(): T {
    if (!this.isSuccess) {
      throw this.error;
    }
    return this.value;
  }

  public map<U>(fn: (v: T) => U): Result<U> {
    if (!this.isSuccess) {
      return this.exception(this.error);
    }
    try {
      const transform = fn(this.value);
      return Result.from(transform);
    } catch (e) {
      return this.exception(e);
    }
  }

  public onFailure(fn: (e: Error) => void): Result<T> {
    if (this.isSuccess) {
      return this;
    }
    try {
      fn(this.error);
      return this;
    } catch (e) {
      return this.exception(e);
    }
  }

  public onSuccess(fn: (v: T) => void): Result<T> {
    if (!this.isSuccess) {
      return this;
    }
    try {
      fn(this.value);
      return this;
    } catch (e) {
      return this.exception(e);
    }
  }

  private static ok<T>(v: T): Result<T> {
    return new Result(v);
  }

  private exception<U>(e: Error): Result<U> {
    const result = Result.from<U>(this.value as unknown as U);
    result.error = e;
    result.isSuccess = false;
    return result;
  }

  private constructor(v: T) {
    this.value = v;
    this.isSuccess = true;
  }
}
