import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/ui",
  timeout: 30_000,
  retries: 0,
  workers: 1,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:8000",
    browserName: "chromium",
    trace: "retain-on-failure"
  },
  webServer: {
    command: "python3 -m http.server 8000 --bind 127.0.0.1",
    url: "http://127.0.0.1:8000/rede.html",
    reuseExistingServer: false,
    timeout: 30_000
  }
});
