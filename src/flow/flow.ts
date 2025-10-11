import type { FlowSubscription } from "./subscription";

/**
 * A readonly data flow.
 * This interface provides reactive data flow capabilities with subscription-based updates.
 *
 * @typeParam Data - The type of data flowing through this flow
 *
 * @example
 * ```typescript
 * const flow: Flow<number> = createFlow(42);
 *
 * // Subscribe to changes
 * const subscription = flow.subscribe(() => {
 *   console.log('Flow updated:', flow.getSnapshot());
 * });
 *
 * // Get current value
 * const currentValue = flow.getSnapshot();
 * ```
 */
export interface Flow<Data> {
    /**
     * Subscribes to changes in the flow.
     *
     * Note: The callback does not receive the new value as a parameter because value computation
     * depends on the scheduling strategy of the specific consumer. To avoid unnecessary computations,
     * the value is never passed directly - consumers should call `getSnapshot()` when needed.
     *
     * @param listener - Function to call when the flow changes
     * @returns A subscription object that can be used to unsubscribe
     *
     * @example
     * ```typescript
     * const subscription = flow.subscribe(() => {
     *   const newValue = flow.getSnapshot();
     *   console.log('Flow changed to:', newValue);
     * });
     *
     * // Later, unsubscribe
     * subscription.unsubscribe();
     * ```
     */
    subscribe(listener: () => void): FlowSubscription;

    /**
     * Returns the latest value from the flow at the time of method invocation.
     *
     * This method provides synchronous access to the current state of the flow.
     *
     * @returns The current value stored in the flow
     *
     * @example
     * ```typescript
     * const currentValue = flow.getSnapshot();
     * console.log('Current flow value:', currentValue);
     * ```
     */
    getSnapshot(): Data;
}

/**
 * A writable data flow.
 *
 * This interface adds mutation capabilities to the base Flow, allowing values to be emitted
 * into the flow.
 *
 * @typeParam Data - The type of data flowing through this flow
 *
 * @example
 * ```typescript
 * const mutableFlow: MutableFlow<string> = createFlow('initial');
 *
 * // Subscribe to changes
 * mutableFlow.subscribe(() => {
 *   console.log('New value:', mutableFlow.getSnapshot());
 * });
 *
 * // Emit new values
 * mutableFlow.emit('updated value');
 *
 * // Convert to readonly
 * const readonlyFlow = mutableFlow.asFlow();
 * ```
 */
export interface MutableFlow<Data> extends Flow<Data> {
    /**
     * Emits a new value into the flow.
     *
     * This will synchronously trigger all subscribed callbacks and update the flow's internal state.
     *
     * @param value - The new value to emit into the flow
     *
     * @example
     * ```typescript
     * mutableFlow.emit('new value');
     * ```
     */
    emit(value: Data): void;

    /**
     * Converts this mutable flow to a readonly Flow.
     *
     * This provides a way to expose a readonly interface while maintaining
     * write access through the original MutableFlow reference.
     *
     * @returns A readonly view of this flow
     *
     * @example
     * ```typescript
     * const mutableFlow: MutableFlow<number> = createFlow(0);
     * const readonlyFlow: Flow<number> = mutableFlow.asFlow();
     *
     * // readonlyFlow.emit(1); // TypeScript error - no emit method
     * // mutableFlow.emit(1);  // OK - still works on original
     * ```
     */
    asFlow(): Flow<Data>;
}
