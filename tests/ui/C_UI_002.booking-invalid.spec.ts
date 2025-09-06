import { test } from '../fixtures/po-fixture';
import { dates, invalidUser } from '../fixtures/testData';


test.describe('TC_UI_002 – Booking with Invalid Data', () => {
    test('keeps user on form and shows per-field validation', async ({ home, room }) => {
        await home.open();
        await home.openRoomDetails();
        await room.opened();


        await room.openFormForRange(dates.checkIn, dates.checkOut);

        await room.form.fill(invalidUser.first, invalidUser.last, invalidUser.email, invalidUser.phone);


        await room.submitReservation();
        await room.form.expectValidationVisible();
    });
});