// ============================================================================
// ENUMS - Client-safe (mirror of Prisma enums)
// ============================================================================

export enum AccessLevel {
  SUPER_ADMIN = "SUPER_ADMIN",
  DIRECTOR = "DIRECTOR",
  SUPERINTENDENT = "SUPERINTENDENT",
  MANAGER = "MANAGER",
  SELLER = "SELLER",
}

export enum LicenseType {
  BASIC = "BASIC",
  PROFESSIONAL = "PROFESSIONAL",
  ENTERPRISE = "ENTERPRISE",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

export enum ConversationStatus {
  ACTIVE = "ACTIVE",
  WAITING_RESPONSE = "WAITING_RESPONSE",
  CLOSED = "CLOSED",
  ARCHIVED = "ARCHIVED",
}

export enum SenderType {
  SELLER = "SELLER",
  LEAD = "LEAD",
  SYSTEM = "SYSTEM",
}

// ============================================================================
// ACCESS LEVEL HIERARCHY
// ============================================================================

export const ACCESS_LEVEL_HIERARCHY: Record<AccessLevel, number> = {
  [AccessLevel.SUPER_ADMIN]: 100,
  [AccessLevel.DIRECTOR]: 80,
  [AccessLevel.SUPERINTENDENT]: 60,
  [AccessLevel.MANAGER]: 40,
  [AccessLevel.SELLER]: 20,
};

export const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  [AccessLevel.SUPER_ADMIN]: "Super Admin",
  [AccessLevel.DIRECTOR]: "Diretor",
  [AccessLevel.SUPERINTENDENT]: "Superintendente",
  [AccessLevel.MANAGER]: "Gerente",
  [AccessLevel.SELLER]: "Vendedor",
};

// ============================================================================
// LICENSE FEATURES
// ============================================================================

export enum Feature {
  DASHBOARD_BASIC = "dashboard_basic",
  DASHBOARD_FILTERS_BASIC = "dashboard_filters_basic",
  DASHBOARD_FILTERS_CUSTOM = "dashboard_filters_custom",
  ANALYTICS_ADVANCED = "analytics_advanced",
  EXPORT_PDF = "export_pdf",
  EXPORT_EXCEL = "export_excel",
  AI_SUGGESTIONS = "ai_suggestions",
  API_ACCESS = "api_access",
  WHITE_LABEL = "white_label",
  MULTI_AREA_MANAGEMENT = "multi_area_management",
}

export const LICENSE_FEATURES: Record<LicenseType, Feature[]> = {
  [LicenseType.BASIC]: [
    Feature.DASHBOARD_BASIC,
    Feature.DASHBOARD_FILTERS_BASIC,
  ],
  [LicenseType.PROFESSIONAL]: [
    Feature.DASHBOARD_BASIC,
    Feature.DASHBOARD_FILTERS_BASIC,
    Feature.DASHBOARD_FILTERS_CUSTOM,
    Feature.ANALYTICS_ADVANCED,
    Feature.EXPORT_PDF,
    Feature.EXPORT_EXCEL,
    Feature.MULTI_AREA_MANAGEMENT,
  ],
  [LicenseType.ENTERPRISE]: [
    Feature.DASHBOARD_BASIC,
    Feature.DASHBOARD_FILTERS_BASIC,
    Feature.DASHBOARD_FILTERS_CUSTOM,
    Feature.ANALYTICS_ADVANCED,
    Feature.EXPORT_PDF,
    Feature.EXPORT_EXCEL,
    Feature.AI_SUGGESTIONS,
    Feature.API_ACCESS,
    Feature.WHITE_LABEL,
    Feature.MULTI_AREA_MANAGEMENT,
  ],
};

export const LICENSE_LABELS: Record<LicenseType, string> = {
  [LicenseType.BASIC]: "Básico",
  [LicenseType.PROFESSIONAL]: "Profissional",
  [LicenseType.ENTERPRISE]: "Enterprise",
};

// ============================================================================
// USER SESSION TYPES
// ============================================================================

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  access_level: AccessLevel;
  status: UserStatus;
  company_id: string | null;
  company_name: string | null;
  company_slug: string | null;
  license_type: LicenseType | null;
  area_id: string | null;
  area_name: string | null;
  managed_area_ids: string[];
}

export interface JwtPayload {
  sub: string;
  email: string;
  access_level: string;
  company_id: string | null;
  iat: number;
  exp: number;
}

// ============================================================================
// DATA SCOPE TYPES
// ============================================================================

export interface DataScope {
  company_ids: string[] | "all";
  area_ids: string[] | "all";
  user_ids: string[] | "all";
}

// ============================================================================
// VISIBILITY MATRIX
// ============================================================================

export interface VisibilityConfig {
  can_see_own_data: boolean;
  can_see_team_data: boolean;
  can_see_managed_areas: boolean;
  can_see_all_company: boolean;
  can_see_all_companies: boolean;
}

export const VISIBILITY_MATRIX: Record<AccessLevel, VisibilityConfig> = {
  [AccessLevel.SUPER_ADMIN]: {
    can_see_own_data: true,
    can_see_team_data: true,
    can_see_managed_areas: true,
    can_see_all_company: true,
    can_see_all_companies: true,
  },
  [AccessLevel.DIRECTOR]: {
    can_see_own_data: true,
    can_see_team_data: true,
    can_see_managed_areas: true,
    can_see_all_company: true,
    can_see_all_companies: false,
  },
  [AccessLevel.SUPERINTENDENT]: {
    can_see_own_data: true,
    can_see_team_data: true,
    can_see_managed_areas: true,
    can_see_all_company: false,
    can_see_all_companies: false,
  },
  [AccessLevel.MANAGER]: {
    can_see_own_data: true,
    can_see_team_data: true,
    can_see_managed_areas: true,
    can_see_all_company: false,
    can_see_all_companies: false,
  },
  [AccessLevel.SELLER]: {
    can_see_own_data: true,
    can_see_team_data: false,
    can_see_managed_areas: false,
    can_see_all_company: false,
    can_see_all_companies: false,
  },
};
