# TSIP-XXXX: [Proposal Title]

- **Status**: `draft` | `preview` | `stable`
    - `draft`: Initial idea, under discussion.
    - `preview`: Feature-complete, seeking feedback and early adoption.
    - `stable`: Considered finalized. At least one implementation available.
- **Authors**:
    - [Author Name 1](link to profile)
    - [Author Name 2](link to profile)

## Abstract

(A brief, one-to-two paragraph summary of the proposal. What is it and why is it important?)

## Motivation

(Describe the problem this proposal aims to solve. Why is this interface needed? What pain points does it address for developers? You can reference the "The Problem We Solve" section from the main `README.md`.)

## Design Goals

### Goals

- (What are the primary objectives of this interface?)
- (e.g., Improve interoperability between X and Y.)
- (e.g., Simplify common task Z.)

### Non-Goals

- (What is explicitly out of scope for this interface?)
- (e.g., This interface does not attempt to solve problem A.)
- (e.g., Performance optimization beyond reasonable defaults is not a primary goal.)

## TypeScript Definitions

(Provide the complete TypeScript declarations for the interface(s) being proposed. Ensure it's well-documented.)

```typescript
// Example:
export interface MyNewInterface {
    /**
     * A brief description of this property.
     */
    property: string;

    /**
     * A brief description of this method.
     * @param param A description of the parameter.
     * @returns A description of the return value.
     */
    method: (param: number) => boolean;
}
```

## Behavioral Requirements

(Specify the precise requirements that any implementation of this interface must satisfy. Use numbered lists for clarity. Include requirements about:

- How the interface components must behave
- Expected properties and their types
- Method signatures and their behavior
- Edge cases and error handling
- Compatibility requirements)

Example structure:

1. **[Requirement Category]**: [Description of what MUST happen]
    - Sub-requirement details
    - Type-specific behaviors

2. **[Another Category]**: [Description]
    - When `TypeParam` is X: behavior MUST be Y
    - Otherwise: behavior MUST be Z

## Rationale

(Explain the key design decisions made in this proposal. Why were certain choices made over alternatives? What trade-offs were considered? This section helps others understand the thinking behind the proposal.)

### [Description of decision]

[Why this was chosen]

## Adoption Guide

### Consuming the Interface in Libraries

(Explain how library authors can consume and use this interface. Include practical code examples showing different integration patterns.)

### Consuming the Interface in Application Code

(Explain how application developers can use this interface. Provide concrete examples of common use cases.)

## FAQ (Frequently Asked Questions)

(Address potential questions that might arise regarding the proposal, its implementation, or its use cases. This can be populated from discussions during the review process.)

- **Q: [Question 1]?**
    - A: [Answer 1]
- **Q: [Question 2]?**
    - A: [Answer 2]

## Unresolved Questions / Future Considerations

(List any open questions, areas for future improvement, or related features that are not covered by the current proposal but might be addressed later.)

- [Question/Consideration 1]

## Prior Art / References

(List any existing libraries, specifications, articles, or discussions that inspired or are related to this proposal.)

- [Link to related work 1]
- [RFC or Standard X]

## Compatible Implementations

(A list of known libraries, frameworks, or projects that have adopted, are compatible with, or are using this interface proposal. This helps users find real-world examples and encourages adoption.)

- [Library 1](link) - (Brief description of how it implements the proposal)
- [Library 2](link)

## Projects Using This Interface

(A list of known libraries, frameworks, or projects that have adopted, are compatible with, or are using this interface proposal. This helps users find real-world examples and encourages adoption.)

- [Project 1](link) - (Brief description of how it uses the interface)
- [Project 2](link)
