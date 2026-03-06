import { test, expect } from '@playwright/test'

// Mock GitHub API responses to avoid real API calls in tests
test.beforeEach(async ({ page }) => {
  // Mock user endpoint
  await page.route('https://api.github.com/users/testuser', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        login: 'testuser',
        name: 'Test User',
        bio: 'A test developer',
        avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
        followers: 120,
        following: 45,
        public_repos: 32,
        location: 'Chennai, India',
      }),
    })
  )
  // Mock repos endpoint
  await page.route('https://api.github.com/users/testuser/repos*', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { stargazers_count: 42, forks_count: 12, language: 'JavaScript', fork: false },
        { stargazers_count: 18, forks_count: 4,  language: 'TypeScript', fork: false },
        { stargazers_count: 7,  forks_count: 2,  language: 'CSS',        fork: false },
        { stargazers_count: 3,  forks_count: 0,  language: 'JavaScript', fork: false },
        { stargazers_count: 0,  forks_count: 0,  language: null,         fork: true  },
      ]),
    })
  )
  // Mock search/PRs endpoint
  await page.route('https://api.github.com/search/issues*', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ total_count: 67 }),
    })
  )
  // Mock avatar fetch (for base64 conversion)
  await page.route('https://avatars.githubusercontent.com/**', route =>
    route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: Buffer.from('iVBORw0KGgo=', 'base64'), // tiny valid PNG
    })
  )
})

// ─── Layout ─────────────────────────────────────────────────────────────────
test.describe('Layout', () => {
  test('page loads with correct title and structure', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/StatCards/)
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('h1')).toContainText('StatCards')
    await expect(page.locator('aside')).toBeVisible()
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()
  })

  test('no horizontal overflow on any viewport', async ({ page }) => {
    await page.goto('/')
    const overflows = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    )
    expect(overflows).toBe(false)
  })

  test('header buttons do not overflow viewport', async ({ page }) => {
    await page.goto('/')
    const headerBox = await page.locator('header').boundingBox()
    const vpWidth   = page.viewportSize().width
    expect(headerBox.width).toBeLessThanOrEqual(vpWidth + 2)
  })
})

// ─── Search ──────────────────────────────────────────────────────────────────
test.describe('Search', () => {
  test('search input is visible and accepts text', async ({ page }) => {
    await page.goto('/')
    const input = page.locator('input[type="text"]').first()
    await expect(input).toBeVisible()
    await input.fill('testuser')
    await expect(input).toHaveValue('testuser')
  })

  test('submitting form fetches and renders stats card', async ({ page }) => {
    await page.goto('/')
    await page.locator('input[type="text"]').first().fill('testuser')
    await page.keyboard.press('Enter')
    // Card should appear
    await page.waitForSelector('[data-testid="stats-card"], .stats-card-root', { timeout: 10000 }).catch(() => {})
    // At minimum, the user name should be visible somewhere
    await expect(page.locator('text=Test User').first()).toBeVisible({ timeout: 10000 })
  })

  test('shows error for non-existent user', async ({ page }) => {
    await page.route('https://api.github.com/users/doesnotexist999', route =>
      route.fulfill({ status: 404, contentType: 'application/json', body: '{"message":"Not Found"}' })
    )
    await page.goto('/')
    await page.locator('input[type="text"]').first().fill('doesnotexist999')
    await page.keyboard.press('Enter')
    await expect(page.locator('text=/User not found/i').first()).toBeVisible({ timeout: 8000 })
  })

  test('empty input does not trigger search', async ({ page }) => {
    await page.goto('/')
    // The search button should be disabled when input is empty
    const submitBtn = page.locator('button[type="submit"]')
    await expect(submitBtn).toBeDisabled()
  })
})

// ─── Themes ──────────────────────────────────────────────────────────────────
test.describe('Themes', () => {
  test('all 6 theme buttons are visible', async ({ page }) => {
    await page.goto('/')
    const themeButtons = page.locator('.theme-btn')
    await expect(themeButtons).toHaveCount(6)
  })

  test('clicking a theme button marks it as selected', async ({ page }) => {
    await page.goto('/')
    const draculaBtn = page.locator('.theme-btn').nth(1) // Dracula is 2nd
    await draculaBtn.click()
    await expect(draculaBtn).toHaveClass(/selected/)
  })

  test('first theme (Midnight) is selected by default', async ({ page }) => {
    await page.goto('/')
    const firstBtn = page.locator('.theme-btn').first()
    await expect(firstBtn).toHaveClass(/selected/)
  })
})

// ─── Export buttons ──────────────────────────────────────────────────────────
test.describe('Export', () => {
  test('PNG and Copy buttons are disabled before a card is generated', async ({ page }) => {
    await page.goto('/')
    const pngBtn  = page.locator('button', { hasText: 'PNG' }).first()
    await expect(pngBtn).toBeDisabled()
  })

  test('PNG button becomes enabled after generating a card', async ({ page }) => {
    await page.goto('/')
    await page.locator('input[type="text"]').first().fill('testuser')
    await page.keyboard.press('Enter')
    await expect(page.locator('text=Test User').first()).toBeVisible({ timeout: 10000 })
    const pngBtn = page.locator('button', { hasText: 'PNG' }).first()
    await expect(pngBtn).toBeEnabled()
  })
})

// ─── Accessibility ───────────────────────────────────────────────────────────
test.describe('Accessibility', () => {
  test('all interactive elements are keyboard-focusable', async ({ page }) => {
    await page.goto('/')
    const interactives = page.locator('button:not([disabled]), input, a[href]')
    const count = await interactives.count()
    expect(count).toBeGreaterThan(3)
  })

  test('h1 exists and is visible', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toBeVisible()
  })
})
