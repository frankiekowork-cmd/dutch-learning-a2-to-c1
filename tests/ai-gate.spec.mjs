import { test, expect } from "@playwright/test";

test("AI buttons remain gated until secure backend launch",async({page})=>{
  await page.goto("/index.html");
  await page.locator('button[data-tab="practice"]').click();
  await expect(page.locator('#questions-list .question')).toHaveCount(12);
  const grading=page.locator('#questions-list .question button').filter({hasText:"AI 批改尚未啟用"});
  await expect(grading).toHaveCount(12);
  for (const button of await grading.all()) await expect(button).toBeDisabled();
  await page.locator('button[data-tab="questions"]').click();
  await expect(page.locator("#ask-ai")).toBeDisabled();
  await expect(page.locator("#ai-answer")).toBeEmpty();
});
