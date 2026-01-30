import { test, expect } from '@playwright/test';

test('rigorous multiplayer game flow', async ({ browser }) => {
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  const context3 = await browser.newContext();

  const host = await context1.newPage();
  const player2 = await context2.newPage();
  const player3 = await context3.newPage();

  const allPages = [host, player2, player3];

  for (const p of allPages) {
    await p.goto('http://localhost:3000/login');
    await p.click('button:has-text("Play as Guest")');
    await p.click('button:has-text("Join Game")');
    await expect(p.locator('button:has-text("Create Game")')).toBeVisible({ timeout: 20000 });
  }

  await host.click('button:has-text("Create Game")');
  await host.waitForURL('**/create');
  await host.click('button:has-text("Start Lobby")');
  await host.waitForURL(/\/game\/.+/);
  
  const codeLocator = host.locator('.text-4xl.font-black.tracking-widest');
  await expect(codeLocator).not.toHaveText('......', { timeout: 15000 });
  const inviteCode = (await codeLocator.textContent())?.trim() || "";

  for (const p of [player2, player3]) {
    await p.goto('http://localhost:3000/join');
    await p.locator('input').fill(inviteCode);
    await p.click('button:has-text("Join Game")');
    await p.waitForURL(/\/game\/.+/, { timeout: 20000 });
  }

  await expect(host.locator('.bg-gray-50.rounded-xl')).toHaveCount(3, { timeout: 30000 });

  await host.click('button:has-text("Start Game")');
  await expect(host).toHaveURL(/\/game\/.+\/play/, { timeout: 30000 });

  const players = [
    { page: host, name: 'Host' },
    { page: player2, name: 'P2' },
    { page: player3, name: 'P3' }
  ];

  for (const p of players) {
    await expect(p.page.locator('text=Loading Game')).not.toBeVisible({ timeout: 30000 });
  }

  for (const p of players) {
    await expect(p.page.locator('#judge-banner').or(p.page.locator('.hand-card')).or(p.page.locator('text=Judging Phase')).first()).toBeVisible({ timeout: 30000 });
    const isJudge = await p.page.locator('#judge-banner').isVisible();
    
    if (!isJudge) {
      const card = p.page.locator('.card-container.card-white').first();
      await expect(card).toBeVisible({ timeout: 40000 });
      await card.click({ force: true });
      
      const confirmBtn = p.page.locator('button:has-text("CONFIRM")');
      await expect(confirmBtn).toBeVisible({ timeout: 20000 });
      await confirmBtn.click({ force: true });
      
      await expect(p.page.locator('text=/Submitted|Judging/i').first()).toBeVisible({ timeout: 40000 });
    }
  }

  let judgeData = players[0];
  for (const p of players) {
    const isJudge = await p.page.locator('#judge-banner').isVisible();
    if (isJudge) {
      judgeData = p;
      break;
    }
  }
  
  const finalJudgePage = judgeData.page;
  await expect(finalJudgePage.locator('text=Judging Phase')).toBeVisible({ timeout: 40000 });
  
  const questionCards = finalJudgePage.locator('#game-play-area .bg-brand-secondary span:text("?")');
  await expect(questionCards).toHaveCount(2, { timeout: 30000 });

  const revealCount = await questionCards.count();
  for (let i = 0; i < revealCount; i++) {
    const cardToReveal = finalJudgePage.locator('#game-play-area .cursor-pointer').filter({ hasText: '?' }).first();
    await cardToReveal.evaluate(node => (node as HTMLElement).click());
    await expect(questionCards).toHaveCount(revealCount - i - 1, { timeout: 10000 });
  }

  const pickWinnerBtn = finalJudgePage.getByRole('button', { name: /pick winner/i }).first();
  await expect(pickWinnerBtn).toBeVisible({ timeout: 30000 });
  await pickWinnerBtn.evaluate(node => (node as HTMLElement).click());

  await expect(finalJudgePage.locator('text=Winner Revealed')).toBeVisible({ timeout: 30000 });
  await expect(host.locator('text=Winner Revealed')).toBeVisible({ timeout: 10000 });
  await expect(host.locator('text=Next round in')).toBeVisible({ timeout: 20000 });
  
  await expect(host.locator('text=Round 2')).toBeVisible({ timeout: 60000 });

  await context1.close();
  await context2.close();
  await context3.close();
});
