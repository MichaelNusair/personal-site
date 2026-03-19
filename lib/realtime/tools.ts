import { searchMockProducts, type MockProduct } from './mock-store';

export interface ToolDefinition {
  type: 'function';
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
}

export const TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    name: 'navigate_to_product',
    description:
      'Navigate the user to a product page. IMPORTANT: You must always ask the user for explicit verbal confirmation before calling this function. Only call after the user says "yes", "show me", "okay", or similar affirmative response.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'The product external ID' },
        productUrl: { type: 'string', description: 'The full URL to navigate to' },
        productName: { type: 'string', description: 'The product name for visual confirmation' },
      },
      required: ['productId', 'productUrl', 'productName'],
    },
  },
  {
    type: 'function',
    name: 'collect_lead',
    description:
      'Collect contact information from the visitor when they request a human agent, or when you cannot answer their question. Ask for each field verbally and repeat back for confirmation before calling this function.',
    parameters: {
      type: 'object',
      properties: {
        visitorName: { type: 'string', description: 'Full name of the visitor' },
        phone: { type: 'string', description: 'Phone number' },
        email: { type: 'string', description: 'Email address' },
        message: { type: 'string', description: 'Short message or inquiry summary' },
        productContext: { type: 'string', description: 'The product or topic being discussed' },
      },
      required: ['visitorName', 'phone', 'email'],
    },
  },
  {
    type: 'function',
    name: 'search_products',
    description:
      'Search the product catalog to find relevant products matching a query. Use when the user asks about a product by description or category.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query for product lookup' },
      },
      required: ['query'],
    },
  },
];

export interface ToolCallResult {
  name: string;
  args: Record<string, unknown>;
  result: string;
  timestamp: number;
}

export interface NavigationEvent {
  productName: string;
  productUrl: string;
  timestamp: number;
}

export interface LeadEvent {
  visitorName: string;
  phone: string;
  email: string;
  message?: string;
  timestamp: number;
}

export interface SearchResultEvent {
  query: string;
  products: MockProduct[];
  timestamp: number;
}

export type ToolEvent =
  | { type: 'navigation'; data: NavigationEvent }
  | { type: 'lead'; data: LeadEvent }
  | { type: 'search'; data: SearchResultEvent };

export function handleToolCall(
  name: string,
  argsJson: string,
): { result: string; event: ToolEvent } {
  const args = JSON.parse(argsJson);

  switch (name) {
    case 'navigate_to_product': {
      const event: ToolEvent = {
        type: 'navigation',
        data: {
          productName: args.productName,
          productUrl: args.productUrl,
          timestamp: Date.now(),
        },
      };
      return {
        result: JSON.stringify({
          success: true,
          message: `Navigating to ${args.productName}`,
        }),
        event,
      };
    }

    case 'collect_lead': {
      const event: ToolEvent = {
        type: 'lead',
        data: {
          visitorName: args.visitorName,
          phone: args.phone,
          email: args.email,
          message: args.message,
          timestamp: Date.now(),
        },
      };
      return {
        result: JSON.stringify({
          success: true,
          message: 'Contact information collected. A team member will reach out shortly.',
        }),
        event,
      };
    }

    case 'search_products': {
      const products = searchMockProducts(args.query);
      const event: ToolEvent = {
        type: 'search',
        data: {
          query: args.query,
          products,
          timestamp: Date.now(),
        },
      };
      return {
        result: JSON.stringify(
          products.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            currency: p.currency,
            url: p.url,
            inStock: p.inStock,
            description: p.description.slice(0, 150),
          })),
        ),
        event,
      };
    }

    default:
      return {
        result: JSON.stringify({ error: `Unknown tool: ${name}` }),
        event: { type: 'search', data: { query: '', products: [], timestamp: Date.now() } },
      };
  }
}
