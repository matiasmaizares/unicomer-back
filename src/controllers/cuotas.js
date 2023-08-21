const Cuotas = require('../models/Cuotas')
const User = require('../models/User')

const crear = async (req, res) => {
    try {
        const { tarjeta, monto, cuotas, fechaEmision, mensual, tasaInteres } =
            req.body

        // Crear el nuevo movimiento en cuotas
        const nuevoMovimientoCuotas = new Cuotas({
            tarjeta,
            monto,
            cuotas,
            fechaEmision,
            mensual,
            tasaInteres,
        })

        await nuevoMovimientoCuotas.save()

        return res
            .status(201)
            .json({ message: 'Movimiento en cuotas registrado correctamente' })
    } catch (error) {
        console.error('Error al registrar movimiento en cuotas:', error)
        return res.status(500).json({ message: 'Error interno del servidor' })
    }
}

const obtenerTodas = async (req, res) => {
    try {
        const { tarjetaId } = req.params

        // Obtener los movimientos en cuotas de la tarjeta especificada
        const movimientosCuotas = await Cuotas.find({
            tarjeta: tarjetaId,
        })
        return res.status(200).json(movimientosCuotas)
    } catch (error) {
        console.error('Error al obtener movimientos en cuotas:', error)
        return res.status(500).json({ message: 'Error interno del servidor' })
    }
}
const obtenerCuotasTarjetaPrincipal = async (req, res) => {
    try {
        const { usuarioId } = req.params

        // Encontrar la tarjeta principal del usuario
        const usuario = await User.findById(usuarioId).populate({
            path: 'tarjetas',
            match: { esPrincipal: true }, // Filtrar por tarjeta principal
        })

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' })
        }

        const tarjetaPrincipal = usuario.tarjetas[0] // Suponemos que solo hay una tarjeta principal

        if (!tarjetaPrincipal) {
            return res.status(404).json({
                message: 'No se encontró una tarjeta principal para el usuario',
            })
        }

        // Obtener los movimientos en cuotas de la tarjeta principal
        const movimientosCuotas = await Cuotas.find({
            tarjeta: tarjetaPrincipal._id,
        })

        return res.status(200).json(movimientosCuotas)
    } catch (error) {
        console.error('Error al obtener movimientos en cuotas:', error)
        return res.status(500).json({ message: 'Error interno del servidor' })
    }
}
module.exports = {
    crear,
    obtenerTodas,
    obtenerCuotasTarjetaPrincipal,
}
