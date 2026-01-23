/**
 * Event Icons - Cloudinary URLs for event type icons
 *
 * These icons are used in report slides to visually represent different event types
 * All icons are 168x168px PNG files hosted on Cloudinary
 */

export const EVENT_ICONS = {
  // Pricing Events
  pricing: {
    discount_added: 'https://res.cloudinary.com/dd6dkaan9/image/upload/v1769097285/discount_added.png',
    discount_changed: 'https://res.cloudinary.com/dd6dkaan9/image/upload/v1769097402/pricing_events/pricing_events/discount_changed.png',
    discount_removed: 'https://res.cloudinary.com/dd6dkaan9/image/upload/v1769097403/pricing_events/pricing_events/discount_removed.png',
    price_decreased: 'https://res.cloudinary.com/dd6dkaan9/image/upload/v1769097404/pricing_events/pricing_events/price_decreased.png',
    price_hidden: 'https://res.cloudinary.com/dd6dkaan9/image/upload/v1769097405/pricing_events/pricing_events/price_hidden.png',
    price_increased: 'https://res.cloudinary.com/dd6dkaan9/image/upload/v1769097405/pricing_events/pricing_events/price_increased.png',
    price_revealed: 'https://res.cloudinary.com/dd6dkaan9/image/upload/v1769097406/pricing_events/pricing_events/price_revealed.png',
    pricing_restructured: 'https://res.cloudinary.com/dd6dkaan9/image/upload/v1769097406/pricing_events/pricing_events/pricing_restructured.png',
  },

  // Packaging Events
  packaging: {
    addon_added: 'https://res.cloudinary.com/dd6dkaan9/image/upload/v1769097421/packaging_events/packaging_events/addon_added.png',
    addon_changed: 'https://res.cloudinary.com/dd6dkaan9/image/upload/v1769097422/packaging_events/packaging_events/addon_changed.png',
    addon_removed: 'https://res.cloudinary.com/dd6dkaan9/image/upload/v1769097422/packaging_events/packaging_events/addon_removed.png',
    capacity_decreased: 'https://res.cloudinary.com/dd6dkaan9/image/upload/v1769097424/packaging_events/packaging_events/capacity_decreased.png',
    capacity_increased: 'https://res.cloudinary.com/dd6dkaan9/image/upload/v1769097424/packaging_events/packaging_events/capacity_increased.png',
    freemium_changed: 'https://res.cloudinary.com/dd6dkaan9/image/upload/v1769097425/packaging_events/packaging_events/freemium_changed.png',
    plan_added: 'https://res.cloudinary.com/dd6dkaan9/image/upload/v1769097426/packaging_events/packaging_events/plan_added.png',
    plan_removed: 'https://res.cloudinary.com/dd6dkaan9/image/upload/v1769097426/packaging_events/packaging_events/plan_removed.png',
    plan_renamed: 'https://res.cloudinary.com/dd6dkaan9/image/upload/v1769097427/packaging_events/packaging_events/plan_renamed.png',
    pricing_metric_changed: 'https://res.cloudinary.com/dd6dkaan9/image/upload/v1769097428/packaging_events/packaging_events/pricing_metric_changed.png',
    threshold_added: 'https://res.cloudinary.com/dd6dkaan9/image/upload/v1769097429/packaging_events/packaging_events/threshold_added.png',
    threshold_removed: 'https://res.cloudinary.com/dd6dkaan9/image/upload/v1769097429/packaging_events/packaging_events/threshold_removed.png',
    trial_changed: 'https://res.cloudinary.com/dd6dkaan9/image/upload/v1769097439/packaging_events/packaging_events/trial_changed.png',
  },

  // Product Events
  product: {
    feature_added: 'https://res.cloudinary.com/dd6dkaan9/image/upload/v1769097439/product_events/product_events/feature_added.png',
    feature_changed: 'https://res.cloudinary.com/dd6dkaan9/image/upload/v1769097440/product_events/product_events/feature_changed.png',
    feature_removed: 'https://res.cloudinary.com/dd6dkaan9/image/upload/v1769097441/product_events/product_events/feature_removed.png',
  },
} as const;

/**
 * Helper function to get icon URL for a specific event type
 * @param category - Event category (pricing, packaging, product)
 * @param eventType - Specific event type (e.g., 'price_increased', 'feature_added')
 * @returns Cloudinary URL for the icon, or undefined if not found
 */
export function getEventIcon(
  category: 'pricing' | 'packaging' | 'product',
  eventType: string
): string | undefined {
  const categoryIcons = EVENT_ICONS[category];
  if (!categoryIcons) return undefined;

  return categoryIcons[eventType as keyof typeof categoryIcons];
}

/**
 * Type-safe event type names for each category
 */
export type PricingEventType = keyof typeof EVENT_ICONS.pricing;
export type PackagingEventType = keyof typeof EVENT_ICONS.packaging;
export type ProductEventType = keyof typeof EVENT_ICONS.product;
export type EventType = PricingEventType | PackagingEventType | ProductEventType;

/**
 * Get all event types for a category
 * @param category - Event category
 * @returns Array of event type names
 */
export function getEventTypesForCategory(
  category: 'pricing' | 'packaging' | 'product'
): string[] {
  return Object.keys(EVENT_ICONS[category]);
}
