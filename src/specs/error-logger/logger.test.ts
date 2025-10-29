import { describe, it, vi } from "vitest";
import type { ErrorLogger } from "./logger";

const logger: ErrorLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
};

describe("BaseError", () => {
    it("should accept error instance", () => {
        logger.error(new Error());
        logger.error(new TypeError());
    });

    it("should not accept strings", () => {
        logger.error(
            // @ts-expect-error should not accept string
            "message",
        );
        logger.error(
            // @ts-expect-error should not accept number
            123,
        );
        logger.error(
            // @ts-expect-error should not accept object
            { message: "test" },
        );
    });

    it("should accept any value with unknown type", () => {
        logger.error("message" as unknown);
        logger.error(123 as unknown);
        logger.error({} as unknown);
    });
});
