import Joi from 'joi';

export const uuidSchema = Joi.string().uuid();

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export const validateUUID = (id: string): boolean => {
  const { error } = uuidSchema.validate(id);
  return !error;
};

export const validatePagination = (page?: string, limit?: string) => {
  const { error, value } = paginationSchema.validate({
    page: page ? parseInt(page, 10) : undefined,
    limit: limit ? parseInt(limit, 10) : undefined,
  });

  if (error) {
    throw new Error(`Invalid pagination parameters: ${error.details[0].message}`);
  }

  return value;
};