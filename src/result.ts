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
            return Result.error(new Error(msg));
        } catch (e) {
            return Result.error(e);
        }
    }

    public static from<T>(v: T): Result<T> {
        return Result.ok(v);
    }

    public map<U>(fn: (v: T) => U): Result<U> {
        if (!this.isSuccess) {
            return Result.error(this.error);
        }
        try {
            const transform = fn(this.value);
            return Result.from(transform);
        } catch (e) {
            return Result.error(e);
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
            return Result.error(e);
        }
    }

    public onSuccess(fn: (v: T) => Promise<void>): Result<T> {
        if (!this.isSuccess) {
            return this;
        }
        try {
            fn(this.value);
            return this;
        } catch (e) {
            return Result.error(e);
        }
    }

    private static ok<T>(v: T): Result<T> {
        return new Result(v);
    }

    private static error<U>(e: Error): Result<U> {
        const result = Result.from<U>(null as U);
        result.error = e;
        return result;
    }

    private constructor(v: T) {
        this.value = v;
    }
}