import { test, expect } from "@playwright/test"

const email = process.env.E2E_PENGURUS_EMAIL
const password = process.env.E2E_PENGURUS_PASSWORD

test.describe("Navigation — Pengurus", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!email || !password, "E2E_PENGURUS_EMAIL / E2E_PENGURUS_PASSWORD not set")

    await page.goto("/login")
    await page.fill("#email", email!)
    await page.fill("#password", password!)
    await page.getByRole("button", { name: "Masuk" }).click()
    await page.waitForURL("**/pengurus")
  })

  test("dashboard shows stat cards", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Dashboard Pengurus")
    const cards = page.locator("main .grid >> div")
    const count = await cards.count()
    expect(count).toBeGreaterThanOrEqual(5)
  })

  test("sidebar navigation items are visible", async ({ page }) => {
    const sidebar = page.locator("aside")
    await expect(sidebar.getByText("Dashboard")).toBeVisible()
    await expect(sidebar.getByText("Anggota")).toBeVisible()
    await expect(sidebar.getByText("Struktur Organisasi")).toBeVisible()
    await expect(sidebar.getByText("Simpanan")).toBeVisible()
    await expect(sidebar.getByText("Pinjaman")).toBeVisible()
    await expect(sidebar.getByText("Akuntansi")).toBeVisible()
    await expect(sidebar.getByText("SHU")).toBeVisible()
    await expect(sidebar.getByText("Tutup Buku")).toBeVisible()
    await expect(sidebar.getByText("Users")).toBeVisible()
    await expect(sidebar.getByText("Pengaturan")).toBeVisible()
  })

  test("navigates to Anggota page", async ({ page }) => {
    await page.locator("aside").getByText("Anggota").click()
    await page.waitForURL("**/pengurus/anggota")
    await expect(page.locator("h1")).toContainText("Anggota")
  })

  test("navigates to Simpanan page", async ({ page }) => {
    await page.locator("aside").getByText("Simpanan").click()
    await page.waitForURL("**/pengurus/simpanan")
    await expect(page.locator("h1")).toContainText("Simpanan")
  })

  test("navigates to Pinjaman page", async ({ page }) => {
    await page.locator("aside").getByText("Pinjaman").click()
    await page.waitForURL("**/pengurus/pinjaman")
    await expect(page.locator("h1")).toContainText("Pinjaman")
  })

  test("navigates to Tutup Buku page", async ({ page }) => {
    await page.locator("aside").getByText("Tutup Buku").click()
    await page.waitForURL("**/pengurus/tutup-buku")
    await expect(page.locator("h1")).toContainText("Tutup Buku")
  })

  test("navigates to Struktur Organisasi", async ({ page }) => {
    await page.locator("aside").getByText("Struktur Organisasi").click()
    await page.waitForURL("**/pengurus/struktur")
    await expect(page.locator("h1")).toContainText("Struktur")
  })

  test("navigates to SHU page", async ({ page }) => {
    await page.locator("aside").getByText("SHU").click()
    await page.waitForURL("**/pengurus/shu")
    await expect(page.locator("h1")).toContainText("SHU")
  })

  test("navigates to Users page", async ({ page }) => {
    await page.locator("aside").getByText("Users").click()
    await page.waitForURL("**/pengurus/users")
    await expect(page.locator("h1")).toContainText("Users")
  })

  test("navigates to Pengaturan page", async ({ page }) => {
    await page.locator("aside").getByText("Pengaturan").click()
    await page.waitForURL("**/pengurus/konfigurasi")
    await expect(page.locator("h1")).toContainText("Pengaturan")
  })

  test("Akuntansi submenu shows children", async ({ page }) => {
    const akuntansi = page.locator("aside").getByText("Akuntansi")
    await akuntansi.click()
    await expect(page.getByText("Jurnal Umum")).toBeVisible()
    await expect(page.getByText("Buku Besar")).toBeVisible()
    await expect(page.getByText("Neraca Saldo")).toBeVisible()
    await expect(page.getByText("Neraca")).toBeVisible()
    await expect(page.getByText("Laba / Rugi")).toBeVisible()
    await expect(page.getByText("Arus Kas")).toBeVisible()
    await expect(page.getByText("Audit Log")).toBeVisible()
  })

  test("logs out via sidebar button", async ({ page }) => {
    await page.locator("aside").getByText("Keluar").click()
    await page.waitForURL("**/login")
    await expect(page.locator("form")).toBeVisible()
  })
})
