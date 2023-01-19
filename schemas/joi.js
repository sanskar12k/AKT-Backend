const Joi = require('joi');

module.exports.userSchema = Joi.object({
        fname:Joi.string().required().regex(/^\w+(?:\s+\w+)*$/),
        role:Joi.string().required().alphanum(),
        number:Joi.string().allow(''),
        lname:Joi.string().allow(''),
        username:Joi.string().required().email(),
        password:Joi.string().required()
})

module.exports.saleSchema = Joi.object({
    sale:Joi.number().required(),
    store:Joi.string().required().regex(/^\w+(?:\s+\w+)*$/),
    customer:Joi.number().required(),
    paytm:Joi.number(),
    hdfc:Joi.number(),
    created:Joi.date().required(),
    added:Joi.string().required(),
    addedName:Joi.string().required()
})