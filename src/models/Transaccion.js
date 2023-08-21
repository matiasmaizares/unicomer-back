const mongoose = require('mongoose')

const transaccionSchema = new mongoose.Schema({
    tipo: String,
    estado: String,
    monto: Number,
    tarjetaOrigen: { type: mongoose.Schema.Types.ObjectId, ref: 'Tarjeta' },
    tarjetaDestino: { type: mongoose.Schema.Types.ObjectId, ref: 'Tarjeta' },
    fecha: { type: Date, default: Date.now },
})

module.exports = mongoose.model('Transaccion', transaccionSchema)
