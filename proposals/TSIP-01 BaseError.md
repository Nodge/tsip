# TSIP-01: BaseError Interface Proposal

- **Status**: `draft` (Initial idea, under discussion)
- **Authors**:
    - [Maksim Zemskov](https://github.com/nodge)
- **Created**: 2025-05-07
- **Updated**: 2025-05-09

## Abstract

This proposal introduces a `BaseError` interface for TypeScript/JavaScript. It's designed to extend the native `Error` class by adding support for strongly-typed contextual information. The primary goal is to offer a standardized method for libraries and applications to augment error objects with additional data, thereby enhancing error handling, diagnostics, and logging.

## Motivation

The native `Error` class in JavaScript/TypeScript offers limited capabilities for conveying contextual information beyond a simple message and stack trace. In practice, developers frequently need to append supplementary data to errors to improve diagnostics, logging, and automated error-handling processes. The absence of a standardized approach often results in ad-hoc solutions and inconsistent error structures across different codebases.

## Design Goals

### Goals

- Allow errors to carry structured, strongly-typed metadata.
- Make it easier to create error subclasses for specific domains.
- Ensure backward compatibility with existing error handling mechanisms.
- Facilitate better integration with logging and monitoring tools.

### Non-Goals

- Provide out-of-the-box support for error serialization. Serialization requirements vary widely, and deserialization mechanisms are often application-specific, making standardization in this context impractical.
- Provide a set of predefined error subclasses for various scenarios. This responsibility lies with individual libraries or applications; the `BaseError` class is intended to be a general-purpose foundation.
- Normalize stack traces or messages from native errors. Such normalization can introduce significant complexity, increase the bundle size of interface implementations, and is more effectively handled server-side during logging or reporting if required.

## Guidance

- The `BaseError` class must extend the native `Error` class.
- `BaseError` must accept `message` and `cause` parameters, similar to the native `Error`.
- `BaseError` must accept additional parameters, which can be strongly typed within its subclasses.
- `BaseError` must accept an optional `fingerprint` string parameter for unique error instance identification.
- `BaseError` must provide an `extend` method to facilitate the creation of error subclasses tailored to specific domains.
- The `extend` method must accept a name and return a new class with the given name.

## TypeScript Definitions

```typescript
/**
 * A BaseError class instance with additional metadata.
 */
interface BaseError<T = unknown> extends Error {
    /**
     * Contains additional structured, strongly-typed metadata associated with the error.
     */
    readonly additional: [T] extends [never] ? undefined : T;

    /**
     * An optional, unique identifier for this error instance.
     * This identifier can be utilized for grouping similar errors within logging and monitoring systems.
     * For instance, it could be a hash generated from the error message and the primary stack frame,
     * or a predefined string representing a specific error category.
     */
    readonly fingerprint: string | undefined;
}

/**
 * Additional options passed to the BaseError constructor.
 */
interface BaseErrorOptions<T = unknown> extends ErrorOptions {
    /**
     * Optional additional structured, strongly-typed metadata associated with the error.
     */
    additional?: T;

    /**
     * An optional, unique identifier for this error instance.
     * This identifier can be utilized for grouping similar errors within logging and monitoring systems.
     * For instance, it could be a hash generated from the error message and the primary stack frame,
     * or a predefined string representing a specific error category.
     */
    fingerprint?: string;
}

/**
 * BaseError options with a required `additional` property.
 * This variant of `BaseErrorOptions` ensures that the `additional` metadata is mandatory.
 * @typeParam T The type of the required `additional` metadata.
 */
type BaseErrorOptionsWithAdditional<T> = Omit<BaseErrorOptions<T>, "additional"> & {
    /**
     * Additional structured, strongly-typed metadata associated with the error.
     */
    additional: T;
};

/**
 * Conditional type that determines the constructor arguments for BaseError based on the `Additional` type parameter.
 * - If `Additional` is `never`, both `message` and `options` are optional.
 * - If `Additional` is `undefined`, both `message` and `options` are optional.
 * - Otherwise, `message` is required (or explicitly `undefined`) and `options` with a required `additional` property must be provided.
 * @typeParam Additional The type of the `additional` metadata that affects the constructor signature.
 */
type BaseErrorConstructorArgs<Additional> = [Additional] extends [never]
    ? [message?: string, options?: BaseErrorOptions<Additional>]
    : [undefined] extends [Additional]
      ? [message?: string, options?: BaseErrorOptions<Additional>]
      : [message: string | undefined, options: BaseErrorOptionsWithAdditional<Additional>];

/**
 * Defines the constructor for the BaseError class and its static `extend` method.
 * This interface ensures that any class implementing or representing `BaseError`
 * offers a consistent mechanism for instantiation and extension.
 * @typeParam Additional The type of the `additional` metadata for this error constructor.
 */
interface BaseErrorConstructor<Additional = never> {
    /**
     * Creates an instance of BaseError.
     * @param args Constructor arguments consisting of a message and optional options object.
     *             The specific signature depends on the `Additional` type parameter.
     * @returns A new `BaseError` instance.
     */
    new (...args: BaseErrorConstructorArgs<Additional>): BaseError<Additional>;

    /**
     * Creates a new error class that implements `BaseError`, featuring a specific name and metadata type.
     * @typeParam T The type definition for the `additional` metadata in the extended error class.
     * @param name The designated name for the new error class.
     * @returns A new error class constructor that implements `BaseError`.
     */
    extend<T = Additional>(name: string): BaseErrorConstructor<T>;
}
```

## Rationale

### Inheritance from the Native Error Class

Extending the native `Error` class ensures that `BaseError` objects inherently include a stack trace, a critical component for debugging and pinpointing the origin of an error. This approach also allows existing JavaScript code to interact seamlessly with these custom errors, for example, by using `instanceof` checks or utility functions like `Error.isError()`.

### Creating Subclasses from BaseError

Subclassing `BaseError` empowers developers to add semantic meaning and enforce strong typing for additional error metadata. This practice leads to clearer, more maintainable code and facilitates enhanced tooling support (e.g., autocompletion and type checking in IDEs).

### Adding the `additional` Property

The error object serves as a comprehensive container for all information relevant to diagnosing and logging an error. Frequently, the stack trace and message alone are insufficient for thorough analysis. Therefore, the capability to store supplementary context (such as request IDs, user information, or operational details) is crucial for effective error handling.

Often, such supplementary information is transmitted directly to the error logging system. However, this direct transmission is not always feasible, as the point where an error originates and the point where it is logged can be decoupled. Consequently, embedding additional information within the error instance at the time of its creation is highly advantageous, as all necessary contextual data is typically available at that moment.

### Adding the `fingerprint` Property

The `fingerprint` property provides a unique identifier for an error instance. This is particularly useful in monitoring and logging systems for grouping similar errors, which simplifies their analysis and tracking. For example, a `fingerprint` could be a hash generated from the error message and the primary stack frame, or a predefined string representing a specific error category.

Using `fingerprint` allows for:

- **Error Grouping**: Monitoring systems can use the `fingerprint` to consolidate identical or similar errors, even if they occur in different parts of the application or at different times. This helps in assessing the frequency and impact of a specific issue.
- **Error Deduplication**: Prevents multiple alerts for the same error, reducing informational noise.
- **Rate Limiting**: Enables setting notification limits for each error group (identified by `fingerprint`) to avoid overwhelming the alert system.
- **Implementing Specific Error Handling Patterns**: For instance, automatically assigning priority or an owner for fixing a group of errors.

## Adoption Guide

### Consuming the Interface in Libraries

TODO: accept BaseErrorConstructor as configuration option
TODO: consume BaseErrorConstructor via DI

### Consuming the Interface in Application Code

Applications can use an `BaseError` instance (obtained via dependency injection or direct instantiation) to handle errors.

```typescript
function handleError(error: BaseError) {
    console.error({
        name: error.name,
        message: error.message,
        stack: error.stack,
        additional: error.additional,
    });

    if (error.cause) {
        console.error("Caused by:", error.cause);
    }
}
```

Applications can use an `BaseErrorConstructor` class to create errors.

```typescript
throw new BaseError("Something happened", {
    additional: { foo: "bar" },
    fingerprint: "example",
});
```

### Example: Creating Custom Error Subclasses

```typescript
const UnexpectedError = BaseError.extend<undefined>("UnexpectedError");

interface NetworkErrorDetails {
    request: Request;
    statusCode: number | undefined;
    response?: Response | undefined;
}

const NetworkError = BaseError.extend<NetworkErrorDetails>("NetworkError");
```

### Example: Ensuring error instance in try-catch blocks

```typescript
try {
    throw "Missing file path.";
} catch (error) {
    // Normalized from a string to a `BaseError` instance
    throw new BaseErrorImpl("Failed due to an unexpected issue.", {
        cause: error,
    });
}
```

### Implementing the Interface

Library authors can implement the `BaseError` interface as demonstrated in the example below. A library is free to introduce additional capabilities, provided they do not conflict with or alter the proposed behavior of `BaseError` and `BaseErrorContructor`.

```typescript
class BaseErrorImpl<T> extends Error implements BaseError<T> {
    public readonly additional: T;
    public readonly fingerprint: string | undefined;

    constructor(message?: string | undefined, options?: BaseErrorOptions<T>) {
        super(message, { cause: options?.cause });

        this.name = "BaseError";
        this.additional = options?.additional as T;
        this.fingerprint = options?.fingerprint;

        Object.setPrototypeOf(this, new.target.prototype);
    }

    public static extend<T>(name: string) {
        const ErrorClass = class extends BaseErrorImpl<T> {
            constructor(message?: string | undefined, options?: BaseErrorOptions<T>) {
                super(message, options);
                this.name = name;
            }
        };

        return ErrorClass;
    }
}
```

## FAQ (Frequently Asked Questions)

- **Q: Why not just use the native Error class?**
    - A: The native `Error` class lacks built-in support for structured metadata. This limitation makes it difficult to attach and subsequently retrieve the rich contextual information often required for comprehensive diagnostics and effective logging.

- **Q: Is this compatible with existing error handling code?**
    - A: Yes. Since `BaseError` extends the native `Error` class, it remains compatible with existing error handling mechanisms, including `instanceof` checks and standard error handling patterns.

## Unresolved Questions / Future Considerations

- Should we provide utility functions for serialization/deserialization?
- Should we standardize error codes or categories?
- Should we support TypeScript targets older than ES2022? Supporting older targets would necessitate polyfilling the `cause` property for `Error` objects.

## Prior Art / References

- [node-verror](https://github.com/joyent/node-verror)
- [modern-errors](https://github.com/ehmicky/modern-errors)

## Compatible Implementations / Projects Using This Interface

- None

## Projects Using This Interface

- Information about usage is currently unknown.

## Changelog

All notable changes to this proposal will be documented in this section.

### 2025-05-07

- Initial draft
