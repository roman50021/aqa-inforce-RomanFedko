const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;


export const nextRange = (offsetDays = 10, nights = 1) => {
    const start = new Date();
    start.setDate(start.getDate() + offsetDays);
    const end = new Date(start);
    end.setDate(start.getDate() + nights);
    return { checkIn: toISO(start), checkOut: toISO(end) };
};


export const dates = nextRange(6, 1);


export const bookedRange = nextRange(12, 2);


export const validUser = (suffix = Date.now()) => ({
    first: 'Roman',
    last: 'Fedko',
    email: `roman.fedko+${suffix}@example.com`,
    phone: '380930398025'
});

export const invalidUser = {
    first: '',
    last: 'F',
    email: 'not-an-email',
    phone: 'abc'
};