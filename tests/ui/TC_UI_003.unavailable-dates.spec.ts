import { test } from '../fixtures/po-fixture';
import { nextRange, validUser } from '../fixtures/testData';


test.describe('TC_UI_003 – Booked dates become disabled', () => {
    test('after booking, same dates are disabled in calendar', async ({ home, room }) => {
        const range = nextRange(15, 1);


        await home.open();
        await home.openRoomDetails();
        await room.opened();
        await room.openFormForRange(range.checkIn, range.checkOut);
        const u = validUser();
        await room.form.fill(u.first, u.last, u.email, u.phone);
        await room.submitReservation();
        await room.form.expectSuccess();


        await room.form.returnHome();
        await home.openRoomDetails();
        await room.opened();


        await room.datePicker.expectRangeDisabled(range.checkIn, range.checkOut);
    });
});