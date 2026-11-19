import {test,expect} from "@playwright/test";

test("unanswered quiz is not counted; correct response schedules review and explains answer",async({page})=>{
  await page.goto("/index.html");
  await page.locator('button[data-tab="review"]').click();
  await expect(page.locator("#review-summary")).toContainText("已練習 0/8");
  await expect(page.locator(".quiz-card")).toHaveCount(2);
  await page.locator(".quiz-card").first().getByRole("button",{name:"提交答案"}).click();
  await expect(page.locator(".quiz-card").first()).toContainText("未提交唔計入練習紀錄");
  await expect(page.locator("#review-summary")).toContainText("已練習 0/8");
  await page.locator(".quiz-card").first().locator('input[type="radio"]').nth(1).check();
  await page.locator(".quiz-card").first().getByRole("button",{name:"提交答案"}).click();
  await expect(page.locator(".quiz-card").first()).toContainText("正確答案");
  await expect(page.locator("#review-summary")).toContainText("已練習 1/8");
  await page.reload();
  await page.locator('button[data-tab="review"]').click();
  await expect(page.locator("#review-summary")).toContainText("已練習 1/8");
  await page.locator("#review-filter").selectOption("due");
  await expect(page.locator(".quiz-card")).toHaveCount(0);
});

test("wrong answer schedules next-day review and due review takes priority",async({page})=>{
  await page.goto("/index.html");
  await page.locator('button[data-tab="review"]').click();
  await page.locator(".quiz-card").first().locator('input[type="radio"]').first().check();
  await page.locator(".quiz-card").first().getByRole("button",{name:"提交答案"}).click();
  await expect(page.locator(".quiz-card").first()).toContainText("需要重溫");
  const edited = await page.evaluate(()=>{
    const key="dutch-review-v1-guest";
    const progress=JSON.parse(localStorage.getItem(key));
    const id=Object.keys(progress)[0];
    progress[id].next_review_at="2020-01-01T00:00:00.000Z";
    localStorage.setItem(key,JSON.stringify(progress));
    return id;
  });
  expect(edited).toBe("a2-verb-second");
  await page.reload();
  await expect(page.locator("#review-due-summary")).toContainText("1 題");
  await expect(page.locator("#next-lesson-text")).toContainText("到期");
  await page.locator('button[data-tab="review"]').click();
  await page.locator("#review-filter").selectOption("due");
  await expect(page.locator(".quiz-card")).toHaveCount(1);
});

test("review engine maintains a progression of intervals without credentials",async({page})=>{
  await page.goto("/index.html");
  const result=await page.evaluate(()=>{
    const e=window.LEARNING_ENGINE;
    const t="2026-11-19T00:00:00.000Z";
    const first=e.update(undefined,true,t);
    const second=e.update(first,true,t);
    const failed=e.update(second,false,t);
    return {first,second,failed};
  });
  expect(result.first.streak).toBe(1);
  expect(result.first.next_review_at).toBe("2026-11-20T00:00:00.000Z");
  expect(result.second.streak).toBe(2);
  expect(result.second.next_review_at).toBe("2026-11-22T00:00:00.000Z");
  expect(result.failed.streak).toBe(0);
  expect(result.failed.next_review_at).toBe("2026-11-20T00:00:00.000Z");
});
