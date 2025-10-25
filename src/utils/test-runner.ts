import { strict as assert } from "node:assert";
import { fn } from "@vitest/spy";

/**
 * Test runner interface that provides the core testing functions.
 * Compatible with test frameworks like Mocha, Jest, Vitest, etc.
 */
export interface TestRunner {
    /** Defines a test suite with the given name and function containing tests. */
    describe: (name: string, fn: () => void) => void;
    /** Defines an individual test case with the given name and test function. */
    it: (name: string, fn: () => void | Promise<void>) => void;
}

/**
 * Assertion interface that provides common assertion methods for testing.
 */
export interface Assert {
    /** Asserts that the condition is truthy, throws with message if not. */
    ok(condition: boolean, message: string): void;
    /** Asserts deep equality between actual and expected values. */
    equal(actual: unknown, expected: unknown, message: string): void;
    /** Asserts that an object contains all expected properties with matching values using deep equality. */
    matchObject(actual: unknown, expected: Record<PropertyKey, unknown>, message: string): void;
    /** Asserts that the function throws an error when called. */
    throws(fn: () => void, message: string): void;
    /** Asserts that the function does not throw an error when called. */
    doesNotThrow(fn: () => void, message: string): void;
    /** Asserts that a mock function has been called exactly the specified number of times. */
    calledTimes(mockFn: ReturnType<typeof fn>, times: number, message: string): void;
}

/**
 * Complete test utilities bundle including runner methods, assertions, and mocking.
 * Provides a unified testing interface across different test frameworks.
 */
export interface TestUtils {
    /** Test suite definition function from the configured test runner. */
    describe: TestRunner["describe"];
    /** Individual test case definition function from the configured test runner. */
    it: TestRunner["it"];
    /** Mock function factory from Vitest for creating spies and mocks. */
    fn: typeof fn;
    /** Collection of assertion methods for verifying test expectations. */
    assert: Assert;
}

declare const globalThis: {
    describe?: TestRunner["describe"];
    it?: TestRunner["it"];
};

/**
 * Initializes the test runner with the provided configuration or detects from global context.
 * @param config - Optional test runner configuration. Falls back to global describe/it if not provided.
 * @returns Test utilities object with describe, it, fn, and assert methods.
 * @throws {Error} If test runner functions are not available.
 */
export function initTestRunner(config: Partial<TestRunner> = {}): TestUtils {
    const { describe = globalThis.describe, it = globalThis.it } = config;

    if (!describe) {
        throw new Error(
            "Test runner 'describe' function is not available. Please provide it in config or ensure your test framework is properly initialized.",
        );
    }

    if (!it) {
        throw new Error(
            "Test runner 'it' function is not available. Please provide it in config or ensure your test framework is properly initialized.",
        );
    }

    return {
        describe,
        it,
        fn,
        assert: {
            ok: assert.ok,
            equal: assert.deepStrictEqual,
            matchObject(actual, expected, message) {
                assert.ok(typeof actual === "object", message);
                assert.ok(actual !== null, message);

                for (const [key, value] of Object.entries(expected)) {
                    assert.deepStrictEqual((actual as Record<PropertyKey, unknown>)[key], value, message);
                }
            },
            throws: assert.throws,
            doesNotThrow: assert.doesNotThrow,
            calledTimes(mockFn, times, message) {
                assert.strictEqual(mockFn.mock.calls.length, times, message);
            },
        },
    };
}
