---
"@tsip/types": minor
---

Add specification test suites for Flow and AsyncFlow interfaces

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
