import { LicenseType, Feature, LICENSE_FEATURES, SessionUser } from "@/types/rbac";

// ============================================================================
// FEATURE GATE
// ============================================================================

export class FeatureGate {
  private license_type: LicenseType | null;
  private available_features: Set<Feature>;

  constructor(license_type: LicenseType | null) {
    this.license_type = license_type;
    this.available_features = new Set(
      license_type ? LICENSE_FEATURES[license_type] : []
    );
  }

  has(feature: Feature): boolean {
    return this.available_features.has(feature);
  }

  has_all(...features: Feature[]): boolean {
    return features.every((f) => this.has(f));
  }

  has_any(...features: Feature[]): boolean {
    return features.some((f) => this.has(f));
  }

  get_all(): Feature[] {
    return Array.from(this.available_features);
  }

  static from_user(user: SessionUser): FeatureGate {
    return new FeatureGate(user.license_type);
  }
}

// ============================================================================
// FEATURE CHECK HELPERS
// ============================================================================

export function can_use_custom_date_filter(license_type: LicenseType | null): boolean {
  return new FeatureGate(license_type).has(Feature.DASHBOARD_FILTERS_CUSTOM);
}

export function can_use_advanced_analytics(license_type: LicenseType | null): boolean {
  return new FeatureGate(license_type).has(Feature.ANALYTICS_ADVANCED);
}

export function can_export_data(license_type: LicenseType | null): boolean {
  return new FeatureGate(license_type).has_any(Feature.EXPORT_PDF, Feature.EXPORT_EXCEL);
}

export function can_use_ai_features(license_type: LicenseType | null): boolean {
  return new FeatureGate(license_type).has(Feature.AI_SUGGESTIONS);
}

export function can_access_api(license_type: LicenseType | null): boolean {
  return new FeatureGate(license_type).has(Feature.API_ACCESS);
}

// ============================================================================
// FEATURE METADATA
// ============================================================================

export interface FeatureMetadata {
  id: Feature;
  name: string;
  description: string;
  min_license: LicenseType;
}

export const FEATURE_METADATA: Record<Feature, FeatureMetadata> = {
  [Feature.DASHBOARD_BASIC]: {
    id: Feature.DASHBOARD_BASIC,
    name: "Dashboard Básico",
    description: "Visualização básica de métricas e indicadores",
    min_license: LicenseType.BASIC,
  },
  [Feature.DASHBOARD_FILTERS_BASIC]: {
    id: Feature.DASHBOARD_FILTERS_BASIC,
    name: "Filtros Básicos",
    description: "Filtros por período: Hoje, 7 dias, 30 dias",
    min_license: LicenseType.BASIC,
  },
  [Feature.DASHBOARD_FILTERS_CUSTOM]: {
    id: Feature.DASHBOARD_FILTERS_CUSTOM,
    name: "Filtros Customizados",
    description: "Filtros por período personalizado",
    min_license: LicenseType.PROFESSIONAL,
  },
  [Feature.ANALYTICS_ADVANCED]: {
    id: Feature.ANALYTICS_ADVANCED,
    name: "Analytics Avançado",
    description: "Relatórios e análises detalhadas",
    min_license: LicenseType.PROFESSIONAL,
  },
  [Feature.EXPORT_PDF]: {
    id: Feature.EXPORT_PDF,
    name: "Exportar PDF",
    description: "Exportar relatórios em PDF",
    min_license: LicenseType.PROFESSIONAL,
  },
  [Feature.EXPORT_EXCEL]: {
    id: Feature.EXPORT_EXCEL,
    name: "Exportar Excel",
    description: "Exportar dados em Excel",
    min_license: LicenseType.PROFESSIONAL,
  },
  [Feature.AI_SUGGESTIONS]: {
    id: Feature.AI_SUGGESTIONS,
    name: "Sugestões IA",
    description: "Sugestões inteligentes baseadas em IA",
    min_license: LicenseType.ENTERPRISE,
  },
  [Feature.API_ACCESS]: {
    id: Feature.API_ACCESS,
    name: "Acesso API",
    description: "Acesso à API para integrações",
    min_license: LicenseType.ENTERPRISE,
  },
  [Feature.WHITE_LABEL]: {
    id: Feature.WHITE_LABEL,
    name: "White Label",
    description: "Personalização completa da marca",
    min_license: LicenseType.ENTERPRISE,
  },
  [Feature.MULTI_AREA_MANAGEMENT]: {
    id: Feature.MULTI_AREA_MANAGEMENT,
    name: "Gestão Multi-Área",
    description: "Gerenciar múltiplas áreas simultaneamente",
    min_license: LicenseType.PROFESSIONAL,
  },
};
