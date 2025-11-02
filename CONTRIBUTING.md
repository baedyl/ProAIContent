# 🤝 Contributing to ProAIContent

Thank you for considering contributing to ProAIContent! We welcome contributions from everyone.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Commit Messages](#commit-messages)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community

**Unacceptable behavior includes:**
- Harassment or discriminatory language
- Trolling or insulting comments
- Public or private harassment
- Publishing others' private information

---

## How Can I Contribute?

### 🐛 Reporting Bugs

Before creating a bug report:
1. Check existing issues to avoid duplicates
2. Update to the latest version and see if the issue persists
3. Collect relevant information (browser, Node version, etc.)

**Bug Report Template:**

```markdown
**Description:**
A clear description of the bug.

**Steps to Reproduce:**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior:**
What you expected to happen.

**Actual Behavior:**
What actually happened.

**Environment:**
- OS: [e.g., macOS 13]
- Browser: [e.g., Chrome 119]
- Node.js: [e.g., 18.17.0]
- Version: [e.g., 1.0.0]

**Screenshots:**
If applicable, add screenshots.

**Additional Context:**
Any other relevant information.
```

### 💡 Suggesting Features

Feature suggestions are welcome! Please provide:

1. **Clear description** of the feature
2. **Use case** - why is it useful?
3. **Examples** - how would it work?
4. **Alternatives** - have you considered other solutions?

**Feature Request Template:**

```markdown
**Feature Description:**
A clear description of the feature.

**Use Case:**
Why would this be useful?

**Proposed Solution:**
How should it work?

**Alternatives Considered:**
Other approaches you've thought about.

**Additional Context:**
Any other relevant information.
```

### 🔧 Code Contributions

We love code contributions! Here's how:

1. **Fork the repository**
2. **Create a branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Test thoroughly**
5. **Commit your changes** (see commit guidelines)
6. **Push to your fork** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

---

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- OpenAI API key

### Setup Steps

1. **Fork and clone the repository:**

```bash
git clone https://github.com/your-username/ProAIContent.git
cd ProAIContent
```

2. **Install dependencies:**

```bash
npm install
```

3. **Set up environment variables:**

```bash
cp .env.local.example .env.local
# Edit .env.local with your OpenAI API key
```

4. **Start development server:**

```bash
npm run dev
```

5. **Run linting:**

```bash
npm run lint
```

### Project Structure

```
ProAIContent/
├── app/                     # Next.js app directory
│   ├── api/                 # API routes
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Main page
│   └── globals.css          # Global styles
├── components/              # React components
├── lib/                     # Utility libraries
├── public/                  # Static assets
└── [config files]           # Various config files
```

---

## Pull Request Process

### Before Submitting

- [ ] Code follows the style guidelines
- [ ] All tests pass
- [ ] No linting errors
- [ ] Documentation is updated
- [ ] Commit messages follow guidelines
- [ ] PR description is clear and complete

### PR Description Template

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
How has this been tested?

## Screenshots
If applicable.

## Related Issues
Fixes #(issue number)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added where needed
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
- [ ] All tests passing
```

### Review Process

1. **Automated checks** run first
2. **Maintainer review** within 48 hours
3. **Feedback and iterations** as needed
4. **Merge** once approved

---

## Style Guidelines

### TypeScript/JavaScript

- Use **TypeScript** for type safety
- Follow **functional programming** principles
- Use **const** and **let**, not **var**
- Use **arrow functions** for callbacks
- Prefer **async/await** over promises

**Example:**

```typescript
// ✅ Good
const fetchData = async (id: string): Promise<Data> => {
  const response = await fetch(`/api/data/${id}`)
  return response.json()
}

// ❌ Avoid
var fetchData = function(id) {
  return fetch('/api/data/' + id).then(function(response) {
    return response.json()
  })
}
```

### React Components

- Use **functional components**
- Use **hooks** for state and effects
- Extract **custom hooks** for reusable logic
- Keep components **small and focused**

**Example:**

```typescript
// ✅ Good
export default function MyComponent({ title }: { title: string }) {
  const [count, setCount] = useState(0)
  
  return (
    <div>
      <h1>{title}</h1>
      <p>Count: {count}</p>
    </div>
  )
}
```

### CSS/Tailwind

- Use **Tailwind CSS** utility classes
- Extract common patterns to **CSS components**
- Maintain **responsive design**
- Follow **mobile-first** approach

**Example:**

```tsx
// ✅ Good
<button className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors">
  Click Me
</button>
```

### File Naming

- **Components:** PascalCase (`MyComponent.tsx`)
- **Utilities:** camelCase (`myUtility.ts`)
- **Styles:** kebab-case (`my-styles.css`)
- **Tests:** `*.test.ts` or `*.spec.ts`

---

## Commit Messages

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat:** New feature
- **fix:** Bug fix
- **docs:** Documentation changes
- **style:** Code style changes (formatting, etc.)
- **refactor:** Code refactoring
- **test:** Adding or updating tests
- **chore:** Maintenance tasks

### Examples

```bash
# Good commit messages
feat(generator): add support for custom templates
fix(api): resolve rate limiting issue
docs(readme): update installation instructions
style(components): format with prettier
refactor(seo): extract keyword analysis to separate function
test(api): add unit tests for generation endpoint
chore(deps): update dependencies

# Bad commit messages
fix stuff
update code
changes
wip
```

### Guidelines

- Use **present tense** ("add feature" not "added feature")
- Use **imperative mood** ("move cursor to" not "moves cursor to")
- Keep first line **under 72 characters**
- Capitalize first letter
- No period at the end
- Provide **context** in the body if needed

---

## Testing

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

- Write tests for **all new features**
- Maintain **high test coverage**
- Use **descriptive test names**
- Follow **AAA pattern** (Arrange, Act, Assert)

**Example:**

```typescript
describe('ContentGenerator', () => {
  it('should generate blog post with correct format', async () => {
    // Arrange
    const input = { topic: 'Test Topic', type: 'blog' }
    
    // Act
    const result = await generateContent(input)
    
    // Assert
    expect(result).toBeDefined()
    expect(result.content).toContain('# Test Topic')
  })
})
```

---

## Documentation

### Code Comments

- Use comments for **complex logic** only
- Prefer **self-documenting code**
- Use **JSDoc** for public APIs

**Example:**

```typescript
/**
 * Generate AI-powered content based on specifications
 * 
 * @param {GenerateRequest} data - Content generation parameters
 * @returns {Promise<GeneratedContent>} - Generated content with metadata
 * @throws {Error} - If generation fails or API key is invalid
 */
export async function generateContent(data: GenerateRequest): Promise<GeneratedContent> {
  // Implementation
}
```

### Documentation Files

When adding features, update:
- **README.md** - if user-facing
- **FEATURES.md** - for new features
- **API_DOCUMENTATION.md** - for API changes
- **CHANGELOG.md** - for all changes

---

## Questions?

- **General questions:** Open a discussion
- **Bug reports:** Open an issue
- **Feature requests:** Open an issue
- **Security issues:** Email privately (see SECURITY.md)

---

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to ProAIContent!** 🎉

Every contribution, no matter how small, makes a difference!


