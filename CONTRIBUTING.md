# Contributing to AI Integration Course

Thank you for your interest in contributing to the AI Integration Course platform! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Submitting Changes](#submitting-changes)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please be respectful and professional in all interactions.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 20.x (LTS)
  - The project includes a `.nvmrc` file for automatic version selection with nvm
  - Install: `nvm install 20 && nvm use 20`
- npm 11.x or higher
- Git
- A GitHub account

### Setting Up Your Development Environment

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/ai-integration-course.git
   cd ai-integration-course
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd functions && npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Firebase and API credentials
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

### Project Structure

```
ai-integration-course/
├── src/                    # React frontend source code
│   ├── components/        # Reusable UI components
│   ├── pages/            # Page components
│   ├── context/          # React Context providers
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── api/                   # Node serverless proxy handlers
├── functions/            # Firebase Cloud Functions
├── lessons/              # Course content (Markdown)
├── .github/              # GitHub configuration and workflows
└── public/               # Static assets
```

## Development Workflow

### Branching Strategy

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow existing code patterns
   - Add comments for complex logic

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "type: brief description"
   ```

4. **Keep your branch up to date**
   ```bash
   # Use our helper script to sync with main
   bash scripts/sync-with-main.sh
   
   # Or manually:
   git fetch origin main
   git merge origin/main
   ```

### Syncing with Main Branch

To ensure your branch stays up to date with the latest changes:

1. **Using the sync script** (recommended)
   ```bash
   bash scripts/sync-with-main.sh
   ```
   This will:
   - Fetch latest changes from main
   - Show you what's different
   - Prompt before merging
   - Report any conflicts

2. **Manual sync**
   ```bash
   git fetch origin main
   git log --oneline origin/main...HEAD  # See differences
   git merge origin/main
   ```

3. **Handling conflicts**
   - If conflicts occur, Git will mark them in the affected files
   - Resolve conflicts manually
   - Stage resolved files: `git add <file>`
   - Complete the merge: `git commit`

For more details, see [`.github/PULL_LATEST_CHANGES.md`](.github/PULL_LATEST_CHANGES.md)

### Commit Message Convention

We use conventional commits for clear and structured commit history:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```bash
git commit -m "feat: add AI tutor streaming response"
git commit -m "fix: resolve authentication redirect issue"
git commit -m "docs: update README with new features"
```

## Coding Standards

### TypeScript/JavaScript

- **Use TypeScript** for all new code
- **Define interfaces** for all props and complex objects
- **Use functional components** with hooks (no class components)
- **Follow existing patterns** in the codebase

Example component structure:
```typescript
interface ComponentProps {
  title: string;
  onAction: () => void;
}

export default function MyComponent({ title, onAction }: ComponentProps) {
  const [state, setState] = useState<string>('');
  
  return (
    <div className="container">
      {/* Component JSX */}
    </div>
  );
}
```

### React Best Practices

- **Use hooks appropriately**: `useState`, `useEffect`, `useContext`, etc.
- **Avoid prop drilling**: Use Context API for global state
- **Memoize expensive calculations**: Use `useMemo` and `useCallback`
- **Handle loading and error states**: Always provide user feedback

### Styling

- **Use TailwindCSS** utility classes as the primary styling approach
- **Follow mobile-first** responsive design principles
- **Use custom CSS** only when TailwindCSS doesn't suffice
- **Maintain consistent spacing** using Tailwind's spacing scale

### AI Integration

When working with AI features:

1. **API Key Security**: Never expose API keys in client-side code
2. **Error Handling**: Implement robust error handling for AI API calls
3. **Cost Management**: Be mindful of token usage and implement limits
4. **User Experience**: Use streaming responses for better UX
5. **Content Validation**: Validate and sanitize AI-generated content

### Firebase Integration

- **Security Rules**: Always update security rules when changing data structure
- **Efficient Queries**: Use indexes for complex queries
- **Error Handling**: Handle Firebase errors gracefully
- **Authentication**: Verify user authentication on all protected operations

## Submitting Changes

### Before Submitting

1. **Test your changes**
   ```bash
   npm test
   npm run build
   ```

2. **Lint your code**
   ```bash
   npm run lint
   ```

3. **Update documentation** if needed

### Creating a Pull Request

1. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open a Pull Request** on GitHub
   - Use a clear, descriptive title
   - Fill out the PR template completely
   - Reference related issues (e.g., "Fixes #123")
   - Add screenshots for UI changes
   - Describe testing performed

3. **Respond to feedback**
   - Address review comments promptly
   - Make requested changes
   - Ask questions if anything is unclear

### Pull Request Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] No new warnings or errors
- [ ] Screenshots included (for UI changes)

## Testing Guidelines

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Writing Tests

- **Test business logic**: Focus on critical functionality
- **Mock external dependencies**: Firebase, OpenAI, etc.
- **Use descriptive test names**: Clearly state what is being tested
- **Test edge cases**: Include error scenarios and boundary conditions

Example test structure:
```typescript
import { describe, it, expect, vi } from 'vitest';

describe('ComponentName', () => {
  it('should render correctly', () => {
    // Test implementation
  });
  
  it('should handle user interaction', () => {
    // Test implementation
  });
  
  it('should handle errors gracefully', () => {
    // Test implementation
  });
});
```

### Testing AI Features

When testing AI integrations:
- Mock OpenAI API responses
- Test chunking and embedding logic
- Verify cost guard mechanisms
- Test streaming response handling
- Verify error handling

## Documentation

### Code Documentation

- Add JSDoc comments for complex functions
- Document component props with TypeScript interfaces
- Include usage examples for reusable components
- Explain non-obvious logic with inline comments

### README and Guides

When updating documentation:
- Keep instructions clear and concise
- Include code examples
- Update screenshots if UI changed
- Test all commands and steps
- Link to relevant resources

## Special Considerations

### Premium Features

When working with premium content:
- Test both free and premium user experiences
- Verify subscription status checks
- Ensure proper access control
- Handle edge cases (expired subscriptions, etc.)

### AI Tutor System

When modifying the AI tutor:
- Test with various lesson content
- Verify citation formatting
- Check token usage and costs
- Test streaming functionality
- Ensure proper error messages

### Security

Always consider security implications:
- Never commit API keys or secrets
- Validate all user inputs
- Use Firebase security rules
- Implement rate limiting where appropriate
- Follow authentication best practices

## Getting Help

If you need help or have questions:

1. **Check existing documentation**: README, guides, and code comments
2. **Search existing issues**: Someone may have asked the same question
3. **Open a discussion**: Use GitHub Discussions for general questions
4. **Open an issue**: For bugs or feature requests
5. **Contact maintainers**: Reach out to @Gnoscenti

## Recognition

Contributors will be recognized in the project's README and release notes. Thank you for helping make the AI Integration Course platform better!

## License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project.
