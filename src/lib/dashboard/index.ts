import { DashboardDataSource } from "./adapter";
import { MockDataSource } from "./adapter-mock";
import { PrismaDataSource } from "./adapter-prisma";

export type DataSourceType = "mock" | "prisma";

const DATA_SOURCE_TYPE: DataSourceType = 
  (process.env.DASHBOARD_DATA_SOURCE as DataSourceType) || "mock";

let data_source_instance: DashboardDataSource | null = null;

export function get_data_source(): DashboardDataSource {
  if (!data_source_instance) {
    switch (DATA_SOURCE_TYPE) {
      case "prisma":
        data_source_instance = new PrismaDataSource();
        break;
      case "mock":
      default:
        data_source_instance = new MockDataSource();
        break;
    }
  }
  return data_source_instance;
}

export function set_data_source_type(type: DataSourceType): void {
  switch (type) {
    case "prisma":
      data_source_instance = new PrismaDataSource();
      break;
    case "mock":
    default:
      data_source_instance = new MockDataSource();
      break;
  }
}

export { resolve_dashboard } from "./resolvers";
export * from "./types";
export * from "./metrics";
