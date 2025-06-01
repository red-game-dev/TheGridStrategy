import type { LayoutLoad } from './$types';

export const ssr = false; // Disable SSR for wallet integration
export const prerender = false;

export const load: LayoutLoad = async () => {
return {};
};