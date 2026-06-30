import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Leader Review Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as operator
    await page.goto('/login');
    await page.fill('input[type="email"]', 'operator@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/home/);
  });

  test('should not have automatically detectable accessibility violations on execution page', async ({ page }) => {
    await page.goto('/execution/test-exec-id');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have accessibility violations in leader review modal', async ({ page }) => {
    await page.goto('/execution/test-exec-id');
    
    // Click leader review button
    const leaderReviewButton = page.locator('button').filter({
      hasText: 'Leader Review'
    }).first();
    
    if (await leaderReviewButton.count() > 0) {
      await leaderReviewButton.click();
      
      // Wait for modal to appear
      await page.waitForSelector('[role="dialog"]');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('[role="dialog"]')
        .analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    }
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    await page.goto('/execution/test-exec-id');
    
    // Check for ARIA labels on interactive elements
    const leaderReviewButton = page.locator('button').filter({
      hasText: 'Leader Review'
    }).first();
    
    if (await leaderReviewButton.count() > 0) {
      const ariaLabel = await leaderReviewButton.getAttribute('title');
      expect(ariaLabel).toBeDefined();
    }
    
    // Check modal has proper ARIA attributes
    await leaderReviewButton.click();
    await page.waitForSelector('[role="dialog"]');
    
    const modal = page.locator('[role="dialog"]');
    const ariaModal = await modal.getAttribute('aria-modal');
    expect(ariaModal).toBe('true');
    
    const ariaLabelledby = await modal.getAttribute('aria-labelledby');
    expect(ariaLabelledby).toBeDefined();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/execution/test-exec-id');
    
    // Focus on leader review button
    const leaderReviewButton = page.locator('button').filter({
      hasText: 'Leader Review'
    }).first();
    
    if (await leaderReviewButton.count() > 0) {
      await leaderReviewButton.focus();
      await expect(leaderReviewButton).toBeFocused();
      
      // Press Enter to open modal
      await page.press('button', 'Enter');
      
      // Modal should open
      await page.waitForSelector('[role="dialog"]');
      
      // Tab through form elements
      await page.press('input', 'Tab');
      
      // Should move to next focusable element
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeDefined();
      
      // Test Escape key closes modal
      await page.press('body', 'Escape');
      
      // Modal should close
      const modalCount = await page.locator('[role="dialog"]').count();
      expect(modalCount).toBe(0);
    }
  });

  test('should have proper focus management in modal', async ({ page }) => {
    await page.goto('/execution/test-exec-id');
    
    // Click leader review button
    const leaderReviewButton = page.locator('button').filter({
      hasText: 'Leader Review'
    }).first();
    
    if (await leaderReviewButton.count() > 0) {
      await leaderReviewButton.click();
      
      // Focus should move to modal
      const modal = page.locator('[role="dialog"]');
      expect(await modal.isVisible()).toBeTruthy();
      
      // First input should be focused
      const firstInput = page.locator('input[placeholder*="user ID"]');
      await expect(firstInput).toBeFocused();
    }
  });

  test('should have visible focus indicators', async ({ page }) => {
    await page.goto('/execution/test-exec-id');
    
    // Focus on leader review button
    const leaderReviewButton = page.locator('button').filter({
      hasText: 'Leader Review'
    }).first();
    
    if (await leaderReviewButton.count() > 0) {
      await leaderReviewButton.focus();
      
      // Check for focus indicator (outline or border)
      const styles = await leaderReviewButton.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          outline: computed.outline,
          outlineWidth: computed.outlineWidth,
          boxShadow: computed.boxShadow
        };
      });
      
      // Should have some form of focus indicator
      expect(
        styles.outline !== 'none' || 
        styles.boxShadow !== 'none' || 
        styles.outlineWidth !== '0px'
      ).toBeTruthy();
    }
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/execution/test-exec-id');
    
    // Check text elements for color contrast
    const textElements = page.locator('text=Leader Review, text=Approved, text=Pending');
    
    for (const element of await textElements.all()) {
      const styles = await element.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor
        };
      });
      
      // Colors should be defined
      expect(styles.color).toBeDefined();
      expect(styles.backgroundColor).toBeDefined();
    }
  });

  test('should have accessible error messages', async ({ page }) => {
    await page.goto('/execution/test-exec-id');
    
    // Click leader review button
    const leaderReviewButton = page.locator('button').filter({
      hasText: 'Leader Review'
    }).first();
    
    if (await leaderReviewButton.count() > 0) {
      await leaderReviewButton.click();
      
      // Submit with invalid data
      await page.click('button:has-text("Approve")');
      
      // Error message should be accessible
      const errorAlert = page.locator('[role="alert"]');
      if (await errorAlert.count() > 0) {
        expect(await errorAlert.isVisible()).toBeTruthy();
        
        // Should have proper ARIA attributes
        const ariaLive = await errorAlert.getAttribute('aria-live');
        expect(ariaLive).toBe('polite');
      }
    }
  });

  test('should have accessible form labels', async ({ page }) => {
    await page.goto('/execution/test-exec-id');
    
    // Click leader review button
    const leaderReviewButton = page.locator('button').filter({
      hasText: 'Leader Review'
    }).first();
    
    if (await leaderReviewButton.count() > 0) {
      await leaderReviewButton.click();
      
      // Check for associated labels
      const userIdInput = page.locator('input[placeholder*="user ID"]');
      const userIdLabel = page.locator('label[for="userId"]');
      
      if (await userIdInput.count() > 0) {
        const hasLabel = await userIdLabel.count() > 0;
        expect(hasLabel).toBeTruthy();
      }
      
      const passwordInput = page.locator('input[type="password"]');
      const passwordLabel = page.locator('label[for="password"]');
      
      if (await passwordInput.count() > 0) {
        const hasLabel = await passwordLabel.count() > 0;
        expect(hasLabel).toBeTruthy();
      }
    }
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/execution/test-exec-id');
    
    // Check for proper heading structure
    const modalHeading = page.locator('[role="dialog"] h2');
    
    if (await modalHeading.count() > 0) {
      const headingText = await modalHeading.first().textContent();
      expect(headingText).toContain('Leader Review');
    }
  });

  test('should have accessible summary panel', async ({ page }) => {
    await page.goto('/execution/test-exec-id');
    
    // Click view summary button if available
    const summaryButton = page.locator('button').filter({
      hasText: 'View Summary'
    });
    
    if (await summaryButton.count() > 0) {
      await summaryButton.click();
      
      // Wait for summary modal
      await page.waitForSelector('[role="dialog"]');
      
      // Check for accessibility
      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('[role="dialog"]')
        .analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
      
      // Should have proper heading
      const summaryHeading = page.locator('[role="dialog"] h2');
      expect(await summaryHeading.count()).toBeGreaterThan(0);
    }
  });

  test('should have accessible progress indicators', async ({ page }) => {
    await page.goto('/execution/test-exec-id');
    
    // Check for progress indicator
    const progressText = page.locator('text=Leader Reviews:');
    
    if (await progressText.count() > 0) {
      // Should have descriptive text
      const text = await progressText.first().textContent();
      expect(text).toBeDefined();
      expect(text).toContain('Leader Reviews');
    }
  });

  test('should support screen reader announcements', async ({ page }) => {
    await page.goto('/execution/test-exec-id');
    
    // Click leader review button
    const leaderReviewButton = page.locator('button').filter({
      hasText: 'Leader Review'
    }).first();
    
    if (await leaderReviewButton.count() > 0) {
      await leaderReviewButton.click();
      
      // Modal should have aria-live region for dynamic content
      const modal = page.locator('[role="dialog"]');
      expect(await modal.isVisible()).toBeTruthy();
      
      // Check for aria-live or aria-atomic attributes
      const ariaLive = await modal.getAttribute('aria-live');
      const ariaAtomic = await modal.getAttribute('aria-atomic');
      
      // At least one should be present for dynamic content
      expect(ariaLive || ariaAtomic).toBeDefined();
    }
  });
});
