const { Schema, model } = require('mongoose')

const userSchema = new Schema(
    {
        email: { type: String, unique: true, required: true },
        fullname: String,
        nro_document: { type: Number, unique: true, required: true },
        password: String,
        type_document: {
            type: String,
            enum: ['DNI'],
            required: true,
        },
        tarjetas: [{ type: Schema.Types.ObjectId, ref: 'Tarjeta' }],
    },
    {
        timestamps: true,
    }
)

module.exports = model('User', userSchema, 'users')
