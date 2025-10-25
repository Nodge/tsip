import { initTestRunner, type TestRunner } from "../../../utils/test-runner";
import type { AsyncFlow, AsyncFlowState, MutableAsyncFlow } from "../async-flow";

/**
 * Helper type that extracts the value type from an AsyncFlow type.
 *
 * @typeParam T - The AsyncFlow type from which to extract the value type
 * @returns The value type contained within the AsyncFlow
 */
type InferAsyncFlowValue<T extends AsyncFlow<unknown>> = T extends AsyncFlow<infer V> ? V : never;

/**
 * Configuration options for running AsyncFlow specification tests.
 *
 * @typeParam T - The type of object returned from createFlow (TestAsyncFlow or TestMutableAsyncFlow)
 */
export interface AsyncFlowSpecTestRunnerOptions<T> {
    /** Optional custom test runner (defaults to global test runner) */
    testRunner?: TestRunner;
    /** Factory function that creates a new Flow instance for each test */
    createFlow: () => T;
}

/**
 * Interface for an asynchronous operation used in tests.
 * Provides methods to emit a successful result or an error.
 *
 * @typeParam T - The data type of the successful result
 */
export interface AsyncOperation<T> {
    /** Emits a successful result and returns the value that should be returned from flow.getSnapshot() */
    emitSuccess(): T | Promise<T>;
    /** Emits an error and returns the error that should be returned from flow.getSnapshot() */
    emitError(): unknown;
}

/**
 * Configuration interface for testing AsyncFlow implementations.
 *
 * @typeParam T - The AsyncFlow type being tested
 */
export interface TestAsyncFlow<T extends AsyncFlow<unknown>> {
    /** The AsyncFlow instance being tested */
    flow: T;
    /** Function that starts an asynchronous operation and returns methods to control its result */
    startAsyncOperation(
        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- should not use execution context
        this: void,
    ): AsyncOperation<InferAsyncFlowValue<T>>;
}

/**
 * Validates the behavior of an asynchronous flow according to the AsyncFlow specification.
 *
 * @typeParam T - The AsyncFlow type being tested
 * @param options - Configuration options including optional test runner and factory function to create flow instances
 *
 * @example
 * Usage with a custom AsyncFlow implementation:
 * ```typescript
 * import { validateAsyncFlowImplementation } from 'tsip/tests';
 * import { MyAsyncFlow } from './my-flow-implementation';
 *
 * describe('AsyncFlow Specification Compliance', () => {
 *     validateAsyncFlowImplementation(() => {
 *         const flow = new MyAsyncFlow();
 *         let i = 0;
 *
 *         const safeEmit = (state) => {
 *             try {
 *                 flow.emit(state);
 *             } catch {}
 *         };
 *
 *         return {
 *             flow,
 *             startAsyncOperation() {
 *                 const value = { count: ++i };
 *                 safeEmit({ status: 'pending' });
 *
 *                 return {
 *                     emitSuccess() {
 *                         safeEmit({ status: 'success', data: value });
 *                         return value;
 *                     },
 *                     emitError() {
 *                         const error = new Error('test error');
 *                         safeEmit({ status: 'error', error });
 *                         return error;
 *                     }
 *                 };
 *             }
 *         };
 *     });
 * });
 * ```
 *
 * @see {@link validateMutableAsyncFlowImplementation} for testing MutableAsyncFlow implementations
 */
export function validateAsyncFlowImplementation<T extends AsyncFlow<unknown>>(
    options: AsyncFlowSpecTestRunnerOptions<TestAsyncFlow<T> | Promise<TestAsyncFlow<T>>>,
) {
    const { describe, it, fn, assert } = initTestRunner(options.testRunner);
    const { createFlow } = options;

    describe("asyncFlow.getSnapshot()", () => {
        it("should return pending state", async () => {
            const { flow, startAsyncOperation } = await createFlow();

            startAsyncOperation();

            assert.matchObject(
                flow.getSnapshot(),
                { status: "pending" },
                "Expected flow.getSnapshot() to return pending state",
            );
        });

        it("should return success state", async () => {
            const { flow, startAsyncOperation } = await createFlow();

            const operation = startAsyncOperation();
            const expectedData = await operation.emitSuccess();

            assert.matchObject(
                flow.getSnapshot(),
                {
                    status: "success",
                    data: expectedData,
                },
                "Expected flow.getSnapshot() to return success state with correct data",
            );
        });

        it("should return error state", async () => {
            const { flow, startAsyncOperation } = await createFlow();

            const operation = startAsyncOperation();
            const error = await operation.emitError();

            assert.matchObject(
                flow.getSnapshot(),
                {
                    status: "error",
                    error,
                },
                "Expected flow.getSnapshot() to return error state with correct error",
            );
        });

        it("should return the updated value after emit", async () => {
            const { flow, startAsyncOperation } = await createFlow();

            const operation = startAsyncOperation();
            const v1 = flow.getSnapshot();
            assert.matchObject(v1, { status: "pending" }, "Expected initial state to be pending");

            const expectedData = await operation.emitSuccess();

            const v2 = flow.getSnapshot();
            assert.ok(v1 !== v2, "Expected flow.getSnapshot() to return a different value after emit");
            assert.matchObject(
                v2,
                { status: "success", data: expectedData },
                "Expected flow.getSnapshot() to return success state after emit",
            );
        });

        it("should always return the most recent value", async () => {
            const { flow, startAsyncOperation } = await createFlow();

            const operation1 = startAsyncOperation();
            const value1 = await operation1.emitSuccess();
            assert.matchObject(
                flow.getSnapshot(),
                { status: "success", data: value1 },
                "Expected flow.getSnapshot() to return first success value",
            );

            const operation2 = startAsyncOperation();
            const value2 = await operation2.emitSuccess();
            assert.matchObject(
                flow.getSnapshot(),
                { status: "success", data: value2 },
                "Expected flow.getSnapshot() to return second success value",
            );

            const operation3 = startAsyncOperation();
            const value3 = await operation3.emitSuccess();
            assert.matchObject(
                flow.getSnapshot(),
                { status: "success", data: value3 },
                "Expected flow.getSnapshot() to return third success value",
            );
        });

        it("should return stable reference", async () => {
            const { flow, startAsyncOperation } = await createFlow();
            assert.ok(
                flow.getSnapshot() === flow.getSnapshot(),
                "Expected flow.getSnapshot() to return the same reference when called multiple times",
            );

            const operation = startAsyncOperation();
            await operation.emitSuccess();
            assert.ok(
                flow.getSnapshot() === flow.getSnapshot(),
                "Expected flow.getSnapshot() to return the same reference after emit",
            );
        });
    });

    describe("asyncFlow.subscribe()", () => {
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
            const { flow, startAsyncOperation } = await createFlow();

            const listener1 = fn();
            const listener2 = fn();
            const listener3 = fn();
            flow.subscribe(listener1);
            flow.subscribe(listener2);
            flow.subscribe(listener3);

            const operation = startAsyncOperation();

            // pending state
            assert.calledTimes(listener1, 1, "Expected listener1 to be called once for pending state");
            assert.calledTimes(listener2, 1, "Expected listener2 to be called once for pending state");
            assert.calledTimes(listener3, 1, "Expected listener3 to be called once for pending state");

            await operation.emitSuccess();

            // success state
            assert.calledTimes(listener1, 2, "Expected listener1 to be called twice (pending + success)");
            assert.calledTimes(listener2, 2, "Expected listener2 to be called twice (pending + success)");
            assert.calledTimes(listener3, 2, "Expected listener3 to be called twice (pending + success)");
        });

        it("should allow the same listener to be subscribed multiple times", async () => {
            const { flow, startAsyncOperation } = await createFlow();

            const listener = fn();
            const sub1 = flow.subscribe(listener);
            const sub2 = flow.subscribe(listener);
            assert.ok(sub1 !== sub2, "Expected different subscription objects for the same listener");
            assert.calledTimes(listener, 0, "Expected listener not to be called yet");

            const operation = startAsyncOperation();

            // pending state
            assert.calledTimes(listener, 2, "Expected listener to be called twice for pending state (2 subscriptions)");

            await operation.emitSuccess();

            // success state
            assert.calledTimes(listener, 4, "Expected listener to be called 4 times (2 subscriptions * 2 states)");
        });

        it("should not call listeners added during notification stage", async () => {
            const { flow, startAsyncOperation } = await createFlow();

            const listener1 = fn();
            const listener2 = fn();
            flow.subscribe(() => {
                listener1();
                flow.subscribe(listener2);
            });

            const operation = startAsyncOperation();

            // pending state
            assert.calledTimes(listener1, 1, "Expected listener1 to be called once");
            assert.calledTimes(listener2, 0, "Expected listener2 not to be called (added during notification)");

            await operation.emitSuccess();

            // success state
            assert.calledTimes(listener1, 2, "Expected listener1 to be called twice");
            assert.calledTimes(
                listener2,
                1,
                "Expected listener2 to be called once (subscribed after first notification)",
            );
        });

        it("should call listeners removed during notification stage", async () => {
            const { flow, startAsyncOperation } = await createFlow();

            const listener = fn();
            flow.subscribe(() => {
                sub.unsubscribe();
            });
            const sub = flow.subscribe(listener);

            const operation = startAsyncOperation();
            await operation.emitSuccess();
            assert.calledTimes(
                listener,
                1,
                "Expected listener to be called even though it was unsubscribed during notification",
            );
        });
    });

    describe("subscription.unsubscribe()", () => {
        it("should stop calling the listener after unsubscribe", async () => {
            const { flow, startAsyncOperation } = await createFlow();

            const listener = fn();
            const subscription = flow.subscribe(listener);

            const operation1 = startAsyncOperation();
            await operation1.emitSuccess();
            assert.calledTimes(listener, 2, "Expected listener to be called twice (pending + success)");
            subscription.unsubscribe();

            const operation2 = startAsyncOperation();
            await operation2.emitSuccess();
            assert.calledTimes(
                listener,
                2,
                "Expected listener to still be called only twice (not called again after unsubscribe)",
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
            const { flow, startAsyncOperation } = await createFlow();

            const listener1 = fn();
            const listener2 = fn();
            const listener3 = fn();
            flow.subscribe(listener1);

            const sub2 = flow.subscribe(listener2);
            flow.subscribe(listener3);

            sub2.unsubscribe();

            const operation = startAsyncOperation();
            await operation.emitSuccess();

            assert.calledTimes(listener1, 2, "Expected listener1 to be called twice (pending + success)");
            assert.calledTimes(listener2, 0, "Expected listener2 not to be called (unsubscribed)");
            assert.calledTimes(listener3, 2, "Expected listener3 to be called twice (pending + success)");
        });

        it("should handle unsubscribing the same listener subscribed multiple times", async () => {
            const { flow, startAsyncOperation } = await createFlow();

            const listener = fn();
            const sub1 = flow.subscribe(listener);
            const sub2 = flow.subscribe(listener);

            assert.ok(sub1 !== sub2, "Expected different subscription objects");

            const operation1 = startAsyncOperation();
            await operation1.emitSuccess();
            assert.calledTimes(listener, 4, "Expected listener to be called 4 times (2 subscriptions * 2 states)");

            sub1.unsubscribe();

            const operation2 = startAsyncOperation();
            await operation2.emitSuccess();
            assert.calledTimes(listener, 6, "Expected listener to be called 6 times (4 + 1 subscription * 2 states)");

            sub2.unsubscribe();

            const operation3 = startAsyncOperation();
            await operation3.emitSuccess();
            assert.calledTimes(listener, 6, "Expected listener to still be called 6 times (no more calls)");
        });
    });

    describe("asyncFlow.asPromise()", () => {
        it("should resolve immediately when state is success", async () => {
            const { flow, startAsyncOperation } = await createFlow();

            const operation = startAsyncOperation();
            const expectedData = await operation.emitSuccess();

            let result: unknown;
            void flow.asPromise().then((data) => {
                result = data;
            });

            await Promise.resolve(); // wait microtasks

            assert.equal(result, expectedData, "Expected promise to resolve with the expected data");
        });

        it("should reject immediately when state is error", async () => {
            const { flow, startAsyncOperation } = await createFlow();

            const operation = startAsyncOperation();
            const error = await operation.emitError();

            let result: unknown;
            void flow.asPromise().then(
                () => {
                    result = "resolved";
                },
                (error: unknown) => {
                    result = error;
                },
            );

            await Promise.resolve(); // wait microtasks

            assert.equal(result, error, "Expected promise to reject with the expected error");
        });

        it("should wait for success state", async () => {
            const { flow, startAsyncOperation } = await createFlow();

            const operation = startAsyncOperation();
            const dataPromise = flow.asPromise();

            // Emit success after a short delay
            await Promise.resolve();
            const expectedData = await operation.emitSuccess();

            const result = await dataPromise;
            assert.equal(result, expectedData, "Expected promise to resolve with the expected data");
        });

        it("should wait for error state when initially pending", async () => {
            const { flow, startAsyncOperation } = await createFlow();

            const operation = startAsyncOperation();
            const dataPromise = flow.asPromise();

            // Emit error after a short delay
            await Promise.resolve();
            const error = await operation.emitError();

            let thrown = false;
            try {
                await dataPromise;
            } catch (err) {
                thrown = true;
                assert.equal(err, error, "Expected promise to reject with the expected error");
            }
            assert.ok(thrown, "Expected promise to reject");
        });

        it("should handle multiple pending -> success transitions", async () => {
            const { flow, startAsyncOperation } = await createFlow();

            const operation = startAsyncOperation();
            const promise1 = flow.asPromise();
            const promise2 = flow.asPromise();

            const expectedData = await operation.emitSuccess();

            const [result1, result2] = await Promise.all([promise1, promise2]);
            assert.equal(result1, expectedData, "Expected first promise to resolve with expected data");
            assert.equal(result2, expectedData, "Expected second promise to resolve with expected data");
        });

        it("should handle multiple pending -> error transitions", async () => {
            const { flow, startAsyncOperation } = await createFlow();

            const operation = startAsyncOperation();
            const promise1 = flow.asPromise();
            const promise2 = flow.asPromise();

            const error = await operation.emitError();

            let thrown = false;
            try {
                await Promise.all([promise1, promise2]);
            } catch (err) {
                thrown = true;
                assert.equal(err, error, "Expected promises to reject with the expected error");
            }
            assert.ok(thrown, "Expected promises to reject");
        });

        it("should return the same promise for pending state", async () => {
            const { flow, startAsyncOperation } = await createFlow();

            const operation = startAsyncOperation();
            const promise1 = flow.asPromise();
            const promise2 = flow.asPromise();

            assert.ok(promise1 === promise2, "Expected asPromise to return the same promise for pending state");

            await operation.emitSuccess();
            await Promise.all([promise1, promise2]);
        });

        it("should return same promise after success transition until new pending state", async () => {
            const { flow, startAsyncOperation } = await createFlow();

            const operation = startAsyncOperation();
            const promise1 = flow.asPromise();
            const promise2 = flow.asPromise();

            assert.ok(promise1 === promise2, "Expected asPromise to return the same promise");

            await operation.emitSuccess();

            await Promise.all([promise1, promise2]);

            const promise3 = flow.asPromise();
            assert.ok(promise1 === promise3, "Expected asPromise to return the same promise after success");
            const result1 = await promise1;
            const result3 = await promise3;
            assert.ok(result3 === result1, "Expected promise3 to resolve to the same value as promise1");
            const result2 = await promise2;
            assert.ok(result3 === result2, "Expected promise3 to resolve to the same value as promise2");

            startAsyncOperation();
            const promise4 = flow.asPromise();
            assert.ok(promise4 !== promise3, "Expected asPromise to return a new promise after new pending state");
        });

        it("should return same promise if the state changes from pending to pending", async () => {
            const { flow, startAsyncOperation } = await createFlow();

            startAsyncOperation();
            const promise1 = flow.asPromise();

            startAsyncOperation();
            const promise2 = flow.asPromise();

            const operation = startAsyncOperation();
            const promise3 = flow.asPromise();

            assert.ok(promise1 === promise2, "Expected same promise for second pending state");
            assert.ok(promise1 === promise3, "Expected same promise for third pending state");

            const expectedData = await operation.emitSuccess();
            const result1 = await promise1;
            assert.equal(result1, expectedData, "Expected promise1 to resolve with expected data");
            const result2 = await promise2;
            assert.ok(result2 === result1, "Expected promise2 to resolve to the same value as promise1");
            const result3 = await promise3;
            assert.ok(result3 === result1, "Expected promise3 to resolve to the same value as promise1");
        });
    });

    describe("emit handling", () => {
        it("should call all subscribed listeners synchronously", async () => {
            const { flow, startAsyncOperation } = await createFlow();

            const listener1 = fn();
            const listener2 = fn();
            const listener3 = fn();

            flow.subscribe(listener1);
            flow.subscribe(listener2);
            flow.subscribe(listener3);

            const operation = startAsyncOperation();
            await operation.emitSuccess();

            assert.calledTimes(listener1, 2, "Expected listener1 to be called twice (pending + success)");
            assert.calledTimes(listener2, 2, "Expected listener2 to be called twice (pending + success)");
            assert.calledTimes(listener3, 2, "Expected listener3 to be called twice (pending + success)");
        });

        it("should call listeners in the order they were added", async () => {
            const { flow, startAsyncOperation } = await createFlow();
            const callOrder: number[] = [];

            const listener1 = fn(() => callOrder.push(1));
            const listener2 = fn(() => callOrder.push(2));
            const listener3 = fn(() => callOrder.push(3));

            flow.subscribe(listener1);
            flow.subscribe(listener2);
            flow.subscribe(listener3);

            const operation = startAsyncOperation();
            await operation.emitSuccess();

            assert.equal(
                callOrder,
                [1, 2, 3, 1, 2, 3],
                "Expected listeners to be called in the order they were added (twice for pending + success)",
            );
        });

        it("should allow listeners to access the new value via getSnapshot", async () => {
            const { flow, startAsyncOperation } = await createFlow();
            const v1 = flow.getSnapshot();
            let v2: unknown;

            flow.subscribe(() => {
                v2 = flow.getSnapshot();
            });

            const operation = startAsyncOperation();
            const expectedData = await operation.emitSuccess();

            assert.ok(v2 !== v1, "Expected listener to access the new value via getSnapshot");
            assert.matchObject(
                v2,
                { status: "success", data: expectedData },
                "Expected new value to be the success state",
            );
        });

        it("should handle multiple synchronous changes", async () => {
            const { flow, startAsyncOperation } = await createFlow();

            const listener = fn();
            flow.subscribe(listener);

            const operation1 = startAsyncOperation();
            await operation1.emitSuccess();

            const operation2 = startAsyncOperation();
            await operation2.emitSuccess();

            const operation3 = startAsyncOperation();
            const expectedData = await operation3.emitSuccess();

            assert.calledTimes(listener, 6, "Expected listener to be called 6 times (3 operations * 2 states)");
            assert.matchObject(
                flow.getSnapshot(),
                { status: "success", data: expectedData },
                "Expected flow.getSnapshot() to return the last success state",
            );
        });
    });

    describe("listeners error handling", () => {
        it("should still update the value even if listeners throw", async () => {
            const { flow, startAsyncOperation } = await createFlow();

            flow.subscribe(() => {
                throw new Error("Listener error");
            });

            const operation = startAsyncOperation();

            assert.matchObject(
                flow.getSnapshot(),
                { status: "pending" },
                "Expected flow.getSnapshot() to return pending state",
            );

            await operation.emitSuccess();
            assert.matchObject(
                flow.getSnapshot(),
                { status: "success" },
                "Expected flow.getSnapshot() to return success state even if listener threw",
            );
        });

        it("should call all listeners even if some throw", async () => {
            const { flow, startAsyncOperation } = await createFlow();

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

            const operation = startAsyncOperation();
            await operation.emitSuccess();

            assert.calledTimes(listener1, 2, "Expected listener1 to be called twice even though it threw");
            assert.calledTimes(listener2, 2, "Expected listener2 to be called twice");
            assert.calledTimes(listener3, 2, "Expected listener3 to be called twice even though it threw");
        });

        it("should handle mixed success and error scenarios", async () => {
            const { flow, startAsyncOperation } = await createFlow();

            const successListener = fn();
            const errorListener = fn(() => {
                throw new Error("Test error");
            });

            flow.subscribe(successListener);
            flow.subscribe(errorListener);
            flow.subscribe(successListener);

            const operation = startAsyncOperation();
            await operation.emitSuccess();

            assert.calledTimes(
                successListener,
                4,
                "Expected successListener to be called 4 times (2 subscriptions * 2 states)",
            );
            assert.calledTimes(errorListener, 2, "Expected errorListener to be called twice (pending + success)");
        });
    });
}

/**
 * Configuration interface for testing MutableAsyncFlow implementations.
 * Provides a mutable async flow instance and a method to generate new values to send to the flow.
 *
 * @typeParam T - The MutableAsyncFlow type being tested
 *
 * @remarks
 * Unlike {@link TestAsyncFlow}, this interface provides a `nextValue` function
 * that only generates values, while the tests themselves call `flow.emit()`.
 * This allows testing the behavior of the MutableAsyncFlow object's `emit()` method.
 */
export interface TestMutableAsyncFlow<T extends MutableAsyncFlow<unknown>> {
    /** The MutableAsyncFlow instance being tested */
    flow: T;
    /** Function that generates and returns the next value (without emitting to the flow) */
    nextValue: () => InferAsyncFlowValue<T>;
}

/**
 * Validates the behavior of an asynchronous flow according to the MutableAsyncFlow specification.
 * Runs a complete test suite covering AsyncFlow behavior plus MutableAsyncFlow-specific
 * functionality, such as the `emit()` and `asFlow()` methods.
 *
 * @typeParam T - The MutableAsyncFlow type being tested
 * @param options - Configuration options including factory function that returns a fresh MutableAsyncFlow instance and nextValue function for each test
 *
 * @example
 * Testing a custom MutableAsyncFlow implementation:
 * ```typescript
 * describe('MutableAsyncFlow Specification Compliance', () => {
 *     validateMutableAsyncFlowImplementation(() => {
 *         const flow = createAsyncFlow({ status: 'success', data: { value: 0 } });
 *         let i = 0;
 *         return {
 *             flow,
 *             nextValue() {
 *                 return { value: ++i };
 *             }
 *         };
 *     });
 * });
 * ```
 *
 * @see {@link validateAsyncFlowImplementation} for testing AsyncFlow implementations
 */
export function validateMutableAsyncFlowImplementation<T extends MutableAsyncFlow<unknown>>(
    options: AsyncFlowSpecTestRunnerOptions<TestMutableAsyncFlow<T> | Promise<TestMutableAsyncFlow<T>>>,
) {
    const { describe, it, fn, assert } = initTestRunner(options.testRunner);
    const { createFlow } = options;

    validateAsyncFlowImplementation({
        testRunner: options.testRunner,
        createFlow: async () => {
            const { flow, nextValue } = await createFlow();

            const safeEmit = (state: AsyncFlowState<InferAsyncFlowValue<T>>) => {
                try {
                    flow.emit(state);
                } catch {
                    // The flow implementation will re-throw errors from listeners, but
                    // we are only interested in the flow's state, so we recover from those
                    // errors gracefully and return the expected value
                }
            };

            return {
                flow,
                startAsyncOperation() {
                    const value = nextValue();
                    safeEmit({ status: "pending" });

                    return {
                        emitSuccess() {
                            safeEmit({ status: "success", data: value });
                            return value;
                        },
                        emitError() {
                            const error = new Error("test error");
                            safeEmit({ status: "error", error });
                            return error;
                        },
                    };
                },
            };
        },
    });

    describe("asyncFlow.emit()", () => {
        it("should update the internal value", async () => {
            const { flow, nextValue } = await createFlow();
            const value = nextValue();
            flow.emit({ status: "success", data: value });
            assert.matchObject(
                flow.getSnapshot(),
                {
                    status: "success",
                    data: value,
                },
                "Expected flow.getSnapshot() to return the emitted success state",
            );
        });

        it("should not call listeners if the exact same value was emitted", async () => {
            const { flow, nextValue } = await createFlow();
            const value = nextValue();

            const listener = fn();
            flow.subscribe(listener);

            const state = { status: "success" as const, data: value };

            flow.emit(state);
            assert.calledTimes(listener, 1, "Expected listener to be called once after first emit");

            flow.emit(state);
            assert.calledTimes(listener, 1, "Expected listener not to be called again when same value is emitted");
        });

        it("should catch errors and throw AggregateError", async () => {
            const { flow, nextValue } = await createFlow();

            const error1 = new Error("Listener 1 error");
            const error2 = new Error("Listener 2 error");
            flow.subscribe(() => {
                throw error1;
            });
            flow.subscribe(() => {
                throw error2;
            });

            assert.throws(() => {
                flow.emit({ status: "success", data: nextValue() });
            }, "Expected emit to throw AggregateError");

            try {
                flow.emit({ status: "success", data: nextValue() });
            } catch (aggregateError) {
                assert.ok(
                    aggregateError instanceof AggregateError,
                    "Expected error to be an instance of AggregateError",
                );
                assert.ok(
                    (aggregateError as AggregateError).message === "Failed to call flow listeners",
                    "Expected AggregateError to have correct message",
                );
                assert.equal(
                    (aggregateError as AggregateError).errors,
                    [error1, error2],
                    "Expected AggregateError to contain both errors",
                );
            }
        });

        it("should still update the value even if listeners throw", async () => {
            const { flow, nextValue } = await createFlow();

            flow.subscribe(() => {
                throw new Error("Listener error");
            });

            const before = flow.getSnapshot();
            assert.throws(() => {
                flow.emit({ status: "success", data: nextValue() });
            }, "Expected emit to throw");

            assert.ok(
                flow.getSnapshot() !== before,
                "Expected flow.getSnapshot() to return updated value even if listener threw",
            );
        });

        it("should handle mixed success and error scenarios", async () => {
            const { flow, nextValue } = await createFlow();

            const successListener = fn();
            const errorListener = fn(() => {
                throw new Error("Test error");
            });

            flow.subscribe(successListener);
            flow.subscribe(errorListener);
            flow.subscribe(successListener);

            assert.throws(() => {
                flow.emit({ status: "success", data: nextValue() });
            }, "Expected emit to throw AggregateError");

            assert.calledTimes(successListener, 2, "Expected successListener to be called twice");
            assert.calledTimes(errorListener, 1, "Expected errorListener to be called once");
        });
    });

    describe("asyncFlow.asFlow()", () => {
        it("should return a Flow interface", async () => {
            const { flow } = await createFlow();
            const readOnlyFlow = flow.asFlow();
            assert.ok("subscribe" in readOnlyFlow, "Expected readOnlyFlow to have 'subscribe' property");
            assert.ok("getSnapshot" in readOnlyFlow, "Expected readOnlyFlow to have 'getSnapshot' property");
            assert.ok("asPromise" in readOnlyFlow, "Expected readOnlyFlow to have 'asPromise' property");
            assert.ok(typeof readOnlyFlow.subscribe === "function", "Expected subscribe to be a function");
            assert.ok(typeof readOnlyFlow.getSnapshot === "function", "Expected getSnapshot to be a function");
            assert.ok(typeof readOnlyFlow.asPromise === "function", "Expected asPromise to be a function");
        });

        it("should provide read-only access to the same data", async () => {
            const { flow, nextValue } = await createFlow();
            const readOnlyFlow = flow.asFlow();

            const value = nextValue();
            flow.emit({ status: "success", data: value });

            assert.matchObject(
                flow.getSnapshot(),
                {
                    status: "success",
                    data: value,
                },
                "Expected flow.getSnapshot() to return the emitted success state",
            );
            assert.ok(
                readOnlyFlow.getSnapshot() === flow.getSnapshot(),
                "Expected readOnlyFlow.getSnapshot() to return the same reference as flow.getSnapshot()",
            );
        });

        it("should allow subscriptions through the read-only interface", async () => {
            const { flow, nextValue } = await createFlow();
            const readOnlyFlow = flow.asFlow();

            const listener = fn();
            const subscription = readOnlyFlow.subscribe(listener);

            flow.emit({ status: "success", data: nextValue() });
            assert.calledTimes(listener, 1, "Expected listener to be called once");

            subscription.unsubscribe();
            flow.emit({ status: "success", data: nextValue() });
            assert.calledTimes(
                listener,
                1,
                "Expected listener to still be called only once (not called again after unsubscribe)",
            );
        });

        it("should support asPromise through the read-only interface", async () => {
            const { flow, nextValue } = await createFlow();
            const readOnlyFlow = flow.asFlow();

            const value = nextValue();
            flow.emit({ status: "success", data: value });
            const result = await readOnlyFlow.asPromise();

            assert.equal(result, value, "Expected readOnlyFlow.asPromise() to resolve with the correct value");
        });
    });
}
