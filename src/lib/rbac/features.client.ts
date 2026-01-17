import { Feature, LICENSE_FEATURES, LicenseType } from "@/types/rbac";

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
}
