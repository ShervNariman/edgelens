import { expect, test } from "@playwright/test";

test("owner can sign in and open a seeded release", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Release Room" })).toBeVisible();

  await page.getByRole("link", { name: "Owner sign in" }).click();
  await expect(page.getByRole("heading", { name: "Owner sign in" })).toBeVisible();

  await page.getByLabel("Owner email").fill("owner@release-room.local");
  await page.getByLabel("Password").fill("release-room-dev");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByRole("heading", { name: "Live release board" })).toBeVisible();
  await expect(page.getByText("Decision pulse")).toBeVisible();
  await expect(page.getByRole("button", { name: /Refresh now/i })).toBeVisible();
  await page.getByRole("link", { name: /Foundation scaffold/i }).click();
  await expect(page.getByRole("heading", { name: "Foundation scaffold" })).toBeVisible();
  await expect(page.getByText("READY").first()).toBeVisible();
});

test("live board shows editor event without full navigation reload", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Owner email").fill("owner@release-room.local");
  await page.getByLabel("Password").fill("release-room-dev");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Live release board" })).toBeVisible();

  await page.getByRole("button", { name: /Simulate editor event/i }).click();
  await expect(page.getByText(/Cursor agent evidence submitted/i)).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText(/Live activity/i)).toBeVisible();
});

test("unauthenticated /app redirects to login", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Owner sign in" })).toBeVisible();
});
