import { Page, expect, Locator } from '@playwright/test';

export class BookingForm {
    private firstNameInput: Locator;
    private lastNameInput: Locator;
    private emailInput: Locator;
    private phoneInput: Locator;

    private headingConfirmed: Locator;
    private returnHomeCtrl: Locator;
    private errorAlert: Locator;


    constructor(private readonly page: Page) {
        this.firstNameInput = page.getByPlaceholder(/Firstname/i);
        this.lastNameInput  = page.getByPlaceholder(/Lastname/i);
        this.emailInput     = page.getByPlaceholder(/Email/i);
        this.phoneInput     = page.getByPlaceholder(/Phone/i);

        this.headingConfirmed = page.getByRole('heading', { name: /^Booking Confirmed$/i }).first();

        const btn  = page.getByRole('button', { name: /Return home|Back to home/i });
        const link = page.getByRole('link',   { name: /Return home|Back to home/i });
        this.returnHomeCtrl = btn.or(link).first();

        this.errorAlert = page.locator('[role="alert"], .alert');
    }


    private getConfirmCard(): Locator {
        const heading = this.page
            .getByRole('heading', { name: /Booking Confirmed|Booking Successful|Reservation confirmed/i })
            .first();

        const textConfirmed = this.page.getByText(/Your booking has been confirmed/i).first();

        const anchor = heading.or(textConfirmed).or(this.returnHomeCtrl);

        return this.page
            .locator('.booking-card, .card, [role="region"], .container')
            .filter({ has: anchor })
            .first();
    }


    private get confirmCard(): Locator {
        return this.getConfirmCard();
    }


    async fill(first: string, last: string, email: string, phone: string) {
        await this.firstNameInput.fill(first);
        await this.lastNameInput.fill(last);
        await this.emailInput.fill(email);
        await this.phoneInput.fill(phone);
    }


    async expectSuccess(): Promise<void> {
        await this.page.waitForLoadState('domcontentloaded').catch(() => {});
        const successMarker = this.headingConfirmed
            .or(this.page.getByRole('heading', { name: /Booking Successful|Reservation confirmed/i }))
            .or(this.returnHomeCtrl)
            .first();

        const errorPage = this.page.getByText(/^Application error:/i).first();
        if (await errorPage.isVisible({ timeout: 1000 }).catch(() => false)) {
            throw new Error('Site returned "Application error" after booking (flaky demo).');
        }

        await expect(successMarker).toBeVisible({ timeout: 30_000 });
    }


    private altFor(iso: string) {
        const [y, m, d] = iso.split('-');
        const dNum = String(Number(d));
        const nbsp = '\u00A0\u2009\u202F';
        const sp   = `[\\s${nbsp}]+`;
        return `(?:${iso}|${d}/${m}/${y}|${d}-${m}-${y}|${dNum}${sp}[A-Za-z]{3,}${sp}${y})`;
    }


    async expectDates(checkInISO: string, checkOutISO: string): Promise<void> {
        const inRe  = new RegExp(`\\b${this.altFor(checkInISO)}\\b`,  'i');
        const outRe = new RegExp(`\\b${this.altFor(checkOutISO)}\\b`, 'i');

        const container = (await this.confirmCard.count()) > 0 ? this.confirmCard : this.page;

        await expect(container.getByText(inRe).first()).toBeVisible({ timeout: 20_000 });
        await expect(container.getByText(outRe).first()).toBeVisible({ timeout: 20_000 });
    }


    async expectValidationVisible(): Promise<void> {
        const anyError = this.errorAlert
            .or(this.page.locator('.invalid, .error, [aria-invalid="true"]'))
            .first();
        await expect(anyError).toBeVisible();
        await expect(this.headingConfirmed).toBeHidden();
    }


    async returnHome(): Promise<void> {
        if (await this.returnHomeCtrl.isVisible()) {
            await Promise.all([
                this.page.waitForURL(/\/(?:$|#)/, { timeout: 8_000 }).catch(() => null),
                this.returnHomeCtrl.click(),
            ]);
        }
        if (!/automationintesting\.online\/?$/.test(this.page.url())) {
            await this.page.goto('/', { waitUntil: 'domcontentloaded' });
        }
        await this.page.getByRole('heading', { name: /Our Rooms/i }).waitFor({ state: 'visible' });
    }
}
