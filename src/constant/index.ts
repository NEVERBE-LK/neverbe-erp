export const shoeSizesList = [
  // Toddler Sizes (Approx. Age 1-4)
  "16",
  "17",
  "18",
  "19",
  "20",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",

  // Kids Sizes (Approx. Age 4-12)
  "27",
  "28",
  "29",
  "30",
  "31",
  "32",
  "33",
  "34",
  "35",
  "36",

  // Adult Sizes
  "37",
  "38",
  "39",
  "40",
  "41",
  "42",
  "43",
  "44",
  "45",
  "46",
  "47",
  "48",
  "49",
  "50",
];

export const types = [
  {
    id: 1,
    name: "Shoes",
    value: "shoes",
  },
  {
    id: 3,
    name: "Sandals",
    value: "sandals",
  },
  {
    id: 2,
    name: "Accessories",
    value: "accessories",
  },
];
export const accessoriesSizesList = [
  {
    id: 1,
    name: "200ml",
    value: "200ml",
  },
  {
    id: 5,
    name: "S",
    value: "s",
  },
  {
    id: 6,
    name: "M",
    value: "m",
  },
  {
    id: 7,
    name: "X",
    value: "x",
  },
  {
    id: 8,
    name: "XL",
    value: "xl",
  },
  {
    id: 9,
    name: "Free Size",
    value: "free size",
  },
];

export enum orderStatus {
  PENDING = "Pending",
  PROCESSING = "Processing",
  COMPLETED = "Completed",
  CANCELLED = "Cancelled",
  SHIPPED = "Shipped",
}

export enum paymentStatus {
  PENDING = "Pending",
  PAID = "Paid",
  FAILED = "Failed",
  REFUNDED = "Refunded",
}
export enum smsTemplates {
  orderConfirmation = "Hi [Name], thank you for shopping at NEVERBE! Your order #[Order ID] has been confirmed! We will process your order as soon as possible.",
  orderShipped = "Dear [Name],\n\n Your order #[Order ID] has been shipped. Tracking Number: [Tracking Number], Tracking URL: [Tracking Url]",
  orderCancelled = "Dear [Name],\n\n Your order #[Order ID] has been cancelled. If you have any questions, please contact us.",
  orderStatusUpdate = "Dear [Name],\n\n Your order #[Order ID] status has been updated to [Status].",
  orderStatus = "Dear [Name], your order #[Order ID] status is currently [Payment Status]. If you have any questions, please contact us.",
}
export enum paymentMethods {
  PAYHERE = "PAYHERE",
  COD = "COD",
}

export const paymentStatusList = [
  {
    id: 1,
    name: "Paid",
    value: paymentStatus.PAID,
  },
  {
    id: 2,
    name: "Pending",
    value: paymentStatus.PENDING,
  },
  {
    id: 3,
    name: "Failed",
    value: paymentStatus.FAILED,
  },
  {
    id: 4,
    name: "Refunded",
    value: paymentStatus.REFUNDED,
  },
];
export const genders = [
  {
    id: 1,
    name: "Men",
    value: "men",
  },
  {
    id: 2,
    name: "Women",
    value: "women",
  },
  {
    id: 3,
    name: "Kids",
    value: "kids",
  },
];
export const sortInventoryOptions = [
  {
    id: 1,
    name: "A-Z",
    value: "ab",
  },
  {
    id: 2,
    name: "Z-A",
    value: "za",
  },
  {
    id: 3,
    name: "Price: Low-High",
    value: "lh",
  },
  {
    id: 4,
    name: "Price: High-Low",
    value: "hl",
  },
  {
    id: 5,
    name: "None",
    value: "none",
  },
];
