import { DataScope, SessionUser, VISIBILITY_MATRIX } from "@/types/rbac";
import prisma from "@/lib/prisma/client";

// ============================================================================
// DATA SCOPE BUILDER
// ============================================================================

export async function build_data_scope(user: SessionUser): Promise<DataScope> {
  const visibility = VISIBILITY_MATRIX[user.access_level];

  if (visibility.can_see_all_companies) {
    return {
      company_ids: "all",
      area_ids: "all",
      user_ids: "all",
    };
  }

  if (!user.company_id) {
    return {
      company_ids: [],
      area_ids: [],
      user_ids: [user.id],
    };
  }

  if (visibility.can_see_all_company) {
    return {
      company_ids: [user.company_id],
      area_ids: "all",
      user_ids: "all",
    };
  }

  const area_ids: string[] = [];

  if (user.area_id) {
    area_ids.push(user.area_id);
  }

  if (visibility.can_see_managed_areas && user.managed_area_ids.length > 0) {
    user.managed_area_ids.forEach((id) => {
      if (!area_ids.includes(id)) {
        area_ids.push(id);
      }
    });
  }

  if (area_ids.length === 0) {
    return {
      company_ids: [user.company_id],
      area_ids: [],
      user_ids: [user.id],
    };
  }

  return {
    company_ids: [user.company_id],
    area_ids,
    user_ids: "all",
  };
}

// ============================================================================
// PRISMA WHERE CLAUSE BUILDERS
// ============================================================================

export interface UserWhereClause {
  company_id?: string | { in: string[] };
  area_id?: string | { in: string[] } | null;
  id?: string | { in: string[] };
  OR?: Array<{ area_id?: string | { in: string[] } | null; id?: string }>;
}

export function build_user_where_clause(scope: DataScope): UserWhereClause {
  const where: UserWhereClause = {};

  if (scope.company_ids !== "all") {
    if (scope.company_ids.length === 1) {
      where.company_id = scope.company_ids[0];
    } else if (scope.company_ids.length > 1) {
      where.company_id = { in: scope.company_ids };
    }
  }

  if (scope.area_ids !== "all" && scope.user_ids !== "all") {
    const conditions: Array<{ area_id?: { in: string[] }; id?: string }> = [];

    if (scope.area_ids.length > 0) {
      conditions.push({ area_id: { in: scope.area_ids } });
    }

    if (scope.user_ids.length > 0) {
      scope.user_ids.forEach((id) => {
        conditions.push({ id });
      });
    }

    if (conditions.length > 0) {
      where.OR = conditions;
    }
  } else if (scope.area_ids !== "all") {
    if (scope.area_ids.length === 1) {
      where.area_id = scope.area_ids[0];
    } else if (scope.area_ids.length > 1) {
      where.area_id = { in: scope.area_ids };
    }
  } else if (scope.user_ids !== "all") {
    if (scope.user_ids.length === 1) {
      where.id = scope.user_ids[0];
    } else if (scope.user_ids.length > 1) {
      where.id = { in: scope.user_ids };
    }
  }

  return where;
}

// ============================================================================
// GET VISIBLE USER IDS
// ============================================================================

export async function get_visible_user_ids(user: SessionUser): Promise<string[]> {
  const scope = await build_data_scope(user);
  const where = build_user_where_clause(scope);

  if (Object.keys(where).length === 0) {
    const all_users = await prisma.user.findMany({
      select: { id: true },
    });
    return all_users.map((u) => u.id);
  }

  const users = await prisma.user.findMany({
    where,
    select: { id: true },
  });

  return users.map((u) => u.id);
}

// ============================================================================
// GET VISIBLE AREAS
// ============================================================================

export async function get_visible_areas(user: SessionUser): Promise<string[]> {
  const scope = await build_data_scope(user);

  if (scope.area_ids === "all") {
    if (scope.company_ids === "all") {
      const areas = await prisma.area.findMany({
        select: { id: true },
      });
      return areas.map((a) => a.id);
    }

    const areas = await prisma.area.findMany({
      where: {
        company_id: { in: scope.company_ids },
      },
      select: { id: true },
    });
    return areas.map((a) => a.id);
  }

  return scope.area_ids;
}
