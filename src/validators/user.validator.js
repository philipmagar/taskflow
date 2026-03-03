const joi = require('joi');

const createUserSchema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(6).required(),
    role: joi.forbidden(),
});
module.exports ={ createUserSchema }