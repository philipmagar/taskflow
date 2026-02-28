const joi = require('joi');

const createUserSchema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(6).required(),
    role: joi.string().valid('member','admin').default('member'),
});
module.exports ={ createUserSchema }