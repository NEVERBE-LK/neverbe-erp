export interface OrderItem {
  itemId: string;
  productId?: string;
  variantId: string;
  name: string;
  variantName: string;
  size: string;
  quantity: number;
  price: number;
  discount: number;
  itemType?: "PRODUCT" | "COMBO" | "combo";
  bPrice?: number; // Buying price for profit calculation
  buyingPrice?: number;
  comboId?: string; // Parent combo bundle ID
  comboName?: string; // Parent combo bundle name
  isComboItem?: boolean; // Flag for combo bundle items
}
