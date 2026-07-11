import { expect, test } from "@playwright/test";

test("owner can sign in and open a seeded release", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Release Room" })).toBeVisible();

  await page.getByRole("link", { name: "Owner sign in" }).click();
  await expect(page.getByRole("heading", { name: "Owner sign in" })).toBeVisible();

  await page.getByLabel("Owner email").fill("owner@release-room.local");
  await page.getByLabel("Password").fill("release-room-dev");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByRole("heading", { name: "Release candidates" })).toBeVisible();
  await page.getByRole("link", { name: /Foundation scaffold/i }).click();
  await expect(page.getByRole("heading", { name: "Foundation scaffold" })).toBeVisible();
  await expect(page.getByText("READY").first()).toBeVisible();
});

test("unauthenticated /app redirects to login", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Owner sign in" })).toBeVisible();
});
