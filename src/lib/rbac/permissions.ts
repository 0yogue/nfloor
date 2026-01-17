import {
  AccessLevel,
  LicenseType,
  ACCESS_LEVEL_HIERARCHY,
  Feature,
  LICENSE_FEATURES,
  SessionUser,
  VISIBILITY_MATRIX,
} from "@/types/rbac";

// ============================================================================
// ACCESS LEVEL CHECKS
// ============================================================================

export function has_access_level_or_higher(
  user_level: AccessLevel,
  required_level: AccessLevel
): boolean {
  return ACCESS_LEVEL_HIERARCHY[user_level] >= ACCESS_LEVEL_HIERARCHY[required_level];
}

export function is_super_admin(access_level: AccessLevel): boolean {
  return access_level === AccessLevel.SUPER_ADMIN;
}

export function is_director_or_higher(access_level: AccessLevel): boolean {
  return has_access_level_or_higher(access_level, AccessLevel.DIRECTOR);
}

export function is_superintendent_or_higher(access_level: AccessLevel): boolean {
  return has_access_level_or_higher(access_level, AccessLevel.SUPERINTENDENT);
}

export function is_manager_or_higher(access_level: AccessLevel): boolean {
  return has_access_level_or_higher(access_level, AccessLevel.MANAGER);
}

// ============================================================================
// LICENSE FEATURE CHECKS
// ============================================================================

export function has_feature(
  license_type: LicenseType | null,
  feature: Feature
): boolean {
  if (!license_type) return false;
  return LICENSE_FEATURES[license_type].includes(feature);
}

export function get_available_features(license_type: LicenseType | null): Feature[] {
  if (!license_type) return [];
  return LICENSE_FEATURES[license_type];
}

// ============================================================================
// VISIBILITY CHECKS
// ============================================================================

export function can_view_user_data(
  viewer: SessionUser,
  target_user_id: string,
  target_company_id: string | null,
  target_area_id: string | null
): boolean {
  const visibility = VISIBILITY_MATRIX[viewer.access_level];

  if (visibility.can_see_all_companies) {
    return true;
  }

  if (viewer.id === target_user_id) {
    return visibility.can_see_own_data;
  }

  if (!target_company_id || viewer.company_id !== target_company_id) {
    return false;
  }

  if (visibility.can_see_all_company) {
    return true;
  }

  if (visibility.can_see_managed_areas && target_area_id) {
    if (viewer.managed_area_ids.includes(target_area_id)) {
      return true;
    }
  }

  if (visibility.can_see_team_data && target_area_id) {
    if (viewer.area_id === target_area_id) {
      return true;
    }
  }

  return false;
}

export function can_manage_user(
  manager: SessionUser,
  target_access_level: AccessLevel
): boolean {
  if (is_super_admin(manager.access_level)) {
    return true;
  }

  return (
    ACCESS_LEVEL_HIERARCHY[manager.access_level] >
    ACCESS_LEVEL_HIERARCHY[target_access_level]
  );
}

// ============================================================================
// COMBINED PERMISSION CHECK
// ============================================================================

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

export function check_permission(
  user: SessionUser,
  action: string,
  resource: string,
  context?: {
    target_user_id?: string;
    target_company_id?: string;
    target_area_id?: string;
    required_feature?: Feature;
  }
): PermissionCheckResult {
  if (is_super_admin(user.access_level)) {
    return { allowed: true };
  }

  if (context?.required_feature) {
    if (!has_feature(user.license_type, context.required_feature)) {
      return {
        allowed: false,
        reason: `Feature "${context.required_feature}" not available in your license`,
      };
    }
  }

  if (context?.target_user_id) {
    const can_view = can_view_user_data(
      user,
      context.target_user_id,
      context.target_company_id || null,
      context.target_area_id || null
    );
    if (!can_view) {
      return {
        allowed: false,
        reason: "You don't have permission to view this user's data",
      };
    }
  }

  return { allowed: true };
}
