export const formatINR = (value: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

export const formatINRPlain = (value: number): string =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value || 0);

export const computeDiscount = (mrp: number, price: number): number => {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
};

export const GST_RATE = 0.18;

export const computeTotals = (subtotal: number, discount = 0) => {
  const afterDiscount = Math.max(subtotal - discount, 0);
  const gst = Math.round(afterDiscount * GST_RATE);
  const shipping = 0;
  const grand_total = afterDiscount + gst + shipping;
  return { subtotal, discount, gst, shipping, grand_total };
};

export const statusLabel = (status: string): string => {
  const map: Record<string, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    processing: "Processing",
    packed: "Packed",
    dispatched: "Dispatched",
    in_transit: "In Transit",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
    returned: "Returned",
  };
  return map[status] ?? status;
};

export const statusColorClass = (status: string): string => {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    confirmed: "bg-blue-100 text-blue-800 border-blue-300",
    processing: "bg-blue-100 text-blue-800 border-blue-300",
    packed: "bg-indigo-100 text-indigo-800 border-indigo-300",
    dispatched: "bg-purple-100 text-purple-800 border-purple-300",
    in_transit: "bg-purple-100 text-purple-800 border-purple-300",
    out_for_delivery: "bg-orange-100 text-orange-800 border-orange-300",
    delivered: "bg-green-100 text-green-800 border-green-300",
    cancelled: "bg-red-100 text-red-800 border-red-300",
    returned: "bg-red-100 text-red-800 border-red-300",
  };
  return map[status] ?? "bg-gray-100 text-gray-800 border-gray-300";
};

type ClassValue = string | number | bigint | boolean | null | undefined;
export const cn = (...classes: ClassValue[]): string =>
  classes.filter((c): c is string => typeof c === "string" && c.length > 0).join(" ");

export const formatDate = (iso?: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const truncate = (str: string, max = 60): string =>
  str.length > max ? `${str.slice(0, max).trim()}…` : str;

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli",
  "Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep",
  "Puducherry",
];
