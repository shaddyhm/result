export type PotentialPromise<T> = Promise<T> | T;

/**
 * Result railway,
 * it is one way to make code look nice and tidy.
 */
export class Result<T extends object> {
  private error: Error;
  private isSuccess: boolean;
  private queue: Array<() => Promise<void>>;
  private value: T;

  /**
   * Validation step passing the encapsulated value.
   * The function return true if the validation pass and false otherwise.
   * When validation fails, the msg will be wrapped into an error object.
   * @param {(v: T) => PotentialPromise<boolean>} fn 
   * @param {string} msg 
   * @returns {Result<T>}
   */
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

  /**
   * Return a new instance of Result.
   * @param {T extends object} v - an object
   * @returns {Result<T>} 
   */
  public static from<T extends object>(v: T): Result<T> {
    return new Result(v);
  }

  /**
   * Get the encapsulated value or the default parameter value.
   * @param {any} v - any value
   * @returns {Promise<T | U>}
   */
  public async getOrDefault<U>(v: U): Promise<T | U> {
    await this.queue.reduce((p, fn) => p.then(fn), Promise.resolve());
    if (!this.isSuccess) {
      return v;
    }
    return this.value;
  }

  /**
   * Get the encapsulated value when there is no error or throw the existing error.
   * @returns {Promise<T>}
   */
  public async getOrThrow(): Promise<T> {
    await this.queue.reduce((p, fn) => p.then(fn), Promise.resolve());
    if (!this.isSuccess) {
      throw this.error;
    }
    return this.value;
  }

  /**
   * Transform the encapsulated object to another.
   * @param {(v: T) => PotentialPromise<U>} fn 
   * @returns {Result<U>}
   */
  public map<U extends object>(fn: (v: T) => PotentialPromise<U>): Result<U> {
    const local = async () => {
      if (!this.isSuccess) return;
      const transform = await fn(this.value);
      this.value = transform as T;
    };
    this.queue.push(local);
    return this as unknown as Result<U>;
  }

  /**
   * Call the function passing the error when there is an error.
   * @param {(e: Error) => PotentialPromise<void>} fn 
   * @returns {Result<T>}
   */
  public onFailure(fn: (e: Error) => PotentialPromise<void>): Result<T> {
    const local = async () => !this.isSuccess && (await fn(this.error));
    this.queue.push(local);
    return this;
  }

  /**
   * Call the function passing the encapsulated value when there is no error.
   * @param {(v: T) => PotentialPromise<void>} fn 
   * @returns {Result<T>}
   */
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
