const camel = (s) => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());

/** snake_case DB row -> camelCase object. */
export const camelize = (row) =>
  row ? Object.fromEntries(Object.entries(row).map(([k, v]) => [camel(k), v])) : null;
export const camelizeAll = (rows) => rows.map(camelize);
