import { sumBy } from "lodash-es";
import { type CatalogObject } from "@/config/model.d";

export function getCountNodes(obj: CatalogObject) {
  if (!obj || !Array.isArray(obj.children) || obj.children.length === 0) {
    return 1;
  }
  return sumBy(obj.children, getCountNodes);
}

export function getCount(obj: CatalogObject) {
  return `（${getCountNodes(obj)}）`;
}