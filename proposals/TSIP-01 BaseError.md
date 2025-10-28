# TSIP-01: BaseError Interface Proposal

- **Status**: `preview`
- **Authors**:
    - [Maksim Zemskov](https://github.com/nodge)

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

## Behavioral Requirements

1. **Inheritance**: The `BaseError` class MUST extend the native JavaScript `Error` class, ensuring compatibility with existing error handling mechanisms and providing a stack trace.

2. **Instance Properties**:
    - `message`: Inherited from `Error`, a string describing the error.
    - `name`: Inherited from `Error`, the name of the error class. For the base `BaseError` class, this MUST be `"BaseError"`. For classes created via the `extend()` method, this MUST be set to the `name` parameter passed to `extend()`.
    - `stack`: Inherited from `Error`, the stack trace.
    - `cause`: Inherited from `Error` (via `ErrorOptions`), an optional value representing the underlying cause of the error.
    - `additional`: A readonly property containing strongly-typed metadata. Its type depends on the `Additional` type parameter:
        - When `Additional` is `never`: The property MUST be `undefined` and cannot be set via constructor options.
        - Otherwise: The property type MUST match the `Additional` type parameter.
    - `fingerprint`: A readonly property of type `string | undefined`, providing a unique identifier for error grouping.

3. **Constructor Signature**: The constructor signature MUST vary based on the `Additional` type parameter:
    - When `Additional` is `never`: Both `message` and `options` parameters MUST be optional. The `additional` field MUST NOT be accepted in options.
    - When `Additional` includes `undefined` (e.g., `string | undefined`): Both `message` and `options` parameters MUST be optional. The `additional` field in options MUST be optional.
    - When `Additional` is a specific type (excluding `never` and not including `undefined`): The `message` parameter MUST be required (though it can be explicitly `undefined`), and `options` with a required `additional` field MUST be provided.

4. **Constructor Options**: The constructor MUST accept an optional `options` parameter of type `BaseErrorOptions<T>`, which includes:
    - `cause` (optional): Any value representing the underlying cause, inherited from `ErrorOptions`.
    - `additional` (optional or required based on type parameter): Strongly-typed metadata specific to the error.
    - `fingerprint` (optional): A string identifier for error grouping.

5. **Static `extend()` Method**: The `BaseError` class MUST provide a static `extend()` method with the following behavior:
    - Creates a new error class constructor that implements `BaseError`.
    - The `name` parameter MUST be used to set the `name` property of error instances created by the returned constructor.
    - When called without an explicit type parameter (e.g., `BaseError.extend("MyError")`): The new constructor MUST inherit the parent's `Additional` type. If the parent has `Additional = never`, the child MUST also have `Additional = never`.
    - When called with an explicit type parameter (e.g., `BaseError.extend<string>("MyError")`): The new constructor MUST use the specified type as its `Additional` type, overriding the parent's type.
    - The method MUST return a new `BaseErrorConstructor<T>` that can be used to instantiate errors and can itself be extended further via its own `extend()` method.

## Rationale

### Inheritance from the Native Error Class

Extending the native `Error` class ensures that `BaseError` objects inherently include a stack trace, a critical component for debugging and pinpointing the origin of an error. This approach also allows existing JavaScript code to interact seamlessly with these custom errors, for example, by using `instanceof` checks.

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

Libraries can accept a `BaseErrorConstructor` as a configuration option to allow consumers to provide their own error implementation:

```typescript
import type { BaseErrorConstructor } from "tsip";

interface LibraryConfig {
    BaseError: BaseErrorConstructor;
}

export function initLibrary(config: LibraryConfig) {
    const BaseError = config.BaseError;
    // Use BaseError to create errors in the library
}
```

Libraries can also consume `BaseErrorConstructor` via `tsip/runtime` dependency injection container:

```typescript
import { runtime, BaseErrorToken } from "tsip/runtime";

const BaseError = runtime.get(BaseErrorToken);
const RequestError = BaseError.extend<{ url: string }>("RequestError");

async function fetchData(url: string) {
    try {
        const response = await fetch(url);
        return response.json();
    } catch (error) {
        throw new RequestError("Network error occurred", {
            cause: error,
            additional: { url },
        });
    }
}
```

Libraries can also use the `BaseError` interface in their public API to accept TSIP-compatible errors.

```typescript
import type { BaseError } from "tsip";

export function logError(error: BaseError) {
    // ...
}
```

### Consuming the Interface in Application Code

Applications can import a `BaseError` implementation directly from a compatible library:

```typescript
import { BaseError } from "some-compatible-library";

const AppError = BaseError.extend<Record<string, unknown>>("AppError");

throw new AppError("Something happened", {
    additional: { foo: "bar" },
    fingerprint: "example",
});
```

Alternatively, applications can use the `tsip/runtime` dependency injection container:

```typescript
import { runtime, BaseErrorToken } from "tsip/runtime";

const BaseError = runtime.get(BaseErrorToken);
const AppError = BaseError.extend<Record<string, unknown>>("AppError");

throw new AppError("Something happened", {
    additional: { foo: "bar" },
    fingerprint: "example",
});
```

Applications can handle errors using the `BaseError` interface:

```typescript
import type { BaseError } from "tsip";

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

### Example: Creating Custom Error Subclasses

```typescript
const UnexpectedError = BaseError.extend("UnexpectedError");

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
    throw new BaseError("Failed due to an unexpected issue.", {
        cause: error,
    });
}
```

## FAQ (Frequently Asked Questions)

- **Q: Why not just use the native Error class?**
    - A: The native `Error` class lacks built-in support for structured metadata. This limitation makes it difficult to attach and subsequently retrieve the rich contextual information often required for comprehensive diagnostics and effective logging.

- **Q: Is this compatible with existing error handling code?**
    - A: Yes. Since `BaseError` extends the native `Error` class, it remains compatible with existing error handling mechanisms, including `instanceof` checks and standard error handling patterns.

## Unresolved Questions / Future Considerations

- Should we support TypeScript targets older than ES2022? Supporting older targets would necessitate polyfilling the `cause` property for `Error` objects.

## Prior Art / References

- [node-verror](https://github.com/joyent/node-verror)
- [modern-errors](https://github.com/ehmicky/modern-errors)

## Compatible Implementations

- None

## Projects Using This Interface

- Information about usage is currently unknown.
