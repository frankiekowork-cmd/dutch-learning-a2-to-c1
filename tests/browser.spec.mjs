import { test, expect } from '@playwright/test';

const MOCK_SUPABASE = `
const users = {
  'a@example.test': { id: 'test-user-a', email: 'a@example.test' },
  'b@example.test': { id: 'test-user-b', email: 'b@example.test' }
};
let currentUser = null;
const profiles = {};
const submissions = {};
const curriculum = {};
let notify = () => {};
function query(table){
  const clauses=[];
  const q = {
    select(){return q;},
    eq(key,value){clauses.push([key,value]);return q;},
    order(){return q;},
    limit(){return Promise.resolve({data:(submissions[currentUser?.id]||[]).filter(x=>clauses.every(([k,v])=>x[k]===v)).slice().reverse(),error:null});},
    maybeSingle(){return Promise.resolve({data:table==='learner_curriculum_state' ? (curriculum[currentUser?.id]||null) : (profiles[currentUser?.id]||null),error:null});},
    async upsert(row){if(table==='learner_curriculum_state')curriculum[currentUser.id]=row;else profiles[currentUser.id]=row;return {error:null};},
    async insert(rows){(submissions[currentUser.id]??=[]).push(...rows);return {error:null};}
  };
  return q;
}
export function createClient(){
  return {
    auth:{
      getUser:async()=>({data:{user:currentUser},error:null}),
      onAuthStateChange(callback){notify=callback;return {data:{subscription:{unsubscribe(){}}}};},
      async signInWithOtp({email}){
        if(!users[email])return {error:new Error('Test account unavailable')};
        currentUser=users[email];
        queueMicrotask(()=>notify('SIGNED_IN',{}));
        return {error:null};
      },
      async signOut(){currentUser=null;queueMicrotask(()=>notify('SIGNED_OUT',{}));return {error:null};}
    },
    from:query
  };
}
`;

test.beforeEach(async ({ page }) => {
  await page.route('https://esm.sh/**', route => route.fulfill({
    status: 200, contentType: 'application/javascript',
    headers: {'Access-Control-Allow-Origin':'*'},
    body: MOCK_SUPABASE
  }));
  await page.goto('/index.html');
});

test('guest cannot upload data and forms are accessible', async ({ page }) => {
  await expect(page.locator('#auth-panel')).toBeVisible();
  await page.locator('button[data-tab="practice"]').click();
  await page.locator('#questions-list textarea').first().fill('Ik wil oefenen.');
  await page.locator('#cloud-save').click();
  await expect(page.locator('#save-status')).toContainText('請先');
  await page.reload();
  await page.locator('button[data-tab="practice"]').click();
  await expect(page.locator('#questions-list textarea').first()).toHaveValue('Ik wil oefenen.');
});

test('two simulated accounts do not share answers or profile settings', async ({ page }) => {
  const email=page.locator('#signin-email');
  await email.fill('a@example.test');
  await page.locator('#signin-send').click();
  await expect(page.locator('#auth-email')).toHaveText('a@example.test');
  await page.locator('button[data-tab="settings"]').click();
  await page.locator('select[name="level"]').selectOption('B2');
  await page.locator('#preferences button[type="submit"]').click();
  await expect(page.locator('#settings-status')).toContainText('同步');
  await page.locator('button[data-tab="practice"]').click();
  await page.locator('#questions-list textarea').first().fill('Antwoord van A');
  await page.locator('#cloud-save').click();
  await expect(page.locator('#save-status')).toContainText('已成功');
  await page.locator('#signout').click();
  await expect(page.locator('#auth-panel')).toBeVisible();

  await email.fill('b@example.test');
  await page.locator('#signin-send').click();
  await expect(page.locator('#auth-email')).toHaveText('b@example.test');
  await expect(page.locator('#questions-list textarea').first()).toHaveValue('');
  await page.locator('button[data-tab="settings"]').click();
  await expect(page.locator('select[name="level"]')).toHaveValue('A2');
  await page.locator('#signout').click();

  await email.fill('a@example.test');
  await page.locator('#signin-send').click();
  await expect(page.locator('#auth-email')).toHaveText('a@example.test');
  await page.locator('button[data-tab="practice"]').click();
  await expect(page.locator('#questions-list textarea').first()).toHaveValue('Antwoord van A');
  await page.locator('button[data-tab="settings"]').click();
  await expect(page.locator('select[name="level"]')).toHaveValue('B2');
});

test('curriculum cloud snapshot survives a browser-local reset without exposing account A to B',async({page})=>{
  page.on('dialog',dialog=>dialog.accept());
  const email=page.locator('#signin-email');
  await email.fill('a@example.test');
  await page.locator('#signin-send').click();
  await expect(page.locator('#auth-email')).toHaveText('a@example.test');
  await page.locator('button[data-tab="curriculum"]').click();
  await page.locator('#catalog-level').selectOption('B1');
  await page.locator('#lesson-cards button').first().click();
  await page.locator('#lesson-exercises textarea').first().fill('Test antwoord A');
  await page.locator('#mark-studied').click();
  await page.locator('button[data-tab="review"]').click();
  await page.locator('#review-filter').selectOption('B1');
  await page.locator('.quiz-card input[type="radio"]').first().check();
  await page.locator('.quiz-card button').first().click();
  await page.locator('button[data-tab="curriculum"]').click();
  await page.locator('#upload-curriculum').click();
  await expect(page.locator('#sync-status')).toContainText('已上傳');
  await page.locator('#signout').click();
  await expect(page.locator('#auth-panel')).toBeVisible();

  await email.fill('b@example.test');
  await page.locator('#signin-send').click();
  await expect(page.locator('#auth-email')).toHaveText('b@example.test');
  await page.locator('button[data-tab="curriculum"]').click();
  await page.locator('#catalog-level').selectOption('B1');
  await page.locator('#lesson-cards button').first().click();
  await expect(page.locator('#lesson-exercises textarea').first()).toHaveValue('');
  await page.locator('#download-curriculum').click();
  await expect(page.locator('#sync-status')).toContainText('未有已儲存');
  await page.locator('#signout').click();

  await email.fill('a@example.test');
  await page.locator('#signin-send').click();
  await expect(page.locator('#auth-email')).toHaveText('a@example.test');
  await page.evaluate(()=>{
    localStorage.removeItem('dutch-learning-curriculum-v1-account-test-user-a-drafts');
    localStorage.removeItem('dutch-learning-curriculum-v1-account-test-user-a-studied');
    localStorage.removeItem('dutch-review-v1-account-test-user-a');
  });
  await page.locator('button[data-tab="curriculum"]').click();
  await page.locator('#download-curriculum').click();
  await expect(page.locator('#sync-status')).toContainText('已還原');
  await page.locator('#catalog-level').selectOption('B1');
  await page.locator('#lesson-cards button').first().click();
  await expect(page.locator('#lesson-exercises textarea').first()).toHaveValue('Test antwoord A');
  await expect(page.locator('#lesson-status')).toContainText('之前已自行標記');
  await page.locator('button[data-tab="review"]').click();
  await expect(page.locator('#review-summary')).toContainText('已練習 1/8');
});
