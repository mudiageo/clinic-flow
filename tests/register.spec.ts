import { test, expect } from '@playwright/test';

test('Registration Multi-Step Flow', async ({ page }) => {
	// Navigate to register page
	await page.goto('/register');
	
	// Check initial step
	await expect(page.locator('text=Register your PHC')).toBeVisible();
	
	// Step 1: Admin Details
	await page.fill('input#adminName', 'Test Admin');
	const uniqueEmail = `admin-${Date.now()}@example.com`;
	await page.fill('input#email', uniqueEmail);
	await page.fill('input#password', 'password123');
	
	// Click Next Step
	await page.click('button:has-text("Next Step")');
	
	// Step 2: Clinic Details
	await page.fill('input#phcName', 'Test Clinic');
	await page.fill('input#state', 'Lagos');
	await page.fill('input#lga', 'Ikeja');
	
	// Submit Form
	await page.click('button:has-text("Complete Registration")');
	
	// Step 3: Success State
	await expect(page.locator('text=Registration Successful!')).toBeVisible();
	await expect(page.locator('text=Download Desktop App')).toBeVisible();
});
