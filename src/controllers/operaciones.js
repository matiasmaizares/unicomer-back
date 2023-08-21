const Tarjeta = require('../models/Tarjeta')
const Transaccion = require('../models/Transaccion')
const User = require('../models/User')
const moment = require('moment')
const transferir = async (req, res) => {
    try {
        const { tarjetaOrigenId, cbuOrAlias, monto } = req.body

        const tarjetaOrigen = await Tarjeta.findById(tarjetaOrigenId)
        const tarjetaDestino = await Tarjeta.findOne({
            $or: [{ cbu: cbuOrAlias }, { alias: cbuOrAlias }],
        })

        if (!tarjetaOrigen || !tarjetaDestino) {
            return res
                .status(404)
                .json({ message: 'Tarjeta(s) no encontrada(s)' })
        }
        if (monto <= 0 || monto > tarjetaOrigen.saldo) {
            return res
                .status(400)
                .json({ message: 'Monto de transferencia inválido' })
        }

        tarjetaOrigen.saldo -= monto
        tarjetaDestino.saldo += monto

        await tarjetaOrigen.save()
        await tarjetaDestino.save()

        const transaccionTransferencia = new Transaccion({
            monto: monto,
            tipo: 'Transferencia',
            tarjetaDestino: tarjetaDestino._id,
            tarjetaOrigen: tarjetaOrigen._id,
            estado: 'Completado',
        })
        await transaccionTransferencia.save()

        return res
            .status(200)
            .json({ ok: true, message: 'Transferencia exitosa' })
    } catch (error) {
        console.error('Error al realizar la transferencia:', error)
        return res.status(500).json({ message: 'Error interno del servidor' })
    }
}
const extraer = async (req, res) => {
    try {
        const { userId, monto } = req.body

        // Buscar la tarjeta principal asociada al usuario
        const tarjeta = await Tarjeta.findOne({
            titular: userId,
            esPrincipal: true,
        })

        if (!tarjeta) {
            return res
                .status(404)
                .json({ message: 'Tarjeta principal no encontrada' })
        }

        if (monto <= 0 || monto > tarjeta.saldo) {
            return res.status(400).json({ message: 'Monto de retiro inválido' })
        }

        tarjeta.saldo -= monto
        await tarjeta.save()

        const transaccionRetiro = new Transaccion({
            monto,
            tipo: 'Retiro',
            tarjetaOrigen: tarjeta._id,
            estado: 'Completado',
        })
        await transaccionRetiro.save()

        return res.status(200).json({ ok: true, message: 'Retiro exitoso' })
    } catch (error) {
        console.error('Error al realizar el retiro:', error)
        return res.status(500).json({ message: 'Error interno del servidor' })
    }
}
const depositar = async (req, res) => {
    try {
        const { userId, monto } = req.body

        const tarjeta = await Tarjeta.findOne({
            titular: userId,
            esPrincipal: true,
        })

        if (!tarjeta) {
            return res
                .status(404)
                .json({ message: 'Tarjeta principal no encontrada' })
        }

        if (monto <= 0) {
            return res
                .status(400)
                .json({ message: 'Monto de depósito inválido' })
        }

        tarjeta.saldo += monto
        await tarjeta.save()

        const transaccionDeposito = new Transaccion({
            monto: monto,
            tipo: 'Deposito',
            tarjetaOrigen: tarjeta._id,
            estado: 'Completado',
        })
        await transaccionDeposito.save()

        return res.status(200).json({ ok: true, message: 'Depósito exitoso' })
    } catch (error) {
        console.error('Error al realizar el depósito:', error)
        return res.status(500).json({ message: 'Error interno del servidor' })
    }
}

const obtenerTransacciones = async (req, res) => {
    try {
        const { userId, pagina, porPagina } = req.query

        // Convertir los valores de la paginación a números
        const pageNumber = parseInt(pagina) || 1
        const pageSize = parseInt(porPagina) || 5

        // Calcular el índice del primer registro en la página
        const startIndex = (pageNumber - 1) * pageSize

        // Obtener el usuario por su ID y sus tarjetas
        const usuario = await User.findById(userId).populate('tarjetas')

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' })
        }

        // Obtener todas las tarjetas del usuario
        const tarjetasUsuario = usuario.tarjetas

        // Obtener las transacciones de las tarjetas usando el campo tarjetaOrigen
        const transacciones = await Transaccion.find({
            tarjetaOrigen: { $in: tarjetasUsuario },
        })
            .populate('tarjetaOrigen tarjetaDestino')
            .sort({ fecha: -1 })
            .skip(startIndex)
            .limit(pageSize)

        // Procesar las transacciones para mostrar el nombre del usuario
        const transaccionesConNombres = await Promise.all(
            transacciones.map(async (transaccion) => {
                let nombreUsuario = ''

                if (transaccion.tipo === 'Transferencia') {
                    if (
                        transaccion.tarjetaOrigen &&
                        transaccion.tarjetaDestino &&
                        transaccion.tarjetaOrigen.titular &&
                        transaccion.tarjetaDestino.titular &&
                        transaccion.tarjetaOrigen.titular.toString() ===
                            transaccion.tarjetaDestino.titular.toString()
                    ) {
                        nombreUsuario = 'TU'
                    } else if (
                        transaccion.tarjetaDestino &&
                        transaccion.tarjetaDestino.titular
                    ) {
                        // Buscar el usuario del titular de la tarjeta destino
                        const usuarioDestino = await User.findById(
                            transaccion.tarjetaDestino.titular
                        )

                        if (usuarioDestino) {
                            nombreUsuario = usuarioDestino.fullname
                        }
                    }
                } else if (
                    (transaccion.tipo === 'Retiro' ||
                        transaccion.tipo === 'Deposito') &&
                    transaccion.tarjetaOrigen &&
                    transaccion.tarjetaOrigen.titular
                ) {
                    // Obtener el nombre del usuario del titular de la tarjeta origen
                    const usuarioOrigen = await User.findById(
                        transaccion.tarjetaOrigen.titular
                    )

                    if (usuarioOrigen) {
                        nombreUsuario = usuarioOrigen.fullname
                    }
                }

                return {
                    ...transaccion._doc,
                    nombreUsuario: nombreUsuario,
                }
            })
        )

        // Contar el total de transacciones para la paginación
        const totalTransacciones = await Transaccion.countDocuments({
            tarjetaOrigen: { $in: tarjetasUsuario },
        })

        return res.status(200).json({
            total: totalTransacciones,
            pagina: pageNumber,
            porPagina: pageSize,
            transacciones: transaccionesConNombres,
        })
    } catch (error) {
        console.error('Error al obtener transacciones:', error)
        return res.status(500).json({ message: 'Error interno del servidor' })
    }
}
const calcularSaldoYVariacion = async (req, res) => {
    try {
        const { tarjetaId } = req.query

        const fechaHoy = moment().startOf('day')
        const fechaInicioSemanaActual = fechaHoy.clone().startOf('week')
        const fechaInicioSemanaPasada = fechaInicioSemanaActual
            .clone()
            .subtract(1, 'week')

        // Obtener todas las transacciones en la semana actual
        const transaccionesSemanaActual = await Transaccion.find({
            tarjeta: tarjetaId,
            fecha: {
                $gte: fechaInicioSemanaActual.toDate(),
                $lte: fechaHoy.toDate(),
            },
        }).sort({ fecha: 1 })

        // Obtener todas las transacciones en la semana pasada
        const transaccionesSemanaPasada = await Transaccion.find({
            tarjeta: tarjetaId,
            fecha: {
                $gte: fechaInicioSemanaPasada.toDate(),
                $lte: fechaInicioSemanaActual
                    .clone()
                    .subtract(1, 'day')
                    .toDate(),
            },
        }).sort({ fecha: 1 })

        let saldosSemanaActual = {}
        let saldosSemanaPasada = {}

        let saldoActual = 0
        transaccionesSemanaActual.forEach((transaccion) => {
            if (transaccion.tipo === 'ingreso') {
                saldoActual += transaccion.monto
            } else if (transaccion.tipo === 'egreso') {
                saldoActual -= transaccion.monto
            }

            const fechaTransaccion = moment(transaccion.fecha).format(
                'YYYY-MM-DD'
            )
            saldosSemanaActual[fechaTransaccion] = saldoActual
        })

        let saldoPasado = 0
        transaccionesSemanaPasada.forEach((transaccion) => {
            if (transaccion.tipo === 'ingreso') {
                saldoPasado += transaccion.monto
            } else if (transaccion.tipo === 'egreso') {
                saldoPasado -= transaccion.monto
            }

            const fechaTransaccion = moment(transaccion.fecha).format(
                'YYYY-MM-DD'
            )
            saldosSemanaPasada[fechaTransaccion] = saldoPasado
        })

        let saldosYVariacion = {}
        Object.keys(saldosSemanaActual).forEach((fecha) => {
            const saldoActual = saldosSemanaActual[fecha]
            const saldoPasado = saldosSemanaPasada[fecha] || 0

            const variacion = saldoActual - saldoPasado
            const porcentajeVariacion = (variacion / saldoPasado) * 100

            saldosYVariacion[fecha] = {
                saldoActual: saldoActual,
                saldoPasado: saldoPasado,
                variacion: variacion,
                porcentajeVariacion: porcentajeVariacion,
            }
        })

        return res.status(200).json(saldosYVariacion)
    } catch (error) {
        console.error('Error al calcular los saldos y variación:', error)
        return res.status(500).json({ message: 'Error interno del servidor' })
    }
}

module.exports = {
    transferir,
    extraer,
    depositar,
    obtenerTransacciones,
    calcularSaldoYVariacion,
}
