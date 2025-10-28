---
"@tsip/types": minor
---

Add types for ErrorLogger interface (TSIP-02)

This release introduces the `ErrorLogger` interface, a TypeScript interface for error logging across applications and libraries. The interface defines four severity-based logging methods (`info`, `warn`, `error`, `fatal`) that accept error instances and provide a consistent contract for reporting errors to various destinations such as the console, monitoring systems, or tracing services.

**Exported types:**

- `ErrorLogger` - Interface with logging methods
