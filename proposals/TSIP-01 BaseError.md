# TSIP-01: BaseError Interface Proposal

- **Status**: `draft` (Initial idea, under discussion)
- **Authors**:
    - [Maksim Zemskov](https://github.com/nodge)
- **Created**: 2025-05-07
- **Updated**: 2025-05-07

## Abstract

This proposal introduces a `BaseError` interface and class for TypeScript/JavaScript, designed to extend the native `Error` class with support for additional, strongly-typed contextual information. The goal is to provide a standardized way for libraries and applications to enrich error objects with extra data, improving error handling, diagnostics, and logging across the ecosystem.

## Motivation

The native `Error` class in JavaScript/TypeScript is limited in its ability to carry contextual information beyond a message and stack trace. In real-world applications, developers often need to attach additional data to errors for better diagnostics, logging, and automated handling. This leads to ad-hoc solutions and inconsistent error structures across codebases.

## Design Goals

### Goals

- Allow errors to carry structured, strongly-typed metadata.
- Make it easier to create error subclasses for specific domains.
- Ensuring backward compatibility with existing error handling mechanisms.
- Facilitating better integration with logging and monitoring tools.

### Non-Goals

- Out-of-the-box support for error serialization. Serialization requirements vary widely, and deserialization mechanisms are often application-specific and cannot be standardized here.
- Providing a set of predefined error subclasses for various scenarios. This is the responsibility of libraries or applications; the base class should be sufficient for general use.
- Normalizing stack traces or messages from native errors. Such normalization can add significant complexity and increase bundle size of interface implementations and is better handled server-side at the logging or reporting stage if needed.

## Guidance

- The `BaseError` class must extend the native `Error` class.
- `BaseError` must accept `message` and `cause` parameters, similar to the native `Error`.
- `BaseError` must accept additional parameters, which can be strongly typed in subclasses.
- `BaseError` must provide the `extend` method to create error subclasses for specific domains.
- The `extend` method must accept a name and return a new class with the given name.

## TypeScript Definitions

```typescript
/**
 * Additional options passed to BaseError constructor
 */
interface BaseErrorOptions<T> extends ErrorOptions {
    /**
     * Additional structured, strongly-typed metadata
     */
    additional?: T;
}

class BaseError<T = unknown> extends Error {
    public readonly additional: T;

    constructor(message: string, options?: BaseErrorOptions<T>) {
        super(message, { cause: options?.cause });
        this.additional = options?.additional as T;
        Object.setPrototypeOf(this, new.target.prototype);
    }

    /**
     * Creates a new error class extending BaseError with a specific name and type
     * @param name The name of the new error class
     * @returns A new error class extending BaseError
     */
    static extend<T>(name: string): new (message: string, options?: BaseErrorOptions<T>) => BaseError<T> {
        const ErrorClass = class extends BaseError<T> {
            constructor(message: string, options?: BaseErrorOptions<T>) {
                super(message, options);
                this.name = name;
            }
        };

        return ErrorClass;
    }
}
```

## Rationale

**Inheritance from the Native Error Class**

Extending the native `Error` class ensures that error objects include a stack trace, which is critical for debugging and understanding where an error occurred. It also allows existing code to work seamlessly with these errors using `instanceof` checks or utility functions like `Error.isError()`.

**Creating Subclasses from BaseError**

Subclassing `BaseError` allows developers to add semantic meaning to errors and enforce strong typing for additional parameters. This leads to clearer, more maintainable code and enables better tooling support.

**Adding the `additional` Property**

The error object acts as a container for all information relevant to diagnosing and logging the error. Often, the stack trace and message are insufficient, so the ability to store extra context (such as request IDs, user info, or operation details) is essential for effective error handling.

Often, such additional information is passed directly to the error logging system. However, this is not always possible since in many cases, the location where the error occurs and the location where it is logged are not directly connected. Therefore, it is convenient to add additional information to the error instance at the moment of its creation, as at this point there is access to all necessary data.

## Adoption Guide

### Implementing the Interface

Library authors can implement the `BaseError` interface and class as shown above. A library may add additional capabilities as long as they do not violate the proposed behavior.

```typescript
class CoolError<T> extends Error implements BaseError<T> {
    //...
}
```

### Consuming the Interface

```typescript
function handleError(error: BaseError<any>) {
    console.error(error.message, error.additional);
    if (error.cause) {
        console.error('Caused by:', error.cause);
    }
}
```

### Example: Creating Custom Error Subclasses

```typescript
const UnexpectedError = BaseError.extend<undefined>('UnexpectedError');

interface NetworkErrorDetails {
    request: Request;
    statusCode: number | undefined;
    response?: Response | undefined;
}

const NetworkError = BaseError.extend<NetworkErrorDetails>('NetworkError');
```

## FAQ (Frequently Asked Questions)

- **Q: Why not just use the native Error class?**

    - A: The native Error class does not support structured metadata, making it difficult to attach and retrieve contextual information needed for diagnostics and logging.

- **Q: Is this compatible with existing error handling code?**
    - A: Yes. `BaseError` extends the native `Error` class, so it works with `instanceof` checks and standard error handling patterns.

## Unresolved Questions / Future Considerations

- Should we provide utility functions for serialization/deserialization?
- Should we standardize error codes or categories?
- Should we support typescript targets lower than ES2022? It requires polyfilling the `cause` option.

## Prior Art / References

- [node-verror](https://github.com/joyent/node-verror)
- [modern-errors](https://github.com/ehmicky/modern-errors)

## Compatible Implementations / Projects Using This Interface

- None

## Projects Using This Interface

- None

## Changelog

All notable changes to this proposal will be documented in this section.

### 2025-05-07

- Initial draft
