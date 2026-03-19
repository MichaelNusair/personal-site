export interface MockProduct {
  id: string;
  name: string;
  price: number;
  currency: string;
  url: string;
  inStock: boolean;
  description: string;
  category: string;
}

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: 'prod-001',
    name: 'Wireless Noise-Cancelling Headphones',
    price: 149.99,
    currency: 'USD',
    url: 'https://demo.talkpilot.com/products/wireless-headphones',
    inStock: true,
    description: 'Premium over-ear headphones with active noise cancellation, 30-hour battery life, and Bluetooth 5.3.',
    category: 'Electronics',
  },
  {
    id: 'prod-002',
    name: 'Smart Fitness Watch',
    price: 199.99,
    currency: 'USD',
    url: 'https://demo.talkpilot.com/products/smart-fitness-watch',
    inStock: true,
    description: 'GPS-enabled fitness watch with heart rate monitor, sleep tracking, and 7-day battery. Water resistant to 50m.',
    category: 'Electronics',
  },
  {
    id: 'prod-003',
    name: 'Organic Cotton T-Shirt',
    price: 34.99,
    currency: 'USD',
    url: 'https://demo.talkpilot.com/products/organic-cotton-tshirt',
    inStock: true,
    description: '100% organic cotton crew neck t-shirt. Available in black, white, navy, and sage green. Unisex fit.',
    category: 'Clothing',
  },
  {
    id: 'prod-004',
    name: 'Merino Wool Sweater',
    price: 89.99,
    currency: 'USD',
    url: 'https://demo.talkpilot.com/products/merino-wool-sweater',
    inStock: true,
    description: 'Lightweight merino wool pullover sweater. Naturally temperature-regulating and odor-resistant. Sizes S-XXL.',
    category: 'Clothing',
  },
  {
    id: 'prod-005',
    name: 'Ceramic Pour-Over Coffee Set',
    price: 45.00,
    currency: 'USD',
    url: 'https://demo.talkpilot.com/products/pour-over-coffee-set',
    inStock: true,
    description: 'Handcrafted ceramic dripper and carafe set. Includes 50 paper filters. Makes up to 4 cups.',
    category: 'Home & Kitchen',
  },
  {
    id: 'prod-006',
    name: 'Bamboo Desk Organizer',
    price: 29.99,
    currency: 'USD',
    url: 'https://demo.talkpilot.com/products/bamboo-desk-organizer',
    inStock: false,
    description: 'Sustainable bamboo desktop organizer with phone stand, pen holder, and 3 compartments. Dimensions: 10" x 6" x 4".',
    category: 'Home & Kitchen',
  },
  {
    id: 'prod-007',
    name: 'Portable Bluetooth Speaker',
    price: 59.99,
    currency: 'USD',
    url: 'https://demo.talkpilot.com/products/bluetooth-speaker',
    inStock: true,
    description: 'Waterproof portable speaker with 360-degree sound, 12-hour battery, and built-in microphone for calls.',
    category: 'Electronics',
  },
  {
    id: 'prod-008',
    name: 'Running Shoes - CloudStride',
    price: 129.99,
    currency: 'USD',
    url: 'https://demo.talkpilot.com/products/cloudstride-running-shoes',
    inStock: true,
    description: 'Lightweight running shoes with responsive foam cushioning and breathable mesh upper. Available in 8 colors.',
    category: 'Footwear',
  },
  {
    id: 'prod-009',
    name: 'Stainless Steel Water Bottle',
    price: 24.99,
    currency: 'USD',
    url: 'https://demo.talkpilot.com/products/steel-water-bottle',
    inStock: true,
    description: 'Double-wall vacuum insulated 750ml bottle. Keeps drinks cold 24hrs or hot 12hrs. BPA-free.',
    category: 'Home & Kitchen',
  },
  {
    id: 'prod-010',
    name: 'Leather Crossbody Bag',
    price: 79.99,
    currency: 'USD',
    url: 'https://demo.talkpilot.com/products/leather-crossbody-bag',
    inStock: true,
    description: 'Full-grain leather crossbody bag with adjustable strap, RFID-blocking pocket, and magnetic closure.',
    category: 'Accessories',
  },
];

export const STORE_NAME = 'TalkPilot Demo Store';

export const STORE_KNOWLEDGE = `
Store: ${STORE_NAME}
Website: https://demo.talkpilot.com

## Products
${MOCK_PRODUCTS.map((p) => `- ${p.name} ($${p.price}) [${p.inStock ? 'In Stock' : 'Out of Stock'}] - ${p.description}`).join('\n')}

## Shipping Policy
- Free standard shipping on orders over $50
- Standard shipping (5-7 business days): $5.99
- Express shipping (2-3 business days): $12.99
- We ship to the US, Canada, and the UK

## Return Policy
- 30-day return window for unused items in original packaging
- Free returns on all orders
- Refunds processed within 5-7 business days after receiving the item

## About Us
TalkPilot Demo Store is a curated online shop offering a mix of electronics, clothing, home goods, and accessories. We focus on quality, sustainability, and great customer service.

## Contact
- Email: support@demo.talkpilot.com
- Phone: 1-800-DEMO (not real)
- Hours: Mon-Fri 9am-6pm EST
`.trim();

export function searchMockProducts(query: string): MockProduct[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return MOCK_PRODUCTS.filter((p) => {
    const text = `${p.name} ${p.description} ${p.category}`.toLowerCase();
    return words.some((w) => text.includes(w));
  }).slice(0, 10);
}
