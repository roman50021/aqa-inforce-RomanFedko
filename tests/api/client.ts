import { APIRequestContext, expect } from '@playwright/test';


export class AITApiClient {
    constructor(
        private readonly request: APIRequestContext,
        private readonly base = 'https://automationintesting.online'
    ) {}


    async authCookie(username = 'admin', password = 'password'): Promise<string> {
        const resp = await this.request.post(`${this.base}/auth/login`, { data: { username, password } });
        expect(resp.status(), await resp.text()).toBe(200);
        const setCookie = resp.headers()['set-cookie'] ?? '';
        const cookie = /token=[^;]+/.exec(setCookie)?.[0] ?? '';
        expect(cookie).not.toBe('');
        return cookie;
    }


    async createRoom(cookie: string, payload: any): Promise<any> {
        const resp = await this.request.post(`${this.base}/room/`, { data: payload, headers: { cookie } });
        expect(resp.status(), await resp.text()).toBe(201);
        return resp.json();
    }


    async listRooms(): Promise<any[]> {
        const resp = await this.request.get(`${this.base}/room/`);
        expect(resp.status(), await resp.text()).toBe(200);
        return resp.json();
    }


    async updateRoom(cookie: string, id: number | string, patch: any): Promise<any> {
        const resp = await this.request.put(`${this.base}/room/${id}`, { data: patch, headers: { cookie } });
        expect(resp.status(), await resp.text()).toBe(202);
        return resp.json();
    }


    async deleteRoom(cookie: string, id: number | string): Promise<void> {
        const resp = await this.request.delete(`${this.base}/room/${id}`, { headers: { cookie } });
        expect(resp.status(), await resp.text()).toBe(202);
    }


    async bookRoom(payload: any): Promise<any> {
        const resp = await this.request.post(`${this.base}/booking/`, { data: payload });
        expect(resp.status(), await resp.text()).toBe(201);
        return resp.json();
    }


    async listBookings(cookie?: string): Promise<any[]> {
        const resp = await this.request.get(`${this.base}/booking/`, {
            headers: cookie ? { cookie } : undefined,
        });
        expect(resp.status(), await resp.text()).toBe(200);
        return resp.json();
    }


    async getBooking(id: number | string, cookie?: string): Promise<any | null> {
        const resp = await this.request.get(`${this.base}/booking/${id}`, {
            headers: cookie ? { cookie } : undefined,
        });
        if (resp.status() === 200) return resp.json();
        expect([200, 404, 204]).toContain(resp.status());
        return null;
    }
}