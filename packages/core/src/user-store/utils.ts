import { BaseError } from "@/errors/base";
import { intToBlob } from "@/utils/encode";

import { ModelFilter, ModelInstance } from "./store";

export const filterTypes = {
  // universal
  "": { operator: "=", patternPrefix: undefined, patternSuffix: undefined },
  not: { operator: "!=", patternPrefix: undefined, patternSuffix: undefined },
  // singular
  in: { operator: "in", patternPrefix: undefined, patternSuffix: undefined },
  not_in: {
    operator: "not in",
    patternPrefix: undefined,
    patternSuffix: undefined,
  },
  // plural
  contains: { operator: "like", patternPrefix: "%", patternSuffix: "%" },
  contains_nocase: {
    operator: "like",
    patternPrefix: "%",
    patternSuffix: "%",
  },
  not_contains: {
    operator: "not like",
    patternPrefix: "%",
    patternSuffix: "%",
  },
  not_contains_nocase: {
    operator: "not like",
    patternPrefix: "%",
    patternSuffix: "%",
  },
  // numeric
  gt: { operator: ">", patternPrefix: undefined, patternSuffix: undefined },
  lt: { operator: "<", patternPrefix: undefined, patternSuffix: undefined },
  gte: { operator: ">=", patternPrefix: undefined, patternSuffix: undefined },
  lte: { operator: "<=", patternPrefix: undefined, patternSuffix: undefined },
  // string
  starts_with: {
    operator: "like",
    patternPrefix: undefined,
    patternSuffix: "%",
  },
  starts_with_nocase: {
    operator: "like",
    patternPrefix: undefined,
    patternSuffix: "%",
  },
  ends_with: { operator: "like", patternPrefix: "%", patternSuffix: undefined },
  ends_with_nocase: {
    operator: "like",
    patternPrefix: "%",
    patternSuffix: undefined,
  },
  not_starts_with: {
    operator: "not like",
    patternPrefix: undefined,
    patternSuffix: "%",
  },
  not_starts_with_nocase: {
    operator: "not like",
    patternPrefix: undefined,
    patternSuffix: "%",
  },
  not_ends_with: {
    operator: "not like",
    patternPrefix: "%",
    patternSuffix: undefined,
  },
  not_ends_with_nocase: {
    operator: "not like",
    patternPrefix: "%",
    patternSuffix: undefined,
  },
} as const;

export type FilterType = keyof typeof filterTypes;

export function getWhereOperatorAndValue({
  filterType,
  value,
}: {
  filterType: FilterType;
  value: unknown;
}) {
  const { operator, patternPrefix, patternSuffix } = filterTypes[filterType];

  if (value === null || value === undefined) {
    return {
      operator:
        operator === "="
          ? ("is" as const)
          : operator === "!="
          ? ("is not" as const)
          : operator,
      value: null,
    };
  }

  if (Array.isArray(value)) {
    // Handle basic list equals.
    if (filterType === "" || filterType === "not") {
      return { operator, value: JSON.stringify(value) };
    }

    return {
      operator,
      value: value.map((v) => {
        if (typeof v === "boolean") {
          return v ? 1 : 0;
        } else {
          return v;
        }
      }),
    };
  }

  if (typeof value === "boolean") {
    return { operator, value: value ? 1 : 0 };
  }

  // At this point, treat the value as a string.
  let finalValue = value;
  if (patternPrefix) finalValue = `${patternPrefix}${finalValue}`;
  if (patternSuffix) finalValue = `${finalValue}${patternSuffix}`;

  return { operator, value: finalValue };
}

export function formatModelFieldValue({ value }: { value: unknown }) {
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  } else if (typeof value === "bigint") {
    return intToBlob(value);
  } else if (typeof value === "undefined") {
    return null;
  } else if (Array.isArray(value)) {
    return JSON.stringify(value);
  } else {
    return value as string | number | null;
  }
}

export function formatModelInstance({
  id,
  data,
}: {
  id: string | number | bigint;
  data: Partial<Omit<ModelInstance, "id">>;
}) {
  const instance: { [key: string]: string | number | null | Buffer } = {};

  instance["id"] = formatModelFieldValue({ value: id });

  Object.entries(data).forEach(([key, value]) => {
    instance[key] = formatModelFieldValue({ value });
  });

  return instance;
}

export function parseModelFilter(filter: ModelFilter = {}): ModelFilter {
  const parsedFilter: ModelFilter = {};

  if (filter.first) {
    if (filter.first > MAX_LIMIT) {
      throw new BaseError("Cannot query more than 1000 rows.");
    }
    parsedFilter.first = filter.first;
  } else {
    parsedFilter.first = DEFAULT_LIMIT;
  }

  if (filter.skip) {
    if (filter.skip > MAX_SKIP)
      throw new BaseError("Cannot skip more than 5000 rows.");
    parsedFilter.skip = filter.skip;
  }

  parsedFilter.orderBy = filter.orderBy;
  parsedFilter.orderDirection = filter.orderDirection;
  parsedFilter.where = filter.where;

  return parsedFilter;
}

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 1000;
const MAX_SKIP = 5000;
