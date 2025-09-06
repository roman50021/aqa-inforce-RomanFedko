import { request, FullConfig } from '@playwright/test';

export default async function globalSetup(_config: FullConfig) {
    const ctx = await request.newContext({ baseURL: 'https://automationintesting.online' });
    const username = process.env.ADMIN_USER ?? 'admin';
    const password = process.env.ADMIN_PASS ?? 'password';

    let cookie: string | null = null;
    let lastSnippet = '';


    try {
        const r1 = await ctx.post('/auth/login', {
            data: { username, password },
            headers: {
                'content-type': 'application/json',
                'accept': 'application/json, text/plain, */*',
                'x-requested-with': 'XMLHttpRequest',
            },
        });
        const setCookie = r1.headers()['set-cookie'] ?? '';
        const m = /(?:^|,\s*)token=[^;]+/i.exec(setCookie);
        if (m) cookie = m[0].trim();
        if (!cookie) lastSnippet = (await r1.text().catch(() => ''))?.slice(0, 500) ?? '';
    } catch {}


    if (!cookie) {
        try {
            const r2 = await ctx.post('/auth', {
                data: { username, password },
                headers: { 'content-type': 'application/json', 'accept': 'application/json' },
            });
            if (r2.ok()) {
                const body: any = await r2.json().catch(() => ({}));
                const token = body?.token ?? body?.accessToken;
                if (token) cookie = `token=${token}`;
                else lastSnippet ||= JSON.stringify(body).slice(0, 500);
            } else {
                lastSnippet ||= (await r2.text().catch(() => '')).slice(0, 500);
            }
        } catch {}
    }


    if (!cookie) {
        console.warn(
            'WARN: login endpoints returned HTML/invalid response. Falling back to token=y1.\n' +
            (lastSnippet ? `Last snippet:\n${lastSnippet}\n` : '')
        );
        cookie = 'token=y1';
    }

    process.env.API_TOKEN = cookie!;
    await ctx.dispose();
}
