import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/browser',timeout:60000,fullyParallel:false,workers:1,retries:0,use:{baseURL:process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:3000',channel:'chrome',headless:true,viewport:{width:1440,height:1000},screenshot:'only-on-failure',trace:'retain-on-failure'},reporter:[['list'],['html',{open:'never'}]]});
