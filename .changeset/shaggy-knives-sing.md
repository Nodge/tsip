---
"@tsip/types": minor
---

Add types for BaseError interface (TSIP-01)

This release introduces the `BaseError` interface, a TypeScript interface for creating structured, extensible error classes. The interface extends the native JavaScript `Error` class with support for strongly-typed metadata, error chaining via `cause`, and optional error grouping.

**Exported types:**

- `BaseError<Additional>` - Core interface for error instances with typed metadata
- `BaseErrorConstructor<Additional>` - Constructor interface with `extend()` method for creating error subclasses
- `BaseErrorOptions<Additional>` - Options interface for error construction
