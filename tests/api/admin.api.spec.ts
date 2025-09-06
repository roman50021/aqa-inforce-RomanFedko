import { test, expect, request } from '@playwright/test';
import { AITApiClient } from './client';

const rand = () => Math.floor(Math.random() * 99999);

const roomPayload = () => ({
    roomName: `QA Suite ${rand()}`,
    type: 'Suite',
    accessible: true,
    image: 'https://picsum.photos/seed/qa/800/600',
    description: 'Created via API test',
    features: ['TV', 'WiFi', 'Safe'],
    roomPrice: 225
});

const bookingPayload = (roomId: number | string, checkIn: string, checkOut: string) => ({
    roomid: roomId,
    firstname: 'Roman',
    lastname: 'Fedko',
    email: `roman.fedko+api${rand()}@example.com`,
    phone: '01234567890',
    depositpaid: false,
    bookingdates: { checkin: checkIn, checkout: checkOut }
});

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function futureRange(off = 20, nights = 1) {
    const a = new Date(); a.setDate(a.getDate() + off);
    const b = new Date(a); b.setDate(a.getDate() + nights);
    return { a: iso(a), b: iso(b) };
}

test.describe('API flows (Admin/User)', () => {
    test('create → verify → edit → book → delete', async ({ request }) => {
        const api = new AITApiClient(request);

        const cookie = process.env.API_TOKEN!;
        expect(cookie, 'API_TOKEN was not set by global-setup').toBeTruthy();

        const created = await api.createRoom(cookie, roomPayload());
        const id = created?.roomid ?? created?.roomId ?? created?.id;
        expect(id).toBeTruthy();

        const rooms = await api.listRooms();
        expect(JSON.stringify(rooms)).toContain(String(id));

        const newName = `QA Suite ${rand()} (edited)`;
        await api.updateRoom(cookie, id, { roomName: newName, roomPrice: 199 });
        const rooms2 = await api.listRooms();
        expect(JSON.stringify(rooms2)).toContain(newName);

        const { a, b } = futureRange(25, 1);
        const booking = await api.bookRoom(bookingPayload(id, a, b));
        expect(JSON.stringify(booking)).toMatch(/book|confirm|id/i);

        await api.deleteRoom(cookie, id);
        const rooms3 = await api.listRooms();
        expect(JSON.stringify(rooms3)).not.toContain(String(id));
    });
});
