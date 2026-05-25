import { expect, test } from '@playwright/test';

test('auth pages render and navigate', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: '登入' })).toBeVisible();
  await expect(page.getByLabel('電郵')).toBeVisible();
  await expect(page.getByLabel('密碼')).toBeVisible();

  await page.getByRole('link', { name: '立即註冊' }).click();
  await expect(page).toHaveURL(/\/register/);
  await expect(page.getByRole('heading', { name: /建立 Insider Flow 帳號/ })).toBeVisible();

  await page.goto('/forgot-password');
  await expect(page.getByRole('heading', { name: '忘記密碼' })).toBeVisible();

  await page.goto('/reset-password');
  await expect(page.getByRole('heading', { name: '重設密碼' })).toBeVisible();
});

test('public product pages render', async ({ page }) => {
  await page.goto('/upgrade');
  await expect(page.getByRole('heading', { name: /升級 Insider\+/ })).toBeVisible();

  await page.goto('/institutional');
  await expect(page.getByRole('heading', { name: /機構投資者/ })).toBeVisible();

  await page.goto('/verify-sent');
  await expect(page.getByText('謝謝 你的注册')).toBeVisible();
});
