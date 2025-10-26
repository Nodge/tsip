import { initTestRunner, type TestRunner } from "../../../utils/test-runner";
import type { Flow, MutableFlow } from "../flow";

/**
 * Utility type that extracts the value type from a Flow type.
 *
 * @typeParam T - The Flow type from which to extract the value type
 * @returns The value type contained within the Flow
 */
type InferFlowValue<T extends Flow<unknown>> = T extends Flow<infer V> ? V : never;

/**
 * Configuration options for running Flow specification tests.
 *
 * @typeParam T - The type of object returned from createFlow (TestFlow or TestMutableFlow)
 */
export interface FlowSpecTestRunnerOptions<T> {
    /** Optional custom test runner (defaults to global test runner) */
    testRunner?: TestRunner;
    /** Factory function that creates a new Flow instance for each test */
    createFlow: () => T;
}

/**
 * Configuration interface for testing Flow implementations.
 * Provides a flow instance and a method for emitting new values to the flow.
 *
 * @typeParam T - The Flow type being tested
 */
export interface TestFlow<T extends Flow<unknown>> {
    /** The Flow instance being tested */
    flow: T;
    /** Function that emits the next value to the flow and returns the expected return value from flow.getSnapshot() */
    emitNext(
        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- should not use execution context
        this: void,
    ): InferFlowValue<T> | Promise<InferFlowValue<T>>;
}

/**
 * Verifies flow behavior according to the Flow specification.
 *
 * @typeParam T - The Flow type being tested
 * @param options - Configuration options for tests
 *
 * @example
 * Usage with a custom Flow implementation:
 * ```typescript
 * import { validateFlowImplementation } from 'tsip/tests';
 * import { createFlow } from './my-flow-implementation';
 *
 * describe('Flow Specification Compliance', () => {
 *     validateFlowImplementation({
 *         createFlow: () => {
 *             const flow = createFlow(0);
 *             let counter = 0;
 *             return {
 *                 flow,
 *                 emitNext: () => {
 *                     const value = ++counter;
 *                     try {
 *                         flow.emit(value);
 *                     } catch {}
 *                     return value;
 *                 }
 *             };
 *         }
 *     });
 * });
 * ```
 *
 * @see {@link validateMutableFlowImplementation} for testing MutableFlow implementations
 */
export function validateFlowImplementation<T extends Flow<unknown>>(
    options: FlowSpecTestRunnerOptions<TestFlow<T> | Promise<TestFlow<T>>>,
) {
    const { describe, it, fn, assert } = initTestRunner(options.testRunner);
    const { createFlow } = options;

    describe("flow.getSnapshot()", () => {
        it("should return the updated value after emit", async () => {
            const { flow, emitNext } = await createFlow();
            const v1 = flow.getSnapshot();

            const expectedValue = await emitNext();
            const v2 = flow.getSnapshot();
            assert.ok(v1 !== v2, "Expected flow.getSnapshot() to return a different value after emit");
            assert.equal(v2, expectedValue, "Expected flow.getSnapshot() to return the emitted value");
        });

        it("should always return the most recent value", async () => {
            const { flow, emitNext } = await createFlow();

            const v1 = await emitNext();
            assert.equal(flow.getSnapshot(), v1, "Expected flow.getSnapshot() to return the first emitted value");

            const v2 = await emitNext();
            assert.equal(flow.getSnapshot(), v2, "Expected flow.getSnapshot() to return the second emitted value");

            const v3 = await emitNext();
            assert.equal(flow.getSnapshot(), v3, "Expected flow.getSnapshot() to return the third emitted value");
        });

        it("should return stable reference", async () => {
            const { flow, emitNext } = await createFlow();
            assert.ok(
                flow.getSnapshot() === flow.getSnapshot(),
                "Expected flow.getSnapshot() to return the same reference when called multiple times",
            );

            await emitNext();
            assert.ok(
                flow.getSnapshot() === flow.getSnapshot(),
                "Expected flow.getSnapshot() to return the same reference after emit",
            );
        });
    });

    describe("flow.subscribe()", () => {
        it("should return a FlowSubscription object", async () => {
            const { flow } = await createFlow();

            const listener = fn();
            const subscription = flow.subscribe(listener);

            assert.ok("unsubscribe" in subscription, "Expected subscription to have 'unsubscribe' property");
            assert.ok(
                typeof subscription.unsubscribe === "function",
                "Expected subscription.unsubscribe to be a function",
            );
            assert.ok(
                subscription.unsubscribe.length === 0,
                "Expected subscription.unsubscribe to accept 0 parameters",
            );
        });

        it("should support multiple subscriptions", async () => {
            const { flow, emitNext } = await createFlow();

            const listener1 = fn();
            const listener2 = fn();
            const listener3 = fn();
            flow.subscribe(listener1);
            flow.subscribe(listener2);
            flow.subscribe(listener3);

            await emitNext();

            assert.calledTimes(listener1, 1, "Expected listener1 to be called once");
            assert.calledTimes(listener2, 1, "Expected listener2 to be called once");
            assert.calledTimes(listener3, 1, "Expected listener3 to be called once");
        });

        it("should allow the same listener to be subscribed multiple times", async () => {
            const { flow, emitNext } = await createFlow();

            const listener = fn();
            const sub1 = flow.subscribe(listener);
            const sub2 = flow.subscribe(listener);
            assert.ok(sub1 !== sub2, "Expected different subscription objects for the same listener");
            assert.calledTimes(listener, 0, "Expected listener not to be called yet");

            await emitNext();
            assert.calledTimes(listener, 2, "Expected listener to be called twice (once per subscription)");
        });

        it("should not call listeners added during notification stage", async () => {
            const { flow, emitNext } = await createFlow();

            const listener1 = fn();
            const listener2 = fn();
            flow.subscribe(() => {
                listener1();
                flow.subscribe(listener2);
            });

            await emitNext();
            assert.calledTimes(listener1, 1, "Expected listener1 to be called once");
            assert.calledTimes(listener2, 0, "Expected listener2 not to be called (added during notification)");
        });

        it("should call listeners removed during notification stage", async () => {
            const { flow, emitNext } = await createFlow();

            const listener = fn();
            flow.subscribe(() => {
                sub.unsubscribe();
            });
            const sub = flow.subscribe(listener);

            await emitNext();
            assert.calledTimes(
                listener,
                1,
                "Expected listener to be called even though it was unsubscribed during notification",
            );
        });
    });

    describe("subscription.unsubscribe()", () => {
        it("should stop calling the listener after unsubscribe", async () => {
            const { flow, emitNext } = await createFlow();

            const listener = fn();
            const subscription = flow.subscribe(listener);

            await emitNext();
            assert.calledTimes(listener, 1, "Expected listener to be called once");
            subscription.unsubscribe();

            await emitNext();
            assert.calledTimes(
                listener,
                1,
                "Expected listener to still be called only once (not called again after unsubscribe)",
            );
        });

        it("should handle multiple unsubscribe calls gracefully", async () => {
            const { flow } = await createFlow();

            const listener = fn();
            flow.subscribe(listener);

            const subscription = flow.subscribe(listener);
            subscription.unsubscribe();

            assert.doesNotThrow(() => {
                subscription.unsubscribe();
            }, "Expected first unsubscribe call not to throw");

            assert.doesNotThrow(() => {
                subscription.unsubscribe();
            }, "Expected second unsubscribe call not to throw");
        });

        it("should only remove the specific subscription", async () => {
            const { flow, emitNext } = await createFlow();

            const listener1 = fn();
            const listener2 = fn();
            const listener3 = fn();
            flow.subscribe(listener1);

            const sub2 = flow.subscribe(listener2);
            flow.subscribe(listener3);

            sub2.unsubscribe();
            await emitNext();

            assert.calledTimes(listener1, 1, "Expected listener1 to be called once");
            assert.calledTimes(listener2, 0, "Expected listener2 not to be called (unsubscribed)");
            assert.calledTimes(listener3, 1, "Expected listener3 to be called once");
        });

        it("should handle unsubscribing the same listener subscribed multiple times", async () => {
            const { flow, emitNext } = await createFlow();

            const listener = fn();
            const sub1 = flow.subscribe(listener);
            const sub2 = flow.subscribe(listener);

            assert.ok(sub1 !== sub2, "Expected different subscription objects");

            await emitNext();
            assert.calledTimes(listener, 2, "Expected listener to be called twice");

            sub1.unsubscribe();
            await emitNext();
            assert.calledTimes(listener, 3, "Expected listener to be called three times (2 + 1)");

            sub2.unsubscribe();
            await emitNext();
            assert.calledTimes(listener, 3, "Expected listener to still be called three times (no more calls)");
        });
    });

    describe("emit handling", () => {
        it("should call all subscribed listeners synchronously", async () => {
            const { flow, emitNext } = await createFlow();

            const listener1 = fn();
            const listener2 = fn();
            const listener3 = fn();

            flow.subscribe(listener1);
            flow.subscribe(listener2);
            flow.subscribe(listener3);

            await emitNext();

            assert.calledTimes(listener1, 1, "Expected listener1 to be called once");
            assert.calledTimes(listener2, 1, "Expected listener2 to be called once");
            assert.calledTimes(listener3, 1, "Expected listener3 to be called once");
        });

        it("should call listeners in the order they were added", async () => {
            const { flow, emitNext } = await createFlow();
            const callOrder: number[] = [];

            const listener1 = fn(() => callOrder.push(1));
            const listener2 = fn(() => callOrder.push(2));
            const listener3 = fn(() => callOrder.push(3));

            flow.subscribe(listener1);
            flow.subscribe(listener2);
            flow.subscribe(listener3);

            await emitNext();

            assert.equal(callOrder, [1, 2, 3], "Expected listeners to be called in the order they were added");
        });

        it("should allow listeners to access the new value via getSnapshot", async () => {
            const { flow, emitNext } = await createFlow();
            const v1 = flow.getSnapshot();
            let v2: unknown;

            flow.subscribe(() => {
                v2 = flow.getSnapshot();
            });

            await emitNext();
            assert.ok(v2 !== v1, "Expected listener to access the new value via getSnapshot");
        });

        it("should handle multiple synchronous changes", async () => {
            const { flow, emitNext } = await createFlow();

            const listener = fn();
            flow.subscribe(listener);

            await emitNext();
            await emitNext();
            const lastValue = await emitNext();

            assert.calledTimes(listener, 3, "Expected listener to be called three times");
            assert.equal(flow.getSnapshot(), lastValue, "Expected flow.getSnapshot() to return the last emitted value");
        });
    });

    describe("listeners error handling", () => {
        it("should still update the value even if listeners throw", async () => {
            const { flow, emitNext } = await createFlow();

            flow.subscribe(() => {
                throw new Error("Listener error");
            });

            const before = flow.getSnapshot();
            await emitNext();

            assert.ok(
                flow.getSnapshot() !== before,
                "Expected flow.getSnapshot() to return updated value even if listener threw",
            );
        });

        it("should call all listeners even if some throw", async () => {
            const { flow, emitNext } = await createFlow();

            const listener1 = fn(() => {
                throw new Error("Error 1");
            });
            const listener2 = fn();
            const listener3 = fn(() => {
                throw new Error("Error 3");
            });

            flow.subscribe(listener1);
            flow.subscribe(listener2);
            flow.subscribe(listener3);

            await emitNext();

            assert.calledTimes(listener1, 1, "Expected listener1 to be called once even though it threw");
            assert.calledTimes(listener2, 1, "Expected listener2 to be called once");
            assert.calledTimes(listener3, 1, "Expected listener3 to be called once even though it threw");
        });

        it("should handle mixed success and error scenarios", async () => {
            const { flow, emitNext } = await createFlow();

            const successListener = fn();
            const errorListener = fn(() => {
                throw new Error("Test error");
            });

            flow.subscribe(successListener);
            flow.subscribe(errorListener);
            flow.subscribe(successListener);

            await emitNext();

            assert.calledTimes(successListener, 2, "Expected successListener to be called twice");
            assert.calledTimes(errorListener, 1, "Expected errorListener to be called once");
        });
    });
}

/**
 * Configuration interface for testing MutableFlow implementations.
 * Provides a mutable flow instance and a method for generating new values to send to the flow.
 *
 * @typeParam T - The MutableFlow type being tested
 *
 * @remarks
 * Unlike {@link TestFlow}, this interface provides a `nextValue` function
 * that only generates values, while the tests themselves call `flow.emit()`.
 * This allows testing the behavior of the MutableFlow's `emit()` method.
 */
export interface TestMutableFlow<T extends MutableFlow<unknown>> {
    /** The MutableFlow instance being tested */
    flow: T;
    /** Function that generates and returns the next value (without emitting to the flow) */
    nextValue: () => InferFlowValue<T>;
}

/**
 * Verifies flow behavior according to the MutableFlow specification.
 * Runs a complete test suite covering Flow behavior plus MutableFlow-specific
 * functionality, such as the `emit()` and `asFlow()` methods.
 *
 * @typeParam T - The MutableFlow type being tested
 * @param createFlow - Factory function that returns a fresh MutableFlow instance and nextValue function for each test
 *
 * @example
 * Testing a custom MutableFlow implementation:
 * ```typescript
 * describe('MutableFlow Specification Compliance', () => {
 *     validateMutableFlowImplementation(() => {
 *         const flow = new MyMutableFlow();
 *         const values = ['first', 'second', 'third'];
 *         let index = 0;
 *         return {
 *             flow,
 *             nextValue: () => values[index++ % values.length]
 *         };
 *     });
 * });
 * ```
 *
 * @see {@link validateFlowImplementation} for testing Flow implementations
 */
export function validateMutableFlowImplementation<T extends MutableFlow<unknown>>(
    options: FlowSpecTestRunnerOptions<TestMutableFlow<T>>,
) {
    const { describe, it, fn, assert } = initTestRunner(options.testRunner);
    const { createFlow } = options;

    validateFlowImplementation({
        testRunner: options.testRunner,
        createFlow: () => {
            const { flow, nextValue } = createFlow();
            return {
                flow,
                emitNext: () => {
                    const value = nextValue();
                    try {
                        flow.emit(value);
                    } catch {
                        // The flow implementation will re-throw errors from listeners, but
                        // we are only interested in the flow's state, so we recover from those
                        // errors gracefully and return the expected value
                    }
                    return value;
                },
            };
        },
    });

    describe("flow.emit()", () => {
        it("should update the internal value", () => {
            const { flow, nextValue } = createFlow();
            const value = nextValue();
            flow.emit(value);
            assert.equal(flow.getSnapshot(), value, "Expected flow.getSnapshot() to return the emitted value");
        });

        it("should not call listeners if the exact same value was emitted", () => {
            const { flow, nextValue } = createFlow();
            const value = nextValue();

            const listener = fn();
            flow.subscribe(listener);

            flow.emit(value);
            assert.calledTimes(listener, 1, "Expected listener to be called once after first emit");

            flow.emit(value);
            assert.calledTimes(listener, 1, "Expected listener not to be called again when same value is emitted");
        });

        it("should catch errors and throw AggregateError", () => {
            const { flow, nextValue } = createFlow();

            const error1 = new Error("Listener 1 error");
            const error2 = new Error("Listener 2 error");
            flow.subscribe(() => {
                throw error1;
            });
            flow.subscribe(() => {
                throw error2;
            });

            let thrown = false;
            try {
                flow.emit(nextValue());
            } catch (aggregateError) {
                thrown = true;
                assert.ok(
                    aggregateError instanceof AggregateError,
                    "Expected error to be an instance of AggregateError",
                );
                assert.ok(
                    (aggregateError as AggregateError).message === "Failed to call flow listeners",
                    "Expected AggregateError message to be 'Failed to call flow listeners'",
                );
                assert.equal(
                    (aggregateError as AggregateError).errors,
                    [error1, error2],
                    "Expected AggregateError.errors to contain all listener errors",
                );
            }
            assert.ok(thrown, "Expected flow.emit to throw AggregateError when listeners throw");
        });

        it("should still update the value even if listeners throw", () => {
            const { flow, nextValue } = createFlow();

            flow.subscribe(() => {
                throw new Error("Listener error");
            });

            const before = flow.getSnapshot();
            assert.throws(() => {
                flow.emit(nextValue());
            }, "Expected flow.emit to throw when listener throws");

            assert.ok(
                flow.getSnapshot() !== before,
                "Expected flow.getSnapshot() to return updated value even if listener threw",
            );
        });

        it("should handle mixed success and error scenarios", () => {
            const { flow, nextValue } = createFlow();

            const successListener = fn();
            const errorListener = fn(() => {
                throw new Error("Test error");
            });

            flow.subscribe(successListener);
            flow.subscribe(errorListener);
            flow.subscribe(successListener);

            let thrown = false;
            try {
                flow.emit(nextValue());
            } catch (aggregateError) {
                thrown = true;
                assert.ok(
                    aggregateError instanceof AggregateError,
                    "Expected error to be an instance of AggregateError",
                );
            }
            assert.ok(thrown, "Expected flow.emit to throw AggregateError when listeners throw");

            assert.calledTimes(successListener, 2, "Expected successListener to be called twice despite error");
            assert.calledTimes(errorListener, 1, "Expected errorListener to be called once");
        });
    });

    describe("flow.asFlow()", () => {
        it("should return a Flow interface", () => {
            const { flow } = createFlow();
            const readOnlyFlow = flow.asFlow();
            assert.ok("subscribe" in readOnlyFlow, "Expected readOnlyFlow to have subscribe property");
            assert.ok("getSnapshot" in readOnlyFlow, "Expected readOnlyFlow to have getSnapshot property");
            assert.ok(typeof readOnlyFlow.subscribe === "function", "Expected readOnlyFlow.subscribe to be a function");
            assert.ok(
                typeof readOnlyFlow.getSnapshot === "function",
                "Expected readOnlyFlow.getSnapshot to be a function",
            );
        });

        it("should provide read-only access to the same data", () => {
            const { flow, nextValue } = createFlow();
            const readOnlyFlow = flow.asFlow();

            const value = nextValue();
            flow.emit(value);

            assert.equal(flow.getSnapshot(), value, "Expected flow.getSnapshot() to return the emitted value");
            assert.ok(
                readOnlyFlow.getSnapshot() === flow.getSnapshot(),
                "Expected readOnlyFlow.getSnapshot() to return the same reference as flow.getSnapshot()",
            );
        });

        it("should allow subscriptions through the read-only interface", () => {
            const { flow, nextValue } = createFlow();
            const readOnlyFlow = flow.asFlow();

            const listener = fn();
            const subscription = readOnlyFlow.subscribe(listener);

            flow.emit(nextValue());
            assert.calledTimes(listener, 1, "Expected listener to be called once after emit");

            subscription.unsubscribe();
            flow.emit(nextValue());
            assert.calledTimes(listener, 1, "Expected listener not to be called after unsubscribe");
        });
    });
}
