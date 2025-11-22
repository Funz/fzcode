# Contributing to Funz VSCode Extension

Thank you for your interest in contributing to the Funz VSCode Extension! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Coding Standards](#coding-standards)
- [Documentation](#documentation)

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code:

- Be respectful and inclusive
- Focus on constructive feedback
- Accept differing viewpoints
- Show empathy towards others
- Put the project's interests first

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Python 3.7+ with the `fz` package
- VSCode 1.85.0+
- Git

### Development Setup

1. **Fork and Clone**

   ```bash
   git clone https://github.com/YOUR_USERNAME/funz-vscode.git
   cd funz-vscode
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Install Funz**

   ```bash
   pip install fz
   # Or for development:
   git clone https://github.com/Funz/fz.git
   cd fz
   pip install -e .
   ```

4. **Open in VSCode**

   ```bash
   code .
   ```

5. **Run Extension**

   - Press `F5` to open Extension Development Host
   - The extension will be loaded in the new window

## Project Structure

```
funz-vscode/
├── src/
│   ├── extension.ts              # Extension entry point
│   ├── funz/
│   │   └── FunzService.ts        # Core Funz integration
│   ├── panels/
│   │   ├── FunzControlPanel.ts   # Control panel webview
│   │   └── FunzResultsViewer.ts  # Results viewer webview
│   ├── providers/
│   │   ├── FunzModelsProvider.ts # Tree view providers
│   │   ├── FunzVariablesProvider.ts
│   │   └── FunzResultsProvider.ts
│   └── utils/
│       └── getNonce.ts           # Utility functions
├── examples/                     # Example projects
├── resources/                    # Icons and assets
├── package.json                  # Extension manifest
├── tsconfig.json                 # TypeScript config
└── README.md                     # Documentation
```

### Key Components

- **FunzService**: Wraps Python CLI commands, handles execution
- **Panels**: Webview-based UI for complex interactions
- **Providers**: Tree views for sidebar navigation
- **Extension**: Main activation and command registration

## Making Changes

### Branching Strategy

- `main`: Stable, released code
- `develop`: Integration branch for features
- `feature/*`: Individual features
- `bugfix/*`: Bug fixes
- `docs/*`: Documentation updates

### Workflow

1. **Create a Branch**

   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make Changes**

   - Write clean, documented code
   - Follow existing patterns
   - Add tests where appropriate

3. **Test Your Changes**

   ```bash
   npm run compile
   npm test
   ```

4. **Commit**

   ```bash
   git add .
   git commit -m "feat: Add my feature"
   ```

   Use conventional commits:
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation
   - `refactor:` Code refactoring
   - `test:` Tests
   - `chore:` Maintenance

5. **Push and Create PR**

   ```bash
   git push origin feature/my-feature
   ```

   Then create a pull request on GitHub.

## Testing

### Manual Testing

1. **Run Extension Development Host** (`F5`)
2. **Test Checklist**:
   - [ ] Open Control Panel
   - [ ] Select template and model
   - [ ] Detect variables
   - [ ] Set variable values (single and array)
   - [ ] Compile template
   - [ ] Run simulation
   - [ ] View results
   - [ ] Export to CSV
   - [ ] Test sidebar views
   - [ ] Test context menus

### Automated Testing

```bash
# Lint code
npm run lint

# Run tests
npm test
```

### Testing with Real Funz Projects

Use the examples in `examples/` directory:

```bash
# Open example in new VSCode window
code examples/simple-math

# Test the extension with this example
```

## Submitting Changes

### Pull Request Guidelines

1. **Title**: Clear, descriptive title
   - ✅ "Add plot generation for results"
   - ❌ "Updates"

2. **Description**: Explain what and why
   - What problem does this solve?
   - How does it solve it?
   - Any breaking changes?
   - Screenshots (if UI changes)

3. **Checklist**:
   - [ ] Code compiles without errors
   - [ ] All tests pass
   - [ ] Documentation updated
   - [ ] CHANGELOG.md updated
   - [ ] No console warnings
   - [ ] Follows coding standards

4. **Review Process**:
   - Maintainer will review within 1 week
   - Address feedback promptly
   - Be open to discussion

### What Gets Merged

✅ **Will be merged:**
- Bug fixes with tests
- New features with documentation
- Performance improvements
- Documentation improvements
- Code quality improvements

❌ **Won't be merged:**
- Breaking changes without discussion
- Features without documentation
- Code that doesn't pass tests
- Code with linting errors
- Incomplete implementations

## Coding Standards

### TypeScript Style

```typescript
// Use clear, descriptive names
async function detectVariables(filePath: string, model: string): Promise<string[]> {
    // Document complex logic
    const result = await this.executeFunzCommand('fzi', [filePath, '--model', model]);

    // Use early returns for validation
    if (!result) {
        return [];
    }

    // Prefer const over let
    const variables = JSON.parse(result);

    return variables;
}

// Use interfaces for data structures
interface FunzVariable {
    name: string;
    value?: string | number | number[];
    type?: 'single' | 'array';
}
```

### Error Handling

```typescript
// Always handle errors appropriately
try {
    const result = await funzService.runSimulation(...);
    vscode.window.showInformationMessage('Success!');
} catch (error) {
    console.error('Simulation failed:', error);
    vscode.window.showErrorMessage(`Simulation failed: ${error}`);
}
```

### Webview Communication

```typescript
// Use typed messages
interface Message {
    type: string;
    data?: any;
}

// Sender
webview.postMessage({ type: 'variablesDetected', data: variables });

// Receiver
window.addEventListener('message', event => {
    const message = event.data as Message;
    switch (message.type) {
        case 'variablesDetected':
            handleVariables(message.data);
            break;
    }
});
```

### HTML/CSS in Webviews

```html
<!-- Use VSCode CSS variables -->
<style>
    body {
        color: var(--vscode-foreground);
        background: var(--vscode-editor-background);
    }

    button {
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
    }
</style>
```

### Comments

```typescript
// Use JSDoc for public APIs
/**
 * Detects variables in a Funz template file
 * @param filePath Path to the template file
 * @param model Name of the Funz model to use
 * @returns Array of variable names found
 */
async detectVariables(filePath: string, model: string): Promise<string[]> {
    // Implementation comments explain complex logic
    // Not every line needs a comment
}
```

## Documentation

### Code Documentation

- Document all public APIs with JSDoc
- Add inline comments for complex logic
- Keep comments up-to-date with code

### User Documentation

When adding features, update:

- `README.md`: User-facing features
- `DESIGN.md`: Architecture decisions
- `CHANGELOG.md`: Version history
- Examples: Add example if applicable

### Example Addition

If adding a new feature, consider adding an example:

```bash
mkdir examples/my-feature
# Add template, model, scripts, and README
```

## Feature Requests

### Proposing New Features

1. **Check existing issues** to avoid duplicates
2. **Open an issue** with:
   - Clear description of the feature
   - Use case / motivation
   - Proposed implementation (optional)
   - Mockups or examples (if UI feature)
3. **Discuss** with maintainers before implementing
4. **Implement** after getting approval

### Feature Priority

High priority:
- Bug fixes
- Performance improvements
- Usability enhancements
- Documentation

Medium priority:
- New features with clear use cases
- API improvements
- Test coverage

Low priority:
- Nice-to-have features
- Experimental features
- Breaking changes

## Bug Reports

### Reporting Bugs

Include:
- VSCode version
- Extension version
- Python version and fz package version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Console output (Help > Toggle Developer Tools)

### Fixing Bugs

1. Reference the issue in your commit: `fix: #123 - Description`
2. Add test to prevent regression
3. Update CHANGELOG.md

## Questions?

- Open an issue for questions
- Join discussions on GitHub
- Check existing documentation first

## Recognition

Contributors will be recognized in:
- CHANGELOG.md for their contributions
- README.md contributors section (coming soon)
- GitHub contributors page

Thank you for contributing to Funz VSCode Extension! 🚀
