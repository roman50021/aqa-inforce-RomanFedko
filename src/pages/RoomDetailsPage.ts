import { BasePage } from './BasePage';
import { DatePicker } from '../components/DatePicker';
import { BookingForm } from '../components/BookingForm';
import { expect, Locator, Page } from '@playwright/test';

export class RoomDetailsPage extends BasePage {
    private reserveNowBtn: Locator;
    private bookBtn: Locator;
    private submitBtn: Locator;
    private priceSummaryHeading: Locator;
    readonly datePicker: DatePicker;
    readonly form: BookingForm;


    constructor(page: Page) {
        super(page);
        this.reserveNowBtn = page.getByRole('button', { name: /Reserve Now/i }).first();
        this.bookBtn = page.getByRole('button', { name: /^Book$/i }); // не .first() тут
        this.submitBtn = this.bookBtn.or(this.reserveNowBtn).first(); // ⬅ ключова зміна
        this.priceSummaryHeading = page.getByRole('heading', { name: /Price Summary/i });
        this.datePicker = new DatePicker(page);
        this.form = new BookingForm(page);
    }


    async opened(): Promise<void> {
        await this.page.waitForLoadState('domcontentloaded');
        const marker = this.page
            .getByRole('heading', { name: /Book This Room|Book this room|Make a booking/i })
            .or(this.priceSummaryHeading)
            .first();
        await expect(marker).toBeVisible();
    }


    async openFormForRange(checkInISO: string, checkOutISO: string): Promise<void> {
        await this.datePicker.selectRange(checkInISO, checkOutISO);

        const openBtn = this.page.getByRole('button', { name: /Reserve Now|Book/i }).first();
        await expect(openBtn).toBeEnabled();
        await openBtn.click();

        await this.page.getByPlaceholder(/Firstname/i).waitFor({ state: 'visible', timeout: 10_000 });
    }


    async submitReservation(): Promise<void> {
        const submit = this.page.getByRole('button', { name: /Reserve Now|Book/i }).first();
        await expect(submit).toBeEnabled();

        await Promise.allSettled([
            this.page.waitForResponse(r => /\/booking\b/i.test(r.url()) && r.request().method() === 'POST'),
            submit.click(),
        ]);

        await this.page.waitForLoadState('domcontentloaded').catch(() => {});
    }

}
