import { Timestamp } from "firebase/firestore";

export interface PettyCash {
  id: string; // e.g. "ex-0ack"
  amount: number;
  attachment: string; // URL
  category: string;
  subCategory: string;
  subCategoryId: string;

  note: string;
  paymentMethod: string; // e.g. "cash", "bank_transfer"
  bankAccountId?: string; // If paymentMethod is bank_transfer
  bankAccountName?: string;
  date: string;

  type: "expense" | "income";
  status: "PENDING" | "APPROVED" | "REJECTED";

  createdBy: string;
  createdAt: Timestamp | string;
  updatedBy: string;
  updatedAt: Timestamp | string;

  reviewedBy: string;
  reviewedAt: Timestamp | string | null;

  voucherNo?: string;
  payee?: string;
  rejectionReason?: string;

  isDeleted: boolean;
}
