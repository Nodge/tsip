/**
 * A standard interface for logging error instances.
 */
export interface ErrorLogger {
    /**
     * Logs an informational error.
     * These are typically errors that do not disrupt the application's normal flow but are worth noting.
     * @typeParam T The type of the error
     * @param error The error instance to log.
     */
    info<T>(error: [unknown] extends [T] ? T : Error): void;

    /**
     * Logs a warning error.
     * These indicate potential problems or unexpected situations that are not critical
     * but might lead to issues if not addressed.
     * @typeParam T The type of the error
     * @param error The error instance to log.
     */
    warn<T>(error: [unknown] extends [T] ? T : Error): void;

    /**
     * Logs a general error.
     * These are typically runtime errors that disrupt a specific operation
     * but may not halt the entire application.
     * @typeParam T The type of the error
     * @param error The error instance to log.
     */
    error<T>(error: [unknown] extends [T] ? T : Error): void;

    /**
     * Logs a fatal error.
     * These are critical errors that usually precede an application shutdown or an unrecoverable state.
     * It is intended to be logged just before the process exits or browser tab shows error screen.
     * @typeParam T The type of the error
     * @param error The error instance to log.
     */
    fatal<T>(error: [unknown] extends [T] ? T : Error): void;
}
