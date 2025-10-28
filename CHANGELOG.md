# @tsip/types

## 0.5.0

### Minor Changes

- [#13](https://github.com/Nodge/tsip/pull/13) [`32f4990`](https://github.com/Nodge/tsip/commit/32f4990f48ece195c5a1eaa4df14b8ba7004eed5) Thanks [@Nodge](https://github.com/Nodge)! - Add types for BaseError interface (TSIP-01)

  This release introduces the `BaseError` interface, a TypeScript interface for creating structured, extensible error classes. The interface extends the native JavaScript `Error` class with support for strongly-typed metadata, error chaining via `cause`, and optional error grouping.

  **Exported types:**
  - `BaseError<Additional>` - Core interface for error instances with typed metadata
  - `BaseErrorConstructor<Additional>` - Constructor interface with `extend()` method for creating error subclasses
  - `BaseErrorOptions<Additional>` - Options interface for error construction

## 0.4.0

### Minor Changes

- [#10](https://github.com/Nodge/tsip/pull/10) [`26cd959`](https://github.com/Nodge/tsip/commit/26cd959cacbfa92fa82cf37ea278c6570496bc9c) Thanks [@Nodge](https://github.com/Nodge)! - Add utility types for extracting data types from Flow and AsyncFlow

  Introduces two new utility types:
  - `InferFlowValue<T>`: Extracts the data type from a `Flow<Data>` or `MutableFlow<Data>`
  - `InferAsyncFlowValue<T>`: Extracts the data type from an `AsyncFlow<Data>` or `MutableAsyncFlow<Data>`

  These types are useful for working with Flow types in generic contexts where you need to extract the underlying data type without knowing it in advance.

  **Example:**

  ```typescript
  type MyFlow = Flow<{ id: number; name: string }>;
  type UserData = InferFlowValue<MyFlow>; // { id: number; name: string }

  type MyAsyncFlow = AsyncFlow<boolean>;
  type BooleanType = InferAsyncFlowValue<MyAsyncFlow>; // boolean
  ```

## 0.3.0

### Minor Changes

- [#8](https://github.com/Nodge/tsip/pull/8) [`7260ca0`](https://github.com/Nodge/tsip/commit/7260ca03e15e8b4e1dbe9b41692919ff39af8665) Thanks [@Nodge](https://github.com/Nodge)! - Add specification test suites for Flow and AsyncFlow interfaces

  This change introduces comprehensive test suites that validate Flow and AsyncFlow implementations for spec compliance. Library authors can now import and run these tests against their implementations to ensure they correctly follow the specifications.

  **Available Test Functions:**
  - `validateFlowImplementation` - Tests Flow interface compliance
  - `validateMutableFlowImplementation` - Tests MutableFlow interface compliance
  - `validateAsyncFlowImplementation` - Tests AsyncFlow interface compliance
  - `validateMutableAsyncFlowImplementation` - Tests MutableAsyncFlow interface compliance

  **Example Usage:**

  ```typescript
  import { describe, it } from "vitest";
  import { validateMutableFlowImplementation } from "@tsip/types/tests";
  import { createFlow } from "./my-flow-implementation";

  describe("My Flow Implementation", () => {
    validateMutableFlowImplementation({
      testRunner: { describe, it },
      createFlow: () => {
        const flow = createFlow(0);
        let counter = 0;
        return {
          flow,
          nextValue: () => ++counter,
        };
      },
    });
  });
  ```

  The test suites are framework-agnostic and compatible with Mocha, Jest, Vitest, and other testing frameworks.

## 0.2.0

### Minor Changes

- [#6](https://github.com/Nodge/tsip/pull/6) [`6b52293`](https://github.com/Nodge/tsip/commit/6b52293c1b44984da6d2058a847ad97bdb88e85e) Thanks [@Nodge](https://github.com/Nodge)! - Add types for the upcoming Flow interface proposal. Introduces `Flow`, `MutableFlow`, `AsyncFlow`, `MutableAsyncFlow`, `AsyncFlowState`, and `FlowSubscription` types to support reactive data flow patterns.

## 0.1.0

### Minor Changes

- [#3](https://github.com/Nodge/tsip/pull/3) [`b25d28b`](https://github.com/Nodge/tsip/commit/b25d28b1cfd8b5753e98fb1a6b205aeea57db83e) Thanks [@Nodge](https://github.com/Nodge)! - Initial npm package setup with build configuration. The package is now available on npm as `@tsip/types`.
