/** validate({ body, params, query }) with zod schemas. Replaces req.* with the parsed values. */
export const validate = (schemas) => (req, res, next) => {
  try {
    for (const key of ['params', 'query', 'body']) {
      if (schemas[key]) req[key] = schemas[key].parse(req[key]);
    }
    next();
  } catch (err) {
    next(err);
  }
};
