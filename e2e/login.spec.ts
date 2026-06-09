import { test, expect } from "@playwright/test"

test.describe("Login flow", () => {
  test("shows login page with form elements", async ({ page }) => {
    await page.goto("/login")

    await expect(page.locator("h2")).toContainText("Simko")
    await expect(page.locator("form")).toBeVisible()
    await expect(page.locator("#email")).toBeVisible()
    await expect(page.locator("#password")).toBeVisible()
    await expect(page.getByRole("button", { name: "Masuk" })).toBeVisible()
  })

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/login")

    await page.fill("#email", "wrong@email.com")
    await page.fill("#password", "wrongpassword")
    await page.getByRole("button", { name: "Masuk" }).click()

    await expect(page.locator("text=Email atau password salah")).toBeVisible()
  })

  test("logs in with valid credentials and redirects to dashboard", async ({ page }) => {
    const email = process.env.E2E_PENGURUS_EMAIL
    const password = process.env.E2E_PENGURUS_PASSWORD

    test.skip(!email || !password, "E2E_PENGURUS_EMAIL / E2E_PENGURUS_PASSWORD not set")

    await page.goto("/login")
    await page.fill("#email", email!)
    await page.fill("#password", password!)
    await page.getByRole("button", { name: "Masuk" }).click()

    await page.waitForURL("**/pengurus")
    await expect(page.locator("h1")).toContainText("Dashboard Pengurus")
  })

  test("remember me checkbox saves credentials", async ({ page }) => {
    const email = process.env.E2E_PENGURUS_EMAIL
    const password = process.env.E2E_PENGURUS_PASSWORD

    test.skip(!email || !password, "E2E_PENGURUS_EMAIL / E2E_PENGURUS_PASSWORD not set")

    await page.goto("/login")
    await page.fill("#email", email!)
    await page.fill("#password", password!)
    await page.getByLabel("Ingat Saya").check()
    await page.getByRole("button", { name: "Masuk" }).click()

    await page.waitForURL("**/pengurus")

    // Clear session and go back to login — saved creds should be there
    await page.evaluate(() => {
      document.cookie =
        "next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      document.cookie =
        "__Secure-next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    })
    await page.goto("/login")

    const savedEmail = await page.inputValue("#email")
    const savedPassword = await page.inputValue("#password")
    expect(savedEmail).toBe(email!)
    expect(savedPassword).toBe(password!)
  })

  test("toggles password visibility", async ({ page }) => {
    await page.goto("/login")
    await page.fill("#password", "secret123")
    const eyeButton = page.locator("button[tabindex='-1']")
    await expect(page.locator("#password")).toHaveAttribute("type", "password")
    await eyeButton.click()
    await expect(page.locator("#password")).toHaveAttribute("type", "text")
    await eyeButton.click()
    await expect(page.locator("#password")).toHaveAttribute("type", "password")
  })
})
