import { Page, expect, Locator } from '@playwright/test';


export class DatePicker {
    private panel: Locator;
    private monthLabel: Locator;
    private nextBtn: Locator;
    private backBtn: Locator;
    private todayBtn: Locator;


    constructor(private readonly page: Page) {
        this.panel = page
            .getByRole('heading', { name: /Book This Room|Book this room|Make a booking/i })
            .locator('xpath=ancestor::*[self::aside or self::div][1]');

        this.monthLabel = this.panel.getByText(
            /January|February|March|April|May|June|July|August|September|October|November|December/i
        ).last();

        this.nextBtn  = this.panel.getByRole('button', { name: /Next/i });
        this.backBtn  = this.panel.getByRole('button', { name: /Back/i });
        this.todayBtn = this.panel.getByRole('button', { name: /Today/i });
    }


    private dayButton = (d: string | number): Locator =>
        this.panel.getByRole('button', { name: new RegExp(`\\b${d}\\b`, 'i') });



    private async currentMonthYear(): Promise<{ year: number; monthIndex: number; label: string }> {
        const label = (await this.monthLabel.textContent())?.trim() ?? '';
        const [monthName, yearStr] = label.split(/\s+/);
        const year = Number(yearStr);
        const months = [
            'January','February','March','April','May','June',
            'July','August','September','October','November','December'
        ];
        const monthIndex = months.findIndex((m) => new RegExp(`^${m}$`, 'i').test(monthName));
        if (year && monthIndex >= 0) return { year, monthIndex, label };
        throw new Error(`Cannot parse calendar label: "${label}"`);
    }


    async goToMonth(targetMonthYear: string): Promise<void> {
        const [tMonthName, tYearStr] = targetMonthYear.trim().split(/\s+/);
        const targetYear = Number(tYearStr);
        const months = [
            'January','February','March','April','May','June',
            'July','August','September','October','November','December'
        ];
        const targetMonthIndex = months.findIndex((m) => new RegExp(`^${m}$`, 'i').test(tMonthName));
        if (targetMonthIndex < 0 || !targetYear) {
            throw new Error(`Invalid target month label: "${targetMonthYear}"`);
        }


        const cur = await this.currentMonthYear();
        const toIndex = (y: number, mIdx: number) => y * 12 + mIdx;
        let diff = toIndex(targetYear, targetMonthIndex) - toIndex(cur.year, cur.monthIndex);


        const maxHops = 24;
        let hops = 0;
        while (diff !== 0) {
            if (diff > 0) { await this.nextBtn.click(); diff--; }
            else { await this.backBtn.click(); diff++; }
            if (++hops > maxHops) throw new Error(`Unable to reach "${targetMonthYear}" within ${maxHops} hops`);
        }
    }


    async selectRange(checkInISO: string, checkOutISO: string): Promise<void> {
        const toParts = (iso: string) => {
            const [y, m, d] = iso.split('-').map(Number);
            return { year: y, month: m, day: d };
        };
        const a = toParts(checkInISO);
        const b = toParts(checkOutISO);


        const start = new Date(a.year, a.month - 1, a.day);
        const end = new Date(b.year, b.month - 1, b.day);
        if (end.getTime() < start.getTime()) {
            throw new Error(`End date (${checkOutISO}) is earlier than start date (${checkInISO})`);
        }


        const monthName = (y: number, m: number) => `${new Date(y, m - 1).toLocaleString('en-GB', { month: 'long' })} ${y}`;


        await this.goToMonth(monthName(a.year, a.month));
        await this.dayButton(String(a.day)).click();


        if (a.year !== b.year || a.month !== b.month) {
            await this.goToMonth(monthName(b.year, b.month));
        }
        await this.dayButton(String(b.day)).click();
    }


    async expectDayDisabled(day: number): Promise<void> {
        const btn = this.dayButton(String(day)).first();

        if ((await btn.count()) === 0) return;

        const ariaDisabled = await btn.getAttribute('aria-disabled');
        const disabledAttr = await btn.getAttribute('disabled');
        const className    = (await btn.getAttribute('class')) ?? '';
        const looksDisabled =
            ariaDisabled === 'true' ||
            !!disabledAttr ||
            /(unavail|disabled|grey|inactive|booked|blocked)/i.test(className);

        const monthRow = btn.locator('xpath=ancestor::div[contains(@class,"rbc-month-row")][1]');
        const segment  = monthRow
            .locator('.rbc-event') // сам бар
            .filter({ has: monthRow.locator('.rbc-event-content').filter({ hasText: /Unavailable/i }) })
            .first();

        let coversCell = false;
        try {
            const [cellBox, segBox] = await Promise.all([btn.boundingBox(), segment.boundingBox()]);
            if (cellBox && segBox) {
                // перетинаються по площі?
                const noIntersect =
                    segBox.x > cellBox.x + cellBox.width ||
                    segBox.x + segBox.width < cellBox.x ||
                    segBox.y > cellBox.y + cellBox.height ||
                    segBox.y + segBox.height < cellBox.y;
                coversCell = !noIntersect;
            }
        } catch { }

        expect(looksDisabled || coversCell).toBeTruthy();
    }


    async expectRangeDisabled(startISO: string, endISO: string): Promise<void> {
        let cur = new Date(startISO);
        const end = new Date(endISO);
        while (cur <= end) {
            const label = `${cur.toLocaleString('en-GB', { month: 'long' })} ${cur.getFullYear()}`;
            await this.goToMonth(label);
            await this.expectDayDisabled(cur.getDate());
            cur.setDate(cur.getDate() + 1);
        }
    }

}