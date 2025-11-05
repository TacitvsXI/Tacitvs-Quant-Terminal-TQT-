# 🧪 TQT Frontend Tests

Testing suite for TQT frontend (Next.js + React + TypeScript).

## 📂 Structure

```
tests/
├── setup.ts                    # Jest/Testing Library setup
├── components/
│   ├── VolumeProfileChart.test.tsx
│   └── MarketStatePanel.test.tsx
├── integration/
│   └── (integration tests)
└── e2e/
    └── volume_profile_e2e.spec.ts
```

## 🚀 Running Tests

### Install dependencies
```bash
cd apps/ui
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install --save-dev @playwright/test jest jest-environment-jsdom @swc/jest
npm install --save-dev jest-canvas-mock
```

### Run unit/integration tests (Jest)
```bash
npm test
```

### Run with watch mode
```bash
npm test -- --watch
```

### Run specific test file
```bash
npm test -- VolumeProfileChart.test.tsx
```

### Run with coverage
```bash
npm test -- --coverage
```

### Run E2E tests (Playwright)
```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npx playwright test

# Run with UI
npx playwright test --ui

# Run specific test
npx playwright test volume_profile_e2e.spec.ts

# Debug mode
npx playwright test --debug
```

## 🎭 Playwright Test Reports

After running E2E tests:

```bash
# View HTML report
npx playwright show-report
```

## 📊 Test Types

### Unit Tests (Jest + Testing Library)
- Test individual components in isolation
- Mock external dependencies
- Fast execution
- Located in `tests/components/`

### Integration Tests
- Test component interactions
- Test API client functions
- May use real API (mocked responses)
- Located in `tests/integration/`

### E2E Tests (Playwright)
- Test complete user workflows
- Run in real browser
- Test across different browsers
- Located in `tests/e2e/`

## 🧩 Writing Tests

### Component Test Example

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import MyComponent from '@/components/MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
  
  it('handles user interaction', async () => {
    render(<MyComponent />)
    
    const button = screen.getByRole('button')
    await userEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText('Updated')).toBeInTheDocument()
    })
  })
})
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test'

test('user can do something', async ({ page }) => {
  await page.goto('/LAB')
  
  await page.click('[data-testid="button"]')
  
  await expect(page.locator('[data-testid="result"]')).toBeVisible()
})
```

## 🎯 Coverage Goals

- **Components**: >80% coverage
- **Utils/Lib**: >90% coverage
- **Overall**: >80% code coverage

View coverage report:
```bash
npm test -- --coverage
open coverage/lcov-report/index.html
```

## 🛠️ Test Utilities

### Testing Library Queries

```typescript
// By text
screen.getByText('Submit')
screen.queryByText('Optional')  // Returns null if not found
screen.findByText('Async')      // Returns promise

// By role
screen.getByRole('button')
screen.getByRole('textbox', { name: 'Username' })

// By test ID
screen.getByTestId('volume-profile-histogram')

// By label
screen.getByLabelText('Email')
```

### User Interactions

```typescript
import userEvent from '@testing-library/user-event'

// Click
await userEvent.click(button)

// Type
await userEvent.type(input, 'text to type')

// Select
await userEvent.selectOptions(select, 'option1')

// Hover
await userEvent.hover(element)
```

### Async Testing

```typescript
// Wait for element
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument()
})

// Wait for disappearance
await waitForElementToBeRemoved(() => screen.queryByText('Loading'))
```

## 🎭 Playwright Tips

### Locators

```typescript
// By test ID (preferred)
page.locator('[data-testid="element"]')

// By text
page.locator('text=Submit')

// By role
page.locator('role=button[name="Submit"]')

// Chaining
page.locator('.container').locator('button')
```

### Assertions

```typescript
// Visibility
await expect(element).toBeVisible()
await expect(element).toBeHidden()

// Text content
await expect(element).toHaveText('Expected')
await expect(element).toContainText('Partial')

// Attributes
await expect(element).toHaveAttribute('data-price', '30000')

// Count
await expect(page.locator('.item')).toHaveCount(5)
```

### Waiting

```typescript
// Wait for selector
await page.waitForSelector('[data-testid="loaded"]')

// Wait for response
await page.waitForResponse(response =>
  response.url().includes('/api/data') && response.status() === 200
)

// Wait for load state
await page.waitForLoadState('networkidle')
```

## 🐛 Debugging

### Jest Tests

```bash
# Debug in VS Code
# Set breakpoint, then F5 with Jest configuration

# Or use --runInBand
npm test -- --runInBand
```

### Playwright Tests

```bash
# Debug mode (opens Inspector)
npx playwright test --debug

# Headed mode (see browser)
npx playwright test --headed

# Slow motion
npx playwright test --slow-mo=1000
```

### Screenshots/Videos

Playwright automatically captures:
- Screenshots on failure
- Videos on failure (can configure for always)
- Traces for debugging

Located in `test-results/` directory.

## 🔧 Mocking

### Mock API responses

```typescript
// Jest
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ data: 'mocked' })
  })
)

// Playwright
await page.route('/api/volume_profile*', route => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ poc: { price: 30000 } })
  })
})
```

### Mock components

```typescript
// In test file
jest.mock('@/components/Chart', () => {
  return function MockChart() {
    return <div data-testid="mock-chart">Mocked Chart</div>
  }
})
```

## 🎨 Best Practices

1. **Use data-testid for stable selectors**
   ```tsx
   <button data-testid="submit-button">Submit</button>
   ```

2. **Prefer user-centric queries**
   - `getByRole` > `getByLabelText` > `getByTestId`

3. **Don't test implementation details**
   - Test what user sees/does
   - Not internal state or methods

4. **Keep tests independent**
   - Each test should run in isolation
   - No shared state between tests

5. **Use meaningful test descriptions**
   ```typescript
   it('should display error when API fails', () => {})
   ```

## 🔄 CI/CD

Tests run automatically in GitHub Actions:
- Unit/Integration tests on every push
- E2E tests on PR to main
- Coverage reports uploaded to Codecov

## 📚 Resources

- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright](https://playwright.dev/docs/intro)
- [Jest](https://jestjs.io/docs/getting-started)
- [Next.js Testing](https://nextjs.org/docs/testing)



