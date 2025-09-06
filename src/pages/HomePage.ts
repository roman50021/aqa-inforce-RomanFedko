import { BasePage } from './BasePage';
import { expect, Page, Locator } from '@playwright/test';


export class HomePage extends BasePage {
    private checkInInput: Locator;
    private checkOutInput: Locator;
    private checkAvailabilityBtn: Locator;


    constructor(page: Page) {
        super(page);


        const byLabelIn = page.getByLabel(/^Check In$/i);
        const byLabelOut = page.getByLabel(/^Check Out$/i);
        const byRoleIn = page.getByRole('textbox', { name: /^Check In$/i });
        const byRoleOut = page.getByRole('textbox', { name: /^Check Out$/i });
        const inputsInBooking = page.locator('section#booking input');


        this.checkInInput = byLabelIn.or(byRoleIn).or(inputsInBooking.nth(0));
        this.checkOutInput = byLabelOut.or(byRoleOut).or(inputsInBooking.nth(1));
        this.checkAvailabilityBtn = page
            .locator('section#booking')
            .getByRole('button', { name: /Check Availability/i });
    }


    private ourRoomsRoot(): Locator {
        const section = this.page.locator('section#rooms');
        const fromHeading = this.page
            .getByRole('heading', { name: /Our Rooms/i })
            .locator('xpath=ancestor::section[1]');
        return section.or(fromHeading);
    }


    async open(): Promise<void> {
        await this.openPath('/');
        const heading = this.page.getByRole('heading', { name: /Our Rooms/i });
        await expect(heading).toBeVisible();
        await heading.scrollIntoViewIfNeeded();
    }


    async quickAvailability(checkInISO: string, checkOutISO: string): Promise<void> {
        await this.checkInInput.fill(checkInISO);
        await this.checkOutInput.fill(checkOutISO);
        await expect(this.checkAvailabilityBtn).toBeEnabled();
        await this.checkAvailabilityBtn.click();
    }


    async openRoomDetails(): Promise<void> {
        const root = this.ourRoomsRoot();

        await root.waitFor({ state: 'attached', timeout: 3000 }).catch(() => {});

        const hasRoot = (await root.count()) > 0;

        const link = hasRoot
            ? root
                .getByRole('link', { name: /Book now/i })
                .or(root.locator('a[href^="/reservation/"]'))
                .first()
            : this.page.getByRole('link', { name: /Book now/i }).first();

        await expect(link).toBeVisible({ timeout: 10_000 });

        await Promise.all([
            this.page.waitForURL(/\/reservation\/\d+(?:\?.*)?$/, { timeout: 15_000 }),
            link.click()
        ]);
    }




}