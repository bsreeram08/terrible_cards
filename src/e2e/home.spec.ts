import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:8091";

test("home page loads", async ({ page }) => {
  page.on("console", msg => console.log('PAGE LOG:', msg.text()));
  await page.goto(`${BASE_URL}/`);
  await expect(page.locator("h1")).toContainText("Terrible");
});

test("login page loads", async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await expect(page.locator("h1")).toContainText("Terrible Cards");
  await expect(page.getByRole("button", { name: "Play as Guest" })).toBeVisible();
});

test("guest login and profile creation", async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await page.getByRole("button", { name: "Play as Guest" }).click();
  
  // New flow: fill name (optional) and click Join
  await page.getByPlaceholder("Enter a nickname or leave blank").fill("TestGuest");
  await page.getByRole("button", { name: "Join Game" }).click();
  
  await expect(page).toHaveURL(`${BASE_URL}/`);
  await expect(page.locator("h1")).toContainText("Terrible");
});

test("full game flow: create to board", async ({ page }) => {
  page.on("console", msg => console.log('PAGE LOG:', msg.text()));
  page.on("pageerror", err => console.log('PAGE ERROR:', err.message));
  
  await page.goto(`${BASE_URL}/login`);
  await page.getByRole("button", { name: "Play as Guest" }).click();
  
  // New flow
  await page.getByRole("button", { name: "Join Game" }).click(); // Skip name input
  
  await expect(page).toHaveURL(`${BASE_URL}/`);
  
  await page.goto(`${BASE_URL}/create`);
  await page.getByRole("button", { name: "Start Lobby" }).click();
  
  await expect(page).toHaveURL(/\/game\/[a-zA-Z0-9]+/);
  await expect(page.locator("h1")).toContainText("Lobby");
  
  await page.getByRole("button", { name: "Start Game" }).click();
  
  await expect(page).toHaveURL(/\/game\/[a-zA-Z0-9]+\/play/);
  await expect(page.locator("header")).toContainText("Round 1");
  
  // Host is the judge in round 1
  await expect(page.locator("text=You are the judge")).toBeVisible();
  await expect(page.locator("text=Wait for others to submit")).toBeVisible();
  
  // Verify scoreboard is visible
  await expect(page.locator("text=Scoreboard")).toBeVisible();
});
