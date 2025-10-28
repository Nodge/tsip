/* eslint-disable @typescript-eslint/no-unnecessary-type-arguments */
import { describe, it, expectTypeOf } from "vitest";
import type { BaseError, BaseErrorConstructor } from "./error";

declare const Error: BaseErrorConstructor;

// @ts-expect-error mock for type tests
Error.extend = () => Error;

describe("BaseError", () => {
    it("should not accept untyped additional field", () => {
        const err1 = new Error();
        expectTypeOf(err1).toEqualTypeOf<BaseError<never>>();
        expectTypeOf(err1.additional).toEqualTypeOf<undefined>();

        const err2 = new Error("message");
        expectTypeOf(err2).toEqualTypeOf<BaseError<never>>();
        expectTypeOf(err2.additional).toEqualTypeOf<undefined>();

        const err3 = new Error("message", {
            // @ts-expect-error should not accept additional field
            additional: "foo",
        });
        expectTypeOf(err3).toEqualTypeOf<BaseError<never>>();
        expectTypeOf(err3.additional).toEqualTypeOf<undefined>();
    });

    it("should accept cause option", () => {
        const err1 = new Error("message");
        expectTypeOf(err1.cause).toEqualTypeOf<unknown>();

        const err2 = new Error("message", { cause: "non-error" });
        expectTypeOf(err2.cause).toEqualTypeOf<unknown>();

        const err3 = new Error("message", { cause: new TypeError() });
        expectTypeOf(err3.cause).toEqualTypeOf<unknown>();
    });

    it("should accept fingerprint option", () => {
        const err1 = new Error("message");
        expectTypeOf(err1.fingerprint).toEqualTypeOf<string | undefined>();

        const err2 = new Error("message", { fingerprint: "foo" });
        expectTypeOf(err2.fingerprint).toEqualTypeOf<string | undefined>();
    });

    describe("extend()", () => {
        it("should create constructor without additional field", () => {
            const MyError = Error.extend("MyError");
            expectTypeOf(MyError).toEqualTypeOf<BaseErrorConstructor<never>>();

            const err = new MyError();
            expectTypeOf(err).toEqualTypeOf<BaseError<never>>();
            expectTypeOf(err.additional).toEqualTypeOf<undefined>();
        });

        it("should create constructor with required additional field", () => {
            const MyError = Error.extend<{ foo: "bar" }>("MyError");
            expectTypeOf(MyError).toEqualTypeOf<BaseErrorConstructor<{ foo: "bar" }>>();

            // @ts-expect-error options are required
            new MyError();

            // @ts-expect-error options are required
            new MyError("test");

            // @ts-expect-error options.additional is required
            new MyError("test", {});

            // @ts-expect-error options.additional type mismatch
            new MyError("test", { additional: "foo" });

            const err = new MyError(undefined, {
                additional: { foo: "bar" },
            });
            expectTypeOf(err).toEqualTypeOf<BaseError<{ foo: "bar" }>>();
            expectTypeOf(err.additional).toEqualTypeOf<{ foo: "bar" }>();
        });

        it("should create constructor with optional additional field", () => {
            const MyError = Error.extend<string | undefined>("MyError");
            expectTypeOf(MyError).toEqualTypeOf<BaseErrorConstructor<string | undefined>>();

            const err1 = new MyError();
            expectTypeOf(err1).toEqualTypeOf<BaseError<string | undefined>>();
            expectTypeOf(err1.additional).toEqualTypeOf<string | undefined>();

            const err2 = new MyError(undefined, {});
            expectTypeOf(err2).toEqualTypeOf<BaseError<string | undefined>>();
            expectTypeOf(err2.additional).toEqualTypeOf<string | undefined>();

            const err3 = new MyError(undefined, { additional: "foo" });
            expectTypeOf(err3).toEqualTypeOf<BaseError<string | undefined>>();
            expectTypeOf(err3.additional).toEqualTypeOf<string | undefined>();
        });
    });

    describe("nested extend()", () => {
        it("should preserve additional type", () => {
            const MyError = Error.extend<string>("MyError");
            expectTypeOf(MyError).toEqualTypeOf<BaseErrorConstructor<string>>();

            const NestedError = MyError.extend("NestedError");
            expectTypeOf(NestedError).toEqualTypeOf<BaseErrorConstructor<string>>();

            const err = new NestedError("test", { additional: "foo" });
            expectTypeOf(err).toEqualTypeOf<BaseError<string>>();
            expectTypeOf(err.additional).toEqualTypeOf<string>();
        });

        it("should allow to override additional type", () => {
            const MyError = Error.extend<string>("MyError");
            expectTypeOf(MyError).toEqualTypeOf<BaseErrorConstructor<string>>();

            const NestedError = MyError.extend<number>("NestedError");
            expectTypeOf(NestedError).toEqualTypeOf<BaseErrorConstructor<number>>();

            const err = new NestedError("test", { additional: 42 });
            expectTypeOf(err).toEqualTypeOf<BaseError<number>>();
            expectTypeOf(err.additional).toEqualTypeOf<number>();
        });
    });
});
