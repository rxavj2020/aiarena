import { decryptSecret } from "@/lib/secrets";
import { id } from "@/lib/utils";
import { getTenantIntegration } from "@/lib/platform";
import { listFirestoreDocuments, upsertFirestoreDocument, type FirestoreConfig } from "@/lib/plugins/firestore";

export type TenantProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  status: "active" | "draft" | "archived";
  image: string;
  createdAt: string;
  updatedAt: string;
};

function getConfig(tenantId: string): FirestoreConfig | null {
  const integration = getTenantIntegration(tenantId, "firestore");
  if (!integration?.enabled || integration.lastTestOk !== true) return null;
  const encrypted = integration.config.encrypted;
  if (!encrypted) return null;
  try {
    return JSON.parse(decryptSecret(encrypted)) as FirestoreConfig;
  } catch {
    return null;
  }
}

export async function tenantFirestoreStatus(tenantId: string) {
  const config = getConfig(tenantId);
  return { connected: !!config, configPresent: !!config };
}

export async function listTenantProducts(tenantId: string, opts?: { includeDrafts?: boolean }): Promise<TenantProduct[]> {
  const config = getConfig(tenantId);
  if (!config) return [];
  const docs = await listFirestoreDocuments(config, "products");
  return docs
    .map((doc) => ({
      id: String(doc.id ?? ""),
      name: String(doc.name ?? ""),
      slug: String(doc.slug ?? doc.id ?? ""),
      description: String(doc.description ?? ""),
      price: Number(doc.price ?? 0),
      compareAtPrice: doc.compareAtPrice == null ? null : Number(doc.compareAtPrice),
      stock: Number(doc.stock ?? 0),
      status: String(doc.status ?? "draft") as TenantProduct["status"],
      image: String(doc.image ?? ""),
      createdAt: String(doc.createdAt ?? ""),
      updatedAt: String(doc.updatedAt ?? ""),
    }))
    .filter((product) => product.id && (opts?.includeDrafts ? product.status !== "archived" : product.status === "active"));
}

export type TenantProductInput = Omit<TenantProduct, "id" | "createdAt" | "updatedAt"> & { id?: string; createdAt?: string };

export type TenantOrder = {
  id: string;
  orderNumber: string;
  email: string;
  phone: string;
  status: string;
  paymentStatus: string;
  total: number;
  itemCount: number;
  createdAt: string;
  shippingAddress: { name?: string; city?: string; state?: string } | null;
};

/** Orders are read from the same tenant-namespaced Firestore boundary as products. */
export async function listTenantOrders(tenantId: string): Promise<TenantOrder[]> {
  const config = getConfig(tenantId);
  if (!config) return [];
  const docs = await listFirestoreDocuments(config, "orders");
  return docs
    .map((doc) => {
      const address = doc.shippingAddress && typeof doc.shippingAddress === "object" ? doc.shippingAddress as Record<string, unknown> : null;
      const items = Array.isArray(doc.items) ? doc.items : Array.isArray(doc.orderItems) ? doc.orderItems : [];
      const rawId = String(doc.id ?? doc.orderId ?? "");
      return {
        id: rawId,
        orderNumber: String(doc.orderNumber ?? rawId),
        email: String(doc.email ?? ""),
        phone: String(doc.phone ?? ""),
        status: String(doc.status ?? "pending"),
        paymentStatus: String(doc.paymentStatus ?? "unpaid"),
        total: Number(doc.total ?? 0),
        itemCount: Number(doc.itemCount ?? items.length),
        createdAt: String(doc.createdAt ?? ""),
        shippingAddress: address ? { name: String(address.name ?? ""), city: String(address.city ?? ""), state: String(address.state ?? "") } : null,
      } satisfies TenantOrder;
    })
    .filter((order) => order.id || order.orderNumber)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveTenantProduct(tenantId: string, input: TenantProductInput) {
  const config = getConfig(tenantId);
  if (!config) throw new Error("Connect and test Firestore before managing products");
  const now = new Date().toISOString();
  const productId = input.id || id("prd_");
  await upsertFirestoreDocument(config, "products", productId, {
    id: productId,
    name: input.name.trim(),
    slug: input.slug.trim(),
    description: input.description.trim(),
    price: Math.round(input.price),
    compareAtPrice: input.compareAtPrice == null ? null : Math.round(input.compareAtPrice),
    stock: Math.max(0, Math.round(input.stock)),
    status: input.status,
    image: input.image.trim(),
    createdAt: input.createdAt || now,
    updatedAt: now,
  });
  return productId;
}
