import { test as base, expect } from '@playwright/test';
import { HomePage } from '../../src/pages/HomePage';
import { RoomDetailsPage } from '../../src/pages/RoomDetailsPage';


export type PO = { home: HomePage; room: RoomDetailsPage };


export const test = base.extend<PO>({
    home: async ({ page }, use) => { await use(new HomePage(page)); },
    room: async ({ page }, use) => { await use(new RoomDetailsPage(page)); }
});


export { expect };