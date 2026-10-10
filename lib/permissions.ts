import type { Role } from "@/types/database";

export const isAdminRole = (role: Role | null | undefined) => role === "admin";
