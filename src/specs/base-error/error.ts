/**
 * A BaseError class instance with additional metadata.
 */
export interface BaseError<T = unknown> extends Error {
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
export interface BaseErrorOptions<T = unknown> extends ErrorOptions {
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
export interface BaseErrorConstructor<Additional = never> {
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
