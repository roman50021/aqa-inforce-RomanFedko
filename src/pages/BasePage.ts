import { Page, Locator, expect } from '@playwright/test';


export abstract class BasePage {
    protected readonly page: Page;


    constructor(page: Page) {
        this.page = page;
    }


    async openPath(path: string): Promise<void> {
        await this.page.goto(path, { waitUntil: 'domcontentloaded' });
    }


    async waitVisible(locator: Locator, timeout = 5_000): Promise<void> {
        await expect(locator).toBeVisible({ timeout });
    }


    async clickByRole(name: string | RegExp, role: 'button' | 'link' = 'button'): Promise<void> {
        await this.page.getByRole(role, { name }).click();
    }


    async fillByPlaceholder(placeholder: string | RegExp, value: string): Promise<void> {
        await this.page.getByPlaceholder(placeholder).fill(value);
    }


    async expectText(text: string | RegExp): Promise<void> {
        await expect(this.page.getByText(text).first()).toBeVisible();
    }


    async urlShouldContain(part: string | RegExp): Promise<void> {
        await expect(this.page).toHaveURL(part);
    }


    async screenshot(name: string): Promise<string> {
        const path = `screenshots/${name}.png`;
        await this.page.screenshot({ path, fullPage: true });
        return path;
    }
}