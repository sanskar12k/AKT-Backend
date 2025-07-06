const Joi = require('joi');

module.exports.userSchema = Joi.object({
        fname:Joi.string().required().regex(/^\w+(?:\s+\w+)*$/),
        role:Joi.string().required().alphanum(),
        store:Joi.string(),
        number:Joi.string().allow(''),
        lname:Joi.string().allow(''),
        username:Joi.string().required().email(),
        password:Joi.string().required(),
        dob:Joi.date(),
})

const saleSchema = Joi.object({
    sale:Joi.number().required(),
    store:Joi.string().required().regex(/^\w+(?:\s+\w+)*$/),
    customer:Joi.number().required(),
    paytm:Joi.number(),
    hdfc:Joi.number(),
    created:Joi.date().required(),
    added:Joi.string().required(),
    addedName:Joi.string().required()
})

module.exports.validateSaleSchema = (req, res, next) =>{
    const { error } = saleSchema.validate(req.body);
    if(error){
        const msg = error.details.map(el => el.message).join(',')
        next(msg)
    }
    else{
        next();
    }
}