const mongoose = require('mongoose')
const Schema = mongoose.Schema

const tarjetaSchema = new Schema({
    saldo: Number,
    nro_tarjeta: String,
    fecha_vencimiento: String,
    titular: { type: Schema.Types.ObjectId, ref: 'User' },
    esPrincipal: { type: Boolean, default: false },
    cbu: Number,
    alias: String,
})

module.exports = mongoose.model('Tarjeta', tarjetaSchema)
