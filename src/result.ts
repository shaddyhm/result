export type PotentialPromise<T> = Promise<T> | T;

export class Result<T> {
  private error: Error;
  private isSuccess: boolean;
  private queue: Array<() => Promise<void>>;
  private value: T;

  public ensure(
    fn: (v: T) => PotentialPromise<boolean>,
    msg: string
  ): Result<T> {
    const local = async () => {
      if (!this.isSuccess) return;
      this.isSuccess = await fn(this.value);
      if (this.isSuccess) {
        return;
      }
      this.error = new Error(msg);
    };
    this.queue.push(local);
    return this;
  }

  public static from<T>(v: T): Result<T> {
    return new Result(v);
  }

  public async getOrDefault<U>(v: U): Promise<T | U> {
    await this.queue.reduce((p, fn) => p.then(fn), Promise.resolve());
    if (!this.isSuccess) {
      return v;
    }
    return this.value;
  }

  public async getOrThrow(): Promise<T> {
    await this.queue.reduce((p, fn) => p.then(fn), Promise.resolve());
    if (!this.isSuccess) {
      throw this.error;
    }
    return this.value;
  }

  public map<U>(fn: (v: T) => PotentialPromise<U>): Result<U> {
    const local = async () => {
      if (!this.isSuccess) return;
      const transform = await fn(this.value);
      this.value = transform as T;
    };
    this.queue.push(local);
    return this as unknown as Result<U>;
  }

  public onFailure(fn: (e: Error) => PotentialPromise<void>): Result<T> {
    const local = async () => !this.isSuccess && (await fn(this.error));
    this.queue.push(local);
    return this;
  }

  public onSuccess(fn: (v: T) => PotentialPromise<void>): Result<T> {
    const local = async () => this.isSuccess && (await fn(this.value));
    this.queue.push(local);
    return this;
  }

  private constructor(v: T) {
    this.value = v;
    this.isSuccess = true;
    this.queue = [];
  }
}
