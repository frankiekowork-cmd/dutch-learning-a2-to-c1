export default {
  testDir: '.',
  testMatch: '**/*.spec.mjs',
  timeout: 30000,
  expect: { timeout: 10000 },
  retries: 1,
  use: { baseURL: 'http://127.0.0.1:8765', headless: true, browserName: 'chromium' },
  webServer: {
    command: 'python3 -m http.server 8765 --directory web --bind 127.0.0.1',
    cwd: process.cwd(),
    port: 8765,
    reuseExistingServer: !process.env.CI,
    timeout: 15000
  }
};
