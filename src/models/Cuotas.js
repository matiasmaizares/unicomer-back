const { Schema, model } = require('mongoose')

const cuotasSchema = new Schema({
    tarjeta: { type: Schema.Types.ObjectId, ref: 'Tarjeta' }, // Referencia a la tarjeta asociada
    monto: Number,
    cuotas: String,
    fechaEmision: { type: Date, default: Date.now },
    mensual: Number,
    tasaInteres: Number,
})

module.exports = model('Cuotas', cuotasSchema)
