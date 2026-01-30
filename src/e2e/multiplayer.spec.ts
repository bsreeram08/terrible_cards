import { test, expect, BrowserContext } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

test("full multiplayer game flow", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  hostPage.on("console", msg => console.log('HOST LOG:', msg.text()));
  hostPage.on("pageerror", err => console.log('HOST ERROR:', err.message));

  const playerContext = await browser.newContext();
  const playerPage = await playerContext.newPage();
  playerPage.on("console", msg => console.log('PLAYER LOG:', msg.text()));
  playerPage.on("pageerror", err => console.log('PLAYER ERROR:', err.message));

  await hostPage.goto(`${BASE_URL}/login`);
  await hostPage.getByRole("button", { name: "Play as Guest" }).click();
  await expect(hostPage).toHaveURL(`${BASE_URL}/`);
  
  await hostPage.goto(`${BASE_URL}/create`);
  await hostPage.getByRole("button", { name: "Start Lobby" }).click();
  
  await expect(hostPage).toHaveURL(/\/game\/[a-zA-Z0-9]+/);
  await expect(hostPage.locator("h1")).toContainText("Lobby");
  
  const inviteCode = await hostPage.locator("div.text-4xl").textContent();
  console.log("INVITE CODE:", inviteCode);
  expect(inviteCode).not.toBe("......");

  await playerPage.goto(`${BASE_URL}/login`);
  await playerPage.getByRole("button", { name: "Play as Guest" }).click();
  await expect(playerPage).toHaveURL(`${BASE_URL}/`);
  
  await playerPage.goto(`${BASE_URL}/join`);
  await playerPage.locator("input").fill(inviteCode!);
  await playerPage.getByRole("button", { name: "Join Game" }).click();
  
  try {
    await expect(playerPage).toHaveURL(/\/game\/[a-zA-Z0-9]+/, { timeout: 10000 });
    await expect(playerPage.locator("text=YOU")).toBeVisible();
  } catch (e) {
    await playerPage.screenshot({ path: ".sisyphus/evidence/player-join-fail.png" });
    throw e;
  }

  await expect(hostPage.locator("text=Player")).toHaveCount(2);
  await hostPage.getByRole("button", { name: "Start Game" }).click();

  await expect(hostPage).toHaveURL(/\/game\/[a-zA-Z0-9]+\/play/);
  await expect(playerPage).toHaveURL(/\/game\/[a-zA-Z0-9]+\/play/);

  await expect(hostPage.locator("text=YOU ARE JUDGE")).toBeVisible();
  await expect(hostPage.locator("text=You are the judge")).toBeVisible();

  await expect(playerPage.locator("text=Your Hand")).toBeVisible();
  const playerCards = playerPage.locator(".card-container.card-white");
  await expect(playerCards).toHaveCount(7, { timeout: 15000 });

  const firstCard = playerCards.first();
  const playArea = playerPage.locator("#game-play-area");
  await firstCard.dragTo(playArea);
  
  await expect(playerPage.locator("text=Submitted!")).toBeVisible();

  await expect(hostPage.locator("text=JUDGING PHASE")).toBeVisible();
  const submittedCards = hostPage.locator("#game-play-area .card-container.card-white");
  await expect(submittedCards).toHaveCount(1);

  await submittedCards.first().click();
  await expect(hostPage.locator("text=Winner Revealed!")).toBeVisible();

  await expect(hostPage.locator("text=1")).toBeVisible();

  await hostContext.close();
  await playerContext.close();
});
