import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes with clsx for conditional classes.
 * This is essential for creating reusable components that accept custom className props.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
