import { test, expect } from '@playwright/test';

test('new A2–C1 lessons have translations, filtering and explicit completion',async({page})=>{
 await page.goto('/index.html');
 await page.locator('button[data-tab="curriculum"]').click();
 await expect(page.locator('#lesson-cards .lesson-card')).toHaveCount(4);
 await page.locator('#catalog-level').selectOption('B2');
 await expect(page.locator('#lesson-cards .lesson-card')).toHaveCount(1);
 await page.locator('#lesson-cards button').first().click();
 await expect(page.locator('#lesson-title')).toContainText('B2');
 await expect(page.locator('#lesson-words')).toContainText('proposal');
 await expect(page.locator('#lesson-examples')).toContainText('Hoewel');
 await expect(page.locator('#lesson-status')).toContainText('未標記為已讀');
 await page.locator('#lesson-exercises textarea').first().fill('Hoewel het plan duur is, is het haalbaar.');
 await page.reload();
 await page.locator('button[data-tab="curriculum"]').click();
 await page.locator('#catalog-level').selectOption('B2');
 await page.locator('#lesson-cards button').first().click();
 await expect(page.locator('#lesson-exercises textarea').first()).toHaveValue('Hoewel het plan duur is, is het haalbaar.');
 await expect(page.locator('#lesson-status')).toContainText('未標記為已讀');
 await page.locator('#mark-studied').click();
 await expect(page.locator('#lesson-status')).toContainText('已自行確認');
 await page.reload();
 await page.locator('button[data-tab="curriculum"]').click();
 await page.locator('#catalog-level').selectOption('B2');
 await expect(page.locator('#lesson-cards')).toContainText('已自行確認完成');
});
