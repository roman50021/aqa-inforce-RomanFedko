import { test, expect } from '../fixtures/po-fixture';
import { dates, validUser } from '../fixtures/testData';


// Validate that POST /booking payload matches form inputs (bonus: intercept)


test.describe('TC_UI_001 – Booking with Valid Data', () => {
    test('creates booking, shows success, and sends correct payload', async ({ home, room, page }, testInfo) => {
        if (testInfo.project.name.toLowerCase().includes('webkit')) test.slow();


// Intercept POST /booking and capture body
        let captured: any = null;
        await page.route('**/booking*', async (route) => {
            const req = route.request();
            if (req.method() === 'POST') {
                try { captured = req.postDataJSON(); } catch {}
            }
            await route.continue();
        });


        await test.step('Open home page', async () => { await home.open(); });


        await test.step('Open room details', async () => {
            await home.openRoomDetails();
            await room.opened();
        });


        await test.step(`Select dates ${dates.checkIn} → ${dates.checkOut} & open form`, async () => {
            await room.openFormForRange(dates.checkIn, dates.checkOut);
        });


        const u = validUser();
        await test.step('Fill booking form with valid data', async () => {
            await room.form.fill(u.first, u.last, u.email, u.phone);
        });


        await test.step('Submit reservation', async () => { await room.submitReservation(); });


        await test.step('Expect booking confirmation with selected dates', async () => {
            await room.form.expectSuccess();
            await room.form.expectDates(dates.checkIn, dates.checkOut);
        });


        await test.step('Validate booking payload sent to API', async () => {
            expect(captured, 'No booking request captured').toBeTruthy();
            expect(captured).toMatchObject({
                firstname: u.first,
                lastname: u.last,
                email: u.email,
                bookingdates: { checkin: dates.checkIn, checkout: dates.checkOut },
            });
        });
    });
});