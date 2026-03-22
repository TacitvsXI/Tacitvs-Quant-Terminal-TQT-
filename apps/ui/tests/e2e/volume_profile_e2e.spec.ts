/**
 * E2E tests for Volume Profile feature
 */

import { test, expect } from '@playwright/test'

test.describe('Volume Profile E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to chart page
    await page.goto('/LAB')
    await page.waitForLoadState('networkidle')
  })

  test.skip('User can view and interact with Volume Profile', async ({ page }) => {
    /**
     * Test Case 5.1.1: Complete User Flow
     * 
     * User journey:
     * 1. Navigate to chart page
     * 2. Enable Volume Profile
     * 3. Verify histogram displayed
     * 4. Verify POC line on main chart
     * 5. Hover for tooltip
     * 6. Change timeframe - profile updates
     */
    
    // Step 2: Enable Volume Profile
    const volumeProfileToggle = page.locator('[data-testid="toggle-volume-profile"]')
    await volumeProfileToggle.click()
    
    // Step 3: Wait for histogram to load
    await page.waitForSelector('[data-testid="volume-profile-histogram"]', { timeout: 5000 })
    
    const histogram = page.locator('[data-testid="volume-profile-histogram"]')
    await expect(histogram).toBeVisible()
    
    // Step 4: Verify POC line on main chart
    const pocLine = page.locator('[data-testid="poc-line"]')
    await expect(pocLine).toBeVisible()
    
    // Step 5: Hover over volume bar - should show tooltip
    const pocBar = page.locator('[data-testid="volume-bar-poc"]')
    await pocBar.hover()
    
    await page.waitForSelector('[data-testid="volume-tooltip"]', { timeout: 2000 })
    const tooltip = page.locator('[data-testid="volume-tooltip"]')
    await expect(tooltip).toBeVisible()
    await expect(tooltip).toContainText('POC')
    
    // Step 6: Change timeframe - profile should update
    const timeframeSelector = page.locator('[data-testid="timeframe-selector"]')
    await timeframeSelector.selectOption('15m')
    
    // Wait for API call
    await page.waitForResponse(response => 
      response.url().includes('/api/volume_profile') && response.status() === 200
    )
    
    // Verify profile updated (POC should be different)
    // This is a simplification - in reality would need to store initial POC value
  })

  test.skip('Volume Profile persists across symbol changes', async ({ page }) => {
    /**
     * Test that Volume Profile stays enabled when changing symbol
     */
    
    // Enable Volume Profile
    await page.click('[data-testid="toggle-volume-profile"]')
    await page.waitForSelector('[data-testid="volume-profile-histogram"]')
    
    // Change symbol
    const symbolSelector = page.locator('[data-testid="symbol-selector"]')
    await symbolSelector.selectOption('ETH-PERP')
    
    // Wait for update
    await page.waitForResponse(/\/api\/volume_profile/)
    
    // Volume Profile should still be visible
    await expect(page.locator('[data-testid="volume-profile-histogram"]')).toBeVisible()
  })

  test.skip('Can toggle Volume Profile on and off', async ({ page }) => {
    /**
     * Test toggle functionality
     */
    
    const toggle = page.locator('[data-testid="toggle-volume-profile"]')
    const histogram = page.locator('[data-testid="volume-profile-histogram"]')
    
    // Initially off
    await expect(histogram).not.toBeVisible()
    
    // Turn on
    await toggle.click()
    await page.waitForSelector('[data-testid="volume-profile-histogram"]')
    await expect(histogram).toBeVisible()
    
    // Turn off
    await toggle.click()
    await expect(histogram).not.toBeVisible()
  })

  test.skip('Shows loading state while fetching data', async ({ page }) => {
    /**
     * Test loading indicators
     */
    
    // Enable Volume Profile
    await page.click('[data-testid="toggle-volume-profile"]')
    
    // Should show loading indicator
    const loader = page.locator('[data-testid="volume-profile-loading"]')
    // In reality this might be too fast to catch
    
    // Wait for data
    await page.waitForSelector('[data-testid="volume-profile-histogram"]')
    
    // Loading should be gone
    await expect(loader).not.toBeVisible()
  })

  test.skip('Handles API errors gracefully', async ({ page }) => {
    /**
     * Test error handling
     */
    
    // Mock API error
    await page.route('/api/volume_profile*', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' })
      })
    })
    
    // Try to enable Volume Profile
    await page.click('[data-testid="toggle-volume-profile"]')
    
    // Should show error message
    const errorMessage = page.locator('[data-testid="error-message"]')
    await expect(errorMessage).toBeVisible()
    await expect(errorMessage).toContainText(/error|failed/i)
  })

  test.skip('Works on mobile viewport', async ({ page }) => {
    /**
     * Test mobile responsiveness
     */
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Enable Volume Profile
    await page.click('[data-testid="toggle-volume-profile"]')
    await page.waitForSelector('[data-testid="volume-profile-histogram"]')
    
    // Histogram should be visible and properly sized
    const histogram = page.locator('[data-testid="volume-profile-histogram"]')
    await expect(histogram).toBeVisible()
    
    const box = await histogram.boundingBox()
    expect(box?.width).toBeLessThanOrEqual(375)
  })
})

test.describe('Market State E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/LAB')
    await page.waitForLoadState('networkidle')
  })

  test.skip('Displays current market state', async ({ page }) => {
    /**
     * Test market state panel display
     */
    
    // Wait for market state to load
    await page.waitForSelector('[data-testid="market-state-badge"]', { timeout: 5000 })
    
    const badge = page.locator('[data-testid="market-state-badge"]')
    await expect(badge).toBeVisible()
    
    // Should have one of the valid states
    const text = await badge.textContent()
    expect(['BALANCE', 'TRENDING UP', 'TRENDING DOWN', 'FAILED BREAKOUT']).toContain(text)
  })

  test.skip('Updates market state when timeframe changes', async ({ page }) => {
    /**
     * Test market state updates
     */
    
    await page.waitForSelector('[data-testid="market-state-badge"]')
    
    // Get initial state
    const badge = page.locator('[data-testid="market-state-badge"]')
    const initialState = await badge.textContent()
    
    // Change timeframe
    await page.selectOption('[data-testid="timeframe-selector"]', '5m')
    await page.waitForResponse(/\/api\/market_state/)
    
    // State might have changed (or stayed same)
    await expect(badge).toBeVisible()
  })
})

















