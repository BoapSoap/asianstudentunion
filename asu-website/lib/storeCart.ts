export const STORE_CART_STORAGE_KEY = "asu_store_cart_v1";
export const STORE_CART_UPDATED_EVENT = "asu-store-cart-updated";
export const STORE_CART_OPEN_EVENT = "asu-store-cart-open";
export const STORE_CART_OPEN_SESSION_KEY = "asu-store-open-cart";

type UnknownCartItem = {
  quantity?: unknown;
};

export function readStoreCartItems(): unknown[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORE_CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function countStoreCartItems(items: unknown[]): number {
  return items.reduce<number>((sum, item) => {
    const quantity = Number((item as UnknownCartItem).quantity);
    if (!Number.isFinite(quantity) || quantity < 1) return sum;
    return sum + Math.trunc(quantity);
  }, 0);
}

export function readStoreCartCount(): number {
  return countStoreCartItems(readStoreCartItems());
}

export function writeStoreCartItems(items: unknown[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORE_CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(
    new CustomEvent<{ count: number }>(STORE_CART_UPDATED_EVENT, {
      detail: { count: countStoreCartItems(items) },
    })
  );
}

export function emitOpenStoreCart() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(STORE_CART_OPEN_EVENT));
}
