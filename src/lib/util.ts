import { createId } from "@paralleldrive/cuid2"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export const IS_DEV = process.env.NODE_ENV === "development"
export const IS_PROD_DB = process.env.DATABASE_URL?.includes("mouse") || false
export const IS_MAINTENANCE_MODE = process.env.IS_MAINTENANCE_MODE === "true"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(prefix: string): string {
  return `${prefix ? `${prefix}-` : ""}${createId()}`
}
