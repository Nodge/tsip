---
"@tsip/types": minor
---

Add utility types for extracting data types from Flow and AsyncFlow

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
