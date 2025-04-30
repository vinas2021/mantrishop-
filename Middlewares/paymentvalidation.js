const Joi = require('joi');

const depositSchema = Joi.object({
  amount: Joi.number().positive().required(),
  deposit: Joi.string().required(),
  utr: Joi.string().optional().allow(null),
});

const withdrawSchema = Joi.object({
  user: Joi.string().required(),
  amount: Joi.number().positive().required(),
  withdraw: Joi.string().required(),
  upi: Joi.string().optional().allow(null)
});

module.exports = { depositSchema, withdrawSchema };
