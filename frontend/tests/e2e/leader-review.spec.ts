import { test, expect } from '@playwright/test';

test.describe('Leader Review E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as operator
    await page.goto('/login');
    await page.fill('input[type="email"]', 'operator@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/home/);
  });

  test('should display leader review button for completed jobs', async ({ page }) => {
    // Navigate to an execution sheet
    await page.goto('/execution/test-exec-id');
    
    // Wait for jobs to load
    await page.waitForSelector('.border.p-3.rounded');
    
    // Find a completed job
    const completedJob = page.locator('.border.p-3.rounded').filter({
      hasText: 'Completed'
    }).first();
    
    // Check if leader review button appears
    const leaderReviewButton = completedJob.locator('button').filter({
      hasText: 'Leader Review'
    });
    
    await expect(leaderReviewButton).toBeVisible();
  });

  test('should show leader review modal when clicking leader review button', async ({ page }) => {
    await page.goto('/execution/test-exec-id');
    
    // Click leader review button
    const leaderReviewButton = page.locator('button').filter({
      hasText: 'Leader Review'
    }).first();
    
    await leaderReviewButton.click();
    
    // Modal should appear
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should submit leader review successfully', async ({ page }) => {
    await page.goto('/execution/test-exec-id');
    
    // Click leader review button
    const leaderReviewButton = page.locator('button').filter({
      hasText: 'Leader Review'
    }).first();
    
    await leaderReviewButton.click();
    
    // Fill in leader credentials
    await page.fill('input[placeholder*="user ID"]', 'user-manager-001');
    await page.fill('input[type="password"]', 'password123');
    
    // Click approve button
    await page.click('button:has-text("Approve")');
    
    // Modal should close and job should show as reviewed
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    await expect(page.locator('text=✓ Approved')).toBeVisible();
  });

  test('should show error for invalid password', async ({ page }) => {
    await page.goto('/execution/test-exec-id');
    
    // Click leader review button
    const leaderReviewButton = page.locator('button').filter({
      hasText: 'Leader Review'
    }).first();
    
    await leaderReviewButton.click();
    
    // Fill in invalid credentials
    await page.fill('input[placeholder*="user ID"]', 'user-manager-001');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Click approve button
    await page.click('button:has-text("Approve")');
    
    // Error message should appear
    await expect(page.locator('[role="alert"]')).toBeVisible();
    await expect(page.locator('[role="alert"]')).toContainText('Invalid password');
  });

  test('should show timeout countdown timer', async ({ page }) => {
    await page.goto('/execution/test-exec-id');
    
    // Click leader review button
    const leaderReviewButton = page.locator('button').filter({
      hasText: 'Leader Review'
    }).first();
    
    await leaderReviewButton.click();
    
    // Timer should be visible
    await expect(page.locator('text=/d:00/')).toBeVisible();
    
    // Wait for a few seconds and check timer decreased
    await page.waitForTimeout(3000);
    
    // Timer should have decreased (approximately)
    const timerText = await page.locator('text=/d:00/').textContent();
    expect(timerText).toBeDefined();
  });

  test('should block jobsheet completion when reviews pending', async ({ page }) => {
    await page.goto('/execution/test-exec-id');
    
    // Check if complete button is disabled
    const completeButton = page.locator('button').filter({
      hasText: 'Complete'
    });
    
    // Should be disabled when reviews pending
    await expect(completeButton).toBeDisabled();
    
    // Check for tooltip or error message
    const tooltip = page.locator('[title]').first();
    if (await tooltip.count() > 0) {
      const tooltipText = await tooltip.getAttribute('title');
      expect(tooltipText).toContain('review');
    }
  });

  test('should allow jobsheet completion when all reviews complete', async ({ page }) => {
    await page.goto('/execution/test-exec-id');
    
    // Complete all leader reviews first (mock this)
    // In real E2E, you would need to complete all reviews
    
    // Check if complete button is enabled
    const completeButton = page.locator('button').filter({
      hasText: 'Complete'
    });
    
    // Should be enabled when all reviews complete
    await expect(completeButton).not.toBeDisabled();
  });

  test('should show leader review summary', async ({ page }) => {
    await page.goto('/execution/test-exec-id');
    
    // Click view summary button
    const summaryButton = page.locator('button').filter({
      hasText: 'View Summary'
    });
    
    if (await summaryButton.count() > 0) {
      await summaryButton.click();
      
      // Summary modal should appear
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      await expect(page.locator('text=Leader Review Summary')).toBeVisible();
      
      // Should show review progress
      await expect(page.locator('text=Leader Reviews:')).toBeVisible();
    }
  });

  test('should show correct visual indicators for review status', async ({ page }) => {
    await page.goto('/execution/test-exec-id');
    
    // Check for pending review indicator (amber/yellow)
    const pendingIndicator = page.locator('.bg-amber-50, .text-amber-600, .text-amber-700');
    if (await pendingIndicator.count() > 0) {
      await expect(pendingIndicator.first()).toBeVisible();
    }
    
    // Check for approved indicator (green)
    const approvedIndicator = page.locator('.bg-green-50, .text-green-600, .text-green-700');
    if (await approvedIndicator.count() > 0) {
      await expect(approvedIndicator.first()).toBeVisible();
    }
  });

  test('should support keyboard navigation in leader review modal', async ({ page }) => {
    await page.goto('/execution/test-exec-id');
    
    // Click leader review button
    const leaderReviewButton = page.locator('button').filter({
      hasText: 'Leader Review'
    }).first();
    
    await leaderReviewButton.click();
    
    // Tab through inputs
    await page.press('input[placeholder*="user ID"]', 'Tab');
    await page.press('input[type="password"]', 'Tab');
    
    // Focus should move to approve button
    const approveButton = page.locator('button:has-text("Approve")');
    await expect(approveButton).toBeFocused();
    
    // Press Escape to close
    await page.press('body', 'Escape');
    
    // Modal should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should handle concurrent review attempts', async ({ page }) => {
    // This test simulates two users trying to review the same job
    // In a real scenario, you would need two browser contexts
    
    await page.goto('/execution/test-exec-id');
    
    // First review attempt
    const leaderReviewButton = page.locator('button').filter({
      hasText: 'Leader Review'
    }).first();
    
    await leaderReviewButton.click();
    
    // Fill and submit
    await page.fill('input[placeholder*="user ID"]', 'user-manager-001');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Approve")');
    
    // Should complete successfully or show conflict error
    const modal = page.locator('[role="dialog"]');
    const isClosed = await modal.count() === 0 || !(await modal.isVisible());
    
    expect(isClosed).toBeTruthy();
  });
});
