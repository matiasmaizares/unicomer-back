const Tarjeta = require('../models/Tarjeta')
const User = require('../models/User')
const Transaccion = require('../models/Transaccion')
const moment = require('moment')
const Usuario = require('../models/User')
const {
    generarLetrasAleatorias,
    generarNumeroTarjetaAleatorio,
    generarFechaVencimientoAleatoria,
    generarCbuAleatorio,
} = require('../utils/fakeDataGenerator')

const crearTarjeta = async (req, res) => {
    const id = req.params.id

    try {
        const user = await User.findById(id)
        if (!user) {
            return res
                .status(404)
                .json({ ok: false, msg: 'Titular no encontrado' })
        }
        // Generar saldo y nro_tarjeta aleatoriamente
        const saldo = 10000
        const nro_tarjeta = generarNumeroTarjetaAleatorio()

        // Generar fecha de vencimiento aleatoriamente (mes y año futuros)
        const fechaVencimiento = generarFechaVencimientoAleatoria()

        const cbu = generarCbuAleatorio()
        const alias = `${generarLetrasAleatorias(4)}.${generarLetrasAleatorias(
            4
        )}.${generarLetrasAleatorias(4)}`

        const nuevaTarjeta = new Tarjeta({
            saldo,
            nro_tarjeta,
            fecha_vencimiento: fechaVencimiento,
            cbu,
            alias,
            titular: id,
        })
        const tarjetaGuardada = await nuevaTarjeta.save()
        user.tarjetas.push(tarjetaGuardada._id)
        await user.save()

        return res.status(200).json({ ok: true, tarjetaGuardada })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error })
    }
}
const obtenerTarjetas = async (req, res) => {
    const id = req.params.id

    try {
        const user = await User.findById(id)
        if (!user) {
            return res
                .status(404)
                .json({ ok: false, msg: 'Titular no encontrado' })
        }

        const tarjetas = await Tarjeta.find({ titular: user._id })

        // Buscar la tarjeta principal por su ID
        const tarjetaPrincipal = tarjetas.find((tarjeta) => tarjeta.esPrincipal)

        // Filtrar las tarjetas secundarias excluyendo la principal
        const tarjetasSecundarias = tarjetas.filter(
            (tarjeta) => !tarjeta.esPrincipal
        )

        return res
            .status(200)
            .json({ ok: true, tarjetaPrincipal, tarjetasSecundarias })
    } catch (error) {
        console.error('Error al obtener tarjetas del usuario:', error)
        return res.status(500).json({ message: 'Error interno del servidor' })
    }
}
const ingresos = async (req, res) => {
    try {
        const { usuarioId } = req.query

        // Buscar al usuario por su ID
        const usuario = await Usuario.findById(usuarioId).populate('tarjetas')

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' })
        }

        // Encontrar la tarjeta principal del usuario
        const tarjetaPrincipal = usuario.tarjetas.find(
            (tarjeta) => tarjeta.esPrincipal
        )

        if (!tarjetaPrincipal) {
            return res
                .status(404)
                .json({ message: 'Tarjeta principal no encontrada' })
        }

        // Obtener las transacciones de depósito y transferencia en el mes actual
        const fechaHoy = moment().startOf('day')
        const fechaInicioMesActual = fechaHoy.clone().startOf('month')
        const fechaFinMesActual = fechaHoy.clone().endOf('month')

        const transaccionesMesActual = await Transaccion.find({
            tarjetaOrigen: tarjetaPrincipal._id,
            fecha: {
                $gte: fechaInicioMesActual.toDate(),
                $lte: fechaFinMesActual.toDate(),
            },
            tipo: { $in: ['Deposito', 'Transferencia'] },
        })

        // Calcular el total de ingresos del mes actual
        let totalIngresosMesActual = 0
        transaccionesMesActual.forEach((transaccion) => {
            totalIngresosMesActual += transaccion.monto
        })

        // Obtener las transacciones de depósito y transferencia en el mes anterior
        const fechaInicioMesAnterior = fechaInicioMesActual
            .clone()
            .subtract(1, 'month')
        const fechaFinMesAnterior = fechaInicioMesActual
            .clone()
            .subtract(1, 'day')

        const transaccionesMesAnterior = await Transaccion.find({
            tarjetaOrigen: tarjetaPrincipal._id,
            fecha: {
                $gte: fechaInicioMesAnterior.toDate(),
                $lte: fechaFinMesAnterior.toDate(),
            },
            tipo: { $in: ['Deposito', 'Transferencia'] },
        })

        // Calcular el total de ingresos del mes anterior
        let totalIngresosMesAnterior = 0
        transaccionesMesAnterior.forEach((transaccion) => {
            totalIngresosMesAnterior += transaccion.monto
        })

        if (totalIngresosMesAnterior === 0 && totalIngresosMesActual === 0) {
            // Ambos meses no tienen datos de ingresos, el porcentaje se considera 0.
            return res.status(200).json({
                mesActual: 0,
                mesAnterior: 0,
                porcentaje: 0,
            })
        } else if (totalIngresosMesAnterior === 0) {
            // El mes anterior no tiene datos de ingresos, consideramos el porcentaje como infinito.
            return res.status(200).json({
                mesActual: totalIngresosMesActual,
                mesAnterior: 0,
                porcentaje: 100,
            })
        } else {
            // Cálculo normal del porcentaje de cambio en ingresos.
            const porcentajeIngresos =
                ((totalIngresosMesActual - totalIngresosMesAnterior) /
                    totalIngresosMesAnterior) *
                100

            return res.status(200).json({
                mesActual: totalIngresosMesActual,
                mesAnterior: totalIngresosMesAnterior,
                porcentaje: porcentajeIngresos,
            })
        }
    } catch (error) {
        console.error('Error al obtener porcentaje de ingresos:', error)
        return res.status(500).json({ message: 'Error interno del servidor' })
    }
}

const egresos = async (req, res) => {
    try {
        const { usuarioId } = req.query

        // Buscar al usuario por su ID
        const usuario = await Usuario.findById(usuarioId).populate('tarjetas')

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' })
        }

        // Encontrar la tarjeta principal del usuario
        const tarjetaPrincipal = usuario.tarjetas.find(
            (tarjeta) => tarjeta.esPrincipal
        )

        if (!tarjetaPrincipal) {
            return res
                .status(404)
                .json({ message: 'Tarjeta principal no encontrada' })
        }

        // Obtener las transacciones de retiro y transferencia en el mes actual
        const fechaHoy = moment().startOf('day')
        const fechaInicioMesActual = fechaHoy.clone().startOf('month')
        const fechaFinMesActual = fechaHoy.clone().endOf('month')

        const transaccionesMesActual = await Transaccion.find({
            tarjetaOrigen: tarjetaPrincipal._id,
            fecha: {
                $gte: fechaInicioMesActual.toDate(),
                $lte: fechaFinMesActual.toDate(),
            },
            tipo: { $in: ['Retiro', 'Transferencia'] },
        })
        const transaccionesAll = await Transaccion.find({
            tarjetaOrigen: tarjetaPrincipal._id,
            tipo: { $in: ['Retiro', 'Transferencia'] },
        })
        console.log(transaccionesAll)

        // Calcular el total de egresos del mes actual
        let totalEgresosMesActual = 0
        transaccionesMesActual.forEach((transaccion) => {
            totalEgresosMesActual += transaccion.monto
        })

        // Obtener las transacciones de retiro y transferencia en el mes anterior
        const fechaInicioMesAnterior = fechaInicioMesActual
            .clone()
            .subtract(1, 'month')
        const fechaFinMesAnterior = fechaInicioMesActual
            .clone()
            .subtract(1, 'day')

        const transaccionesMesAnterior = await Transaccion.find({
            tarjetaOrigen: tarjetaPrincipal._id,
            fecha: {
                $gte: fechaInicioMesAnterior.toDate(),
                $lte: fechaFinMesAnterior.toDate(),
            },
            tipo: { $in: ['Retiro', 'Transferencia'] },
        })

        // Calcular el total de egresos del mes anterior
        let totalEgresosMesAnterior = 0
        transaccionesMesAnterior.forEach((transaccion) => {
            totalEgresosMesAnterior += transaccion.monto
        })

        if (totalEgresosMesAnterior === 0 && totalEgresosMesActual === 0) {
            // Ambos meses no tienen datos de egresos, el porcentaje se considera 0.
            return res.status(200).json({
                mesActual: 0,
                mesAnterior: 0,
                porcentaje: 0,
            })
        } else if (totalEgresosMesAnterior === 0) {
            // El mes anterior no tiene datos de egresos, consideramos el porcentaje como infinito.
            return res.status(200).json({
                mesActual: totalEgresosMesActual,
                mesAnterior: 0,
                porcentaje: 100,
            })
        } else {
            // Cálculo normal del porcentaje de cambio.
            const porcentajeCambioEgresos =
                ((totalEgresosMesActual - totalEgresosMesAnterior) /
                    totalEgresosMesAnterior) *
                100

            return res.status(200).json({
                mesActual: totalEgresosMesActual,
                mesAnterior: totalEgresosMesAnterior,
                porcentaje: porcentajeCambioEgresos,
            })
        }
    } catch (error) {
        console.error('Error al obtener porcentaje de egresos:', error)
        return res.status(500).json({ message: 'Error interno del servidor' })
    }
}
const cambiarPrincipal = async (req, res) => {
    const userId = req.params.userId
    const tarjetaId = req.params.tarjetaId

    try {
        const user = await User.findById(userId).populate('tarjetas')

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' })
        }

        const tarjetaSeleccionada = user.tarjetas.find(
            (tarjeta) => tarjeta._id.toString() === tarjetaId
        )

        if (!tarjetaSeleccionada) {
            return res.status(404).json({ message: 'Tarjeta no encontrada' })
        }

        // Desmarcar la tarjeta principal actual (si existe)
        const tarjetaPrincipalActual = user.tarjetas.find(
            (tarjeta) => tarjeta.esPrincipal
        )
        if (tarjetaPrincipalActual) {
            tarjetaPrincipalActual.esPrincipal = false
            await tarjetaPrincipalActual.save()
        }

        // Marcar la tarjeta seleccionada como principal
        tarjetaSeleccionada.esPrincipal = true
        await tarjetaSeleccionada.save()

        return res.status(200).json({
            ok: true,
            message: 'Tarjeta principal actualizada exitosamente',
        })
    } catch (error) {
        console.error(error)
        return res
            .status(500)
            .json({ message: 'Error al cambiar la tarjeta principal' })
    }
}
const obtenerTarjetaPrincipal = async (req, res) => {
    const userId = req.params.id

    try {
        const user = await User.findById(userId)
        if (!user) {
            return res
                .status(404)
                .json({ ok: false, msg: 'Titular no encontrado' })
        }

        const tarjetaPrincipal = await Tarjeta.findOne({
            titular: user._id,
            esPrincipal: true,
        })

        if (!tarjetaPrincipal) {
            return res
                .status(404)
                .json({ ok: false, msg: 'Tarjeta principal no encontrada' })
        }

        return res.status(200).json({ ok: true, tarjetaPrincipal })
    } catch (error) {
        console.error('Error al obtener la tarjeta principal:', error)
        return res.status(500).json({ message: 'Error interno del servidor' })
    }
}

const obtenerTodasTarjetas = async (req, res) => {
    const usuarioId = req.params.id

    try {
        const usuario = await User.findById(usuarioId)
        if (!usuario) {
            return res
                .status(404)
                .json({ ok: false, msg: 'Usuario no encontrado' })
        }

        const tarjetasUsuario = await Tarjeta.find({
            titular: usuarioId,
            esPrincipal: false,
        }).select('_id cbu alias')

        const tarjetasOtrosUsuarios = await Tarjeta.find({
            titular: { $ne: usuarioId },
        }).select('_id cbu alias')

        const todasLasTarjetas = [...tarjetasUsuario, ...tarjetasOtrosUsuarios]

        return res.status(200).json(todasLasTarjetas)
    } catch (error) {
        console.error('Error al obtener tarjetas:', error)
        return res.status(500).json({ message: 'Error interno del servidor' })
    }
}

module.exports = {
    crearTarjeta,
    obtenerTarjetas,
    ingresos,
    egresos,
    cambiarPrincipal,
    obtenerTarjetaPrincipal,
    obtenerTodasTarjetas,
}
