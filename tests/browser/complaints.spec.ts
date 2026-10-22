import {test,expect} from '@playwright/test';
import fs from 'node:fs';
test('mixed engine and AC complaints survive live-model omission and explicit review',async({page})=>{
  await page.goto('/login');await page.getByRole('button',{name:'Continue as Demo Advisor'}).click();
  await page.goto('/service-orders/new');await page.getByRole('button',{name:'Continue to complaint'}).click();
  const note='aircond not working, engine spoil';
  await page.getByLabel('Original customer complaint').fill(note);
  await page.getByRole('button',{name:'Organize with AI',exact:true}).click();
  await expect(page.locator('.draft-preview')).toContainText('A/C not working');
  await expect(page.locator('.draft-preview')).toContainText('Engine problem reported by customer (unverified)');
  await expect(page.locator('.draft-preview')).toContainText('engine spoil');
  await expect(page.locator('.draft-preview')).toContainText('Inspect engine operation');
  await page.getByRole('button',{name:'Review and Continue'}).click();
  await expect(page.getByRole('button',{name:'Confirm & Save Order'})).toBeDisabled();
  await expect(page.getByLabel('Customer-reported symptoms 2',{exact:true})).toHaveValue(/engine spoil/);
  fs.mkdirSync('artifacts',{recursive:true});await page.screenshot({path:'artifacts/mixed-complaints-review.png',fullPage:true});
});
