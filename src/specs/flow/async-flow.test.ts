import { describe, it, expectTypeOf } from "vitest";
import type { InferAsyncFlowValue, AsyncFlow, MutableAsyncFlow, AsyncFlowState } from "./async-flow";

describe("InferAsyncFlowValue", () => {
    it("should infer type for AsyncFlow", () => {
        type MyFlow = AsyncFlow<number>;

        expectTypeOf<InferAsyncFlowValue<MyFlow>>().toEqualTypeOf<number>();
    });

    it("should infer type for MutableAsyncFlow", () => {
        type MyFlow = MutableAsyncFlow<number>;

        expectTypeOf<InferAsyncFlowValue<MyFlow>>().toEqualTypeOf<number>();
    });

    it("should support inferring union types", () => {
        type MyFlow = AsyncFlow<number | string>;

        expectTypeOf<InferAsyncFlowValue<MyFlow>>().toEqualTypeOf<number | string>();
    });

    it("should support inferring from structural copies of AsyncFlow", () => {
        type State<Data> =
            | {
                  status: "pending";
                  data?: Data | undefined;
              }
            | {
                  status: "success";
                  data: Data;
              }
            | {
                  status: "error";
                  data?: Data | undefined;
                  error: unknown;
              };

        interface MyFlow {
            subscribe(): { unsubscribe(): void };
            getSnapshot(): State<number>;
            asPromise(): Promise<number>;
        }

        expectTypeOf<InferAsyncFlowValue<MyFlow>>().toEqualTypeOf<number>();
    });

    it("should not infer from objects not matching AsyncFlow interface", () => {
        interface MyFlow1 {
            getSnapshot(): AsyncFlowState<number>;
            asPromise(): Promise<number>;
        }

        interface MyFlow2 {
            subscribe(): { unsubscribe(): void };
            asPromise(): Promise<number>;
        }

        interface MyFlow3 {
            subscribe(): { unsubscribe(): void };
            getSnapshot(): AsyncFlowState<number>;
        }

        interface MyFlow4 {
            subscribe(): void;
            getSnapshot(): AsyncFlowState<number>;
            asPromise(): Promise<number>;
        }

        expectTypeOf<InferAsyncFlowValue<MyFlow1>>().toEqualTypeOf<never>();
        expectTypeOf<InferAsyncFlowValue<MyFlow2>>().toEqualTypeOf<never>();
        expectTypeOf<InferAsyncFlowValue<MyFlow3>>().toEqualTypeOf<never>();
        expectTypeOf<InferAsyncFlowValue<MyFlow4>>().toEqualTypeOf<never>();
    });
});
