# Contributing

We welcome contributions from the community! Whether you're refining existing proposals, suggesting new interfaces, or improving documentation, your input helps make TypeScript development better for everyone.

## Ways to Contribute

### 💡 Propose New Interfaces

Use our [`PROPOSAL_TEMPLATE.md`](./PROPOSAL_TEMPLATE.md) to suggest standardized interfaces for common TypeScript patterns. We're particularly interested in:

- Common utility interfaces that appear across multiple projects
- Standardized error handling patterns
- Configuration and options interfaces
- Plugin and middleware abstractions

### 🔍 Review & Improve Existing Proposals

Help refine existing proposals by:

- Providing feedback on interface design and naming
- Suggesting improvements or identifying edge cases
- Testing proposals in real-world scenarios
- Contributing additional usage examples

### 📚 Enhance Documentation

Improve the clarity and usefulness of our documentation:

- Add practical usage examples
- Clarify explanations and rationale
- Improve code samples and demonstrations
- Fix typos and formatting issues

### 🐛 Report Issues

Found a problem or have questions? Please:

- Open an issue to discuss proposals or report problems
- Use clear, descriptive titles and provide context
- Include code examples when relevant

## Making Changes

This project uses [changesets](https://github.com/changesets/changesets) to manage versions and generate changelogs for the `@tsip/types` npm package.

1. Fork the repository and create a new branch for your changes
2. Make your changes to the codebase
3. Add a changeset to describe your changes:

```bash
pnpm changeset
```

This will prompt you to:

- Select the type of change (patch, minor, or major)
- Write a summary of the changes (this will appear in the changelog)

4. Commit the changeset along with your changes
5. Create a pull request
