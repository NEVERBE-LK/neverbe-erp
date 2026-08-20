import { Timestamp } from "firebase/firestore";

export interface SpammerRecord {
  id?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  name?: string;
  reason: string;
  severity: "HIGH" | "CRITICAL" | "BLACKLISTED";
  flaggedBy?: string;
  createdAt: Timestamp | string;
  updatedAt?: Timestamp | string;
}
