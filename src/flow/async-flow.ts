import type { Flow } from "./flow";

/**
 * Represents the state of an asynchronous operation within an AsyncFlow.
 *
 * This discriminated union type captures the three possible states of an async operation:
 * pending, successful completion, or error. Each state may retain data or error information
 * from previous states to provide continuity during state transitions.
 *
 * @typeParam Data - The type of data when the async operation succeeds
 *
 * @example
 * ```typescript
 * // Pending state - operation in progress
 * const pendingState: AsyncFlowState<User> = {
 *   status: "pending",
 *   data: previousUser, // Optional: data from previous successful state
 * };
 *
 * // Success state - operation completed successfully
 * const successState: AsyncFlowState<User> = {
 *   status: "success",
 *   data: newUser
 * };
 *
 * // Error state - operation failed
 * const errorState: AsyncFlowState<User> = {
 *   status: "error",
 *   data: previousUser, // Optional: data from previous successful state
 *   error: new Error("Failed to fetch user")
 * };
 * ```
 */
export type AsyncFlowState<Data> =
    | {
          /** Indicates the async operation is currently in progress */
          status: "pending";
          /** Optional data that may remain from a previous successful state */
          data?: Data | undefined;
      }
    | {
          /** Indicates the async operation completed successfully */
          status: "success";
          /** The successfully resolved data */
          data: Data;
      }
    | {
          /** Indicates the async operation failed with an error */
          status: "error";
          /** Optional data that may remain from a previous successful state */
          data?: Data | undefined;
          /** The error that caused the operation to fail */
          error: unknown;
      };

/**
 * A readonly data flow that manages asynchronous operation states.
 *
 * AsyncFlow extends the base Flow interface to handle asynchronous operations,
 * providing state management for pending, success, and error states.
 *
 * @typeParam Data - The type of data when async operations succeed
 *
 * @example
 * ```typescript
 * const userFlow: AsyncFlow<User> = createAsyncFlow({ status: "pending" });
 *
 * userFlow.subscribe(() => {
 *   const state = userFlow.getSnapshot();
 *   switch (state.status) {
 *     case "pending":
 *       console.log("Loading user...");
 *       break;
 *     case "success":
 *       console.log("User loaded:", state.data);
 *       break;
 *     case "error":
 *       console.error("Failed to load user:", state.error);
 *       break;
 *   }
 * });
 *
 * // Get resolved data when available
 * const userData = await userFlow.asPromise();
 * ```
 */
export interface AsyncFlow<Data> extends Flow<AsyncFlowState<Data>> {
    /**
     * Returns a Promise with resolved data from the flow.
     *
     * This method waits for the next successful state and returns the resolved data.
     * If the current state is success, it returns resolved promise immediately.
     * If the current state is error, it returns rejected promise immediately.
     * If the current state is pending, it waits for the next success or error state.
     *
     * @returns A promise that resolves with the successfully resolved data
     *
     * @example
     * ```typescript
     * try {
     *   const userData = await userFlow.asPromise();
     *   console.log("User data:", userData);
     * } catch (error) {
     *   console.error("Failed to get user data:", error);
     * }
     * ```
     */
    asPromise(): Promise<Data>;
}

/**
 * A writable data flow that manages asynchronous operation states.
 *
 * This interface adds mutation capabilities to the base AsyncFlow, allowing values
 * to be emitted into the flow.
 *
 * @typeParam Data - The type of data when async operations succeed
 *
 * @example
 * ```typescript
 * const mutableUserFlow: MutableAsyncFlow<User> = createAsyncFlow({ status: "pending" });
 *
 * // Start an async operation
 * mutableUserFlow.emit({ status: "pending" });
 *
 * try {
 *   const user = await fetchUser();
 *   mutableUserFlow.emit({ status: "success", data: user });
 * } catch (error) {
 *   mutableUserFlow.emit({ status: "error", error });
 * }
 *
 * // Convert to readonly
 * const readonlyFlow = mutableUserFlow.asFlow();
 * ```
 */
export interface MutableAsyncFlow<Data> extends AsyncFlow<Data> {
    /**
     * Emits a new async state into the flow.
     *
     * This will synchronously trigger all subscribed callbacks and update the flow's internal state.
     *
     * @param value - The new async state to emit
     *
     * @example
     * ```typescript
     * // Start loading
     * mutableFlow.emit({ status: "pending" });
     *
     * // Complete successfully
     * mutableFlow.emit({
     *   status: "success",
     *   data: result
     * });
     *
     * // Handle error
     * mutableFlow.emit({
     *   status: "error",
     *   error: new Error("Operation failed"),
     *   data: previousData // Optional: retain previous data
     * });
     * ```
     */
    emit(value: AsyncFlowState<Data>): void;

    /**
     * Converts this mutable async flow to a readonly AsyncFlow.
     *
     * This provides a way to expose a readonly interface while maintaining
     * write access through the original MutableAsyncFlow reference.
     *
     * @returns A readonly view of this async flow
     *
     * @example
     * ```typescript
     * const mutableFlow: MutableAsyncFlow<Data> = createAsyncFlow();
     * const readonlyFlow: AsyncFlow<Data> = mutableFlow.asFlow();
     *
     * // readonlyFlow.emit(...); // TypeScript error - no emit method
     * // mutableFlow.emit(...);  // OK - still works on original
     * ```
     */
    asFlow(): AsyncFlow<Data>;
}
