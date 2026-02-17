// Mi Negocio AVEMARÍA — Shared TypeScript Types

// ── API Response ──
export interface ApiResponse<T> {
    success: true;
    data: T;
    meta?: {
        total?: number;
        page?: number;
        limit?: number;
    };
}

export interface ApiError {
    success: false;
    error: string;
    details?: unknown[];
}

// ── Auth ──
export interface User {
    id: string;
    email: string;
    name: string;
    businessName: string;
    createdAt: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface LoginResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}

// ── Product ──
export type Category = 'CANDONGAS' | 'TOPOS' | 'GRANDES' | 'SETS' | 'EARCUFFS' | 'COLLARES' | 'PULSERAS' | 'OTRO';

export interface Product {
    id: string;
    ref: string;
    name: string;
    category: Category;
    icon: string | null;
    wholesalePrice: number;
    retailPrice: number;
    stock: number;
    minStock: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

// ── Customer ──
export type CustomerLevel = 'VIP' | 'Frecuente' | 'Regular';

export interface Customer {
    id: string;
    name: string;
    phone: string | null;
    instagram: string | null;
    city: string | null;
    notes: string | null;
    createdAt: string;
    totalSpent: number;
    totalPurchases: number;
    lastPurchase: string | null;
    level: CustomerLevel;
}

// ── Sale ──
export type SaleChannel = 'WHATSAPP' | 'INSTAGRAM' | 'PRESENCIAL';
export type SalePayment = 'NEQUI' | 'DAVIPLATA' | 'TRANSFERENCIA' | 'EFECTIVO' | 'CONTRA_ENTREGA';
export type SaleStatus = 'COMPLETED' | 'PENDING_PAYMENT' | 'CANCELLED';

export interface SaleItem {
    id: string;
    productId: string;
    product: Product;
    quantity: number;
    unitRevenue: number;
    unitCost: number;
    unitProfit: number;
}

export interface Sale {
    id: string;
    folio: number;
    customerId: string | null;
    customer: Customer | null;
    channel: SaleChannel;
    paymentMethod: SalePayment;
    totalRevenue: number;
    totalCost: number;
    netProfit: number;
    status: SaleStatus;
    notes: string | null;
    soldAt: string;
    items: SaleItem[];
}

// ── Purchase ──
export type PurchasePayment = 'TRANSFERENCIA' | 'NEQUI' | 'DAVIPLATA' | 'EFECTIVO';

export interface PurchaseItem {
    id: string;
    productId: string;
    product: Product;
    quantity: number;
    unitCost: number;
}

export interface Purchase {
    id: string;
    orderNumber: string | null;
    shippingCost: number;
    totalCost: number;
    paymentMethod: PurchasePayment;
    notes: string | null;
    purchasedAt: string;
    items: PurchaseItem[];
}

// ── Transaction ──
export type TransactionType = 'INCOME' | 'EXPENSE';
export type ExpenseCategory = 'COMPRA_AVEMARIA' | 'ENVIOS' | 'EMPAQUES' | 'PUBLICIDAD' | 'OTRO';

export interface Transaction {
    id: string;
    type: TransactionType;
    amount: number;
    category: ExpenseCategory;
    description: string;
    date: string;
    saleId: string | null;
    purchaseId: string | null;
}

// ── Dashboard ──
export interface DashboardData {
    totalRevenue: number;
    totalProfit: number;
    profitMargin: number;
    totalPaidToAvemaria: number;
    unitsSold: number;
    lowStockProducts: Array<{
        id: string;
        ref: string;
        name: string;
        icon: string | null;
        stock: number;
        minStock: number;
    }>;
    revenueByChannel: {
        whatsapp: number;
        instagram: number;
        presencial: number;
    };
    topProducts: Array<{
        product: { id: string; ref: string; name: string; icon: string | null };
        totalProfit: number;
        totalQuantity: number;
    }>;
    recentActivity: Array<{
        type: 'sale' | 'purchase';
        id: string;
        date: string;
        description: string;
        amount: number;
        channel: string | null;
    }>;
    monthlyRevenue: Array<{ month: string; label: string; value: number }>;
    monthlyProfit: Array<{ month: string; label: string; value: number }>;
}
