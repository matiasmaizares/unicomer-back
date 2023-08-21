const Joi = require('joi')

const validateSignup = (data) => {
    const schema = Joi.object({
        fullname: Joi.string().trim().required().messages({
            'any.required': 'El nombre completo es obligatorio',
            'string.empty': 'El nombre completo no puede estar vacío',
        }),
        password: Joi.string().min(6).trim().required().messages({
            'any.required': 'La contraseña es obligatoria',
            'string.empty': 'La contraseña no puede estar vacía',
            'string.min':
                'La contraseña debe tener al menos {{#limit}} caracteres',
        }),
        email: Joi.string().trim().email().required().messages({
            'any.required': 'El correo electrónico es obligatorio',
            'string.empty': 'El correo electrónico no puede estar vacío',
            'string.email': 'Ingrese un correo electrónico válido',
        }),
        type_document: Joi.string()
            .valid('DNI', 'pasaporte')
            .trim()
            .required()
            .messages({
                'any.required': 'El tipo de documento es obligatorio',
                'string.empty': 'El tipo de documento no puede estar vacío',
                'any.only': 'El tipo de documento debe ser DNI',
            }),
        nro_document: Joi.number().integer().required().messages({
            'any.required': 'El número de documento es obligatorio',
            'number.empty': 'El número de documento no puede estar vacío',
            'number.integer':
                'El número de documento debe ser un valor numérico entero',
        }),
    })

    return schema.validate(data)
}
const validateLogin = (data) => {
    const schema = Joi.object({
        type_document: Joi.string()
            .valid('DNI', 'pasaporte')
            .trim()
            .required()
            .messages({
                'any.required': 'El tipo de documento es obligatorio',
                'string.empty': 'El tipo de documento no puede estar vacío',
                'any.only': 'El tipo de documento debe ser DNI',
            }),
        nro_document: Joi.number().integer().required().messages({
            'any.required': 'El número de documento es obligatorio',
            'number.empty': 'El número de documento no puede estar vacío',
            'number.integer':
                'El número de documento debe ser un valor numérico entero',
        }),
        password: Joi.string().trim().required().messages({
            'any.required': 'La contraseña es obligatoria',
            'string.empty': 'La contraseña no puede estar vacía',
        }),
    })

    return schema.validate(data)
}

module.exports = {
    validateSignup,
    validateLogin,
}
