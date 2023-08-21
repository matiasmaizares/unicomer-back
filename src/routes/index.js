const { Router } = require('express')
const bcrypt = require('bcrypt')
const router = Router()
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const {
    validateSignup,
    validateLogin,
} = require('../middlewares/validationMiddleware')
const Tarjeta = require('../models/Tarjeta')
const Cuotas = require('../models/Cuotas')
const Transaccion = require('../models/Transaccion')
const {
    generarLetrasAleatorias,
    generarNumeroTarjetaAleatorio,
    generarFechaVencimientoAleatoria,
    generarCbuAleatorio,
} = require('../utils/fakeDataGenerator')

router.post('/register', async (req, res) => {
    try {
        const { error } = validateSignup(req.body)
        if (error) {
            return res
                .status(400)
                .json({ ok: false, error: error.details[0].message })
        }
        const { fullname, password, email, type_document, nro_document } =
            req.body

        const existingUser = await User.findOne({
            $or: [{ email }, { nro_document }],
        })

        if (existingUser) {
            return res.status(400).json({
                ok: false,
                error: 'Ya existe un usuario con ese email o número de documento.',
            })
        }

        const saltRounds = 10
        const salt = await bcrypt.genSalt(saltRounds)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new User({
            fullname,
            password: hashedPassword,
            email,
            type_document,
            nro_document,
        })

        const userSave = await newUser.save()
        const token = await jwt.sign({ _id: newUser._id }, 'secretkey')
        await createInitialData(userSave)

        res.status(200).json({
            ok: true,
            token,
            fullname,
            id: userSave._id,
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ ok: false, error: 'Error interno del servidor' })
    }
})

router.post('/login', async (req, res) => {
    try {
        const { error } = validateLogin(req.body)
        if (error) {
            return res.status(400).json({ error: error.details[0].message })
        }

        const { type_document, nro_document, password } = req.body

        const user = await User.findOne({ type_document, nro_document })

        if (!user) {
            return res
                .status(401)
                .json({ error: 'El tipo o número de documento no existen' })
        }

        const passwordMatch = await bcrypt.compare(password, user.password)

        if (!passwordMatch) {
            return res
                .status(401)
                .json({ ok: false, error: 'Credenciales incorrectas' })
        }

        const token = jwt.sign({ _id: user._id }, 'secretkey')

        return res
            .status(200)
            .json({ token, fullname: user.fullname, id: user._id })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
})

async function createInitialData(user) {
    const fechaMesAnterior = new Date()
    fechaMesAnterior.setMonth(fechaMesAnterior.getMonth() - 1)

    try {
        const tarjeta1 = new Tarjeta({
            saldo: 10000,
            nro_tarjeta: generarNumeroTarjetaAleatorio(),
            titular: user._id,
            esPrincipal: true,
            fecha_vencimiento: generarFechaVencimientoAleatoria(),
            cbu: generarCbuAleatorio(),
            alias: `${generarLetrasAleatorias(4)}.${generarLetrasAleatorias(
                4
            )}.${generarLetrasAleatorias(4)}`,
        })
        await tarjeta1.save()

        const tarjeta2 = new Tarjeta({
            saldo: 5000,
            nro_tarjeta: generarNumeroTarjetaAleatorio(),
            titular: user._id,
            esPrincipal: false,
            fecha_vencimiento: generarFechaVencimientoAleatoria(),
            cbu: generarCbuAleatorio(),
            alias: `${generarLetrasAleatorias(4)}.${generarLetrasAleatorias(
                4
            )}.${generarLetrasAleatorias(4)}`,
        })
        await tarjeta2.save()
        const tarjeta3 = new Tarjeta({
            saldo: 1000,
            nro_tarjeta: generarNumeroTarjetaAleatorio(),
            titular: user._id,
            esPrincipal: false,
            fecha_vencimiento: generarFechaVencimientoAleatoria(),
            cbu: generarCbuAleatorio(),
            alias: `${generarLetrasAleatorias(4)}.${generarLetrasAleatorias(
                4
            )}.${generarLetrasAleatorias(4)}`,
        })
        await tarjeta3.save()

        const cuotas1 = new Cuotas({
            tarjeta: tarjeta1._id,
            monto: 300,
            cuotas: 'cuota 10 - 24',
            mensual: 100,
            tasaInteres: 10,
        })
        await cuotas1.save()

        const cuotas2 = new Cuotas({
            tarjeta: tarjeta2._id,
            monto: 200,
            cuotas: 'cuota 2 - 6',
            mensual: 40,
            tasaInteres: 20,
        })
        await cuotas2.save()

        user.tarjetas.push(tarjeta1._id, tarjeta2._id, tarjeta3._id)
        await user.save()
    } catch (error) {
        console.log('Error al crear datos iniciales:', error)
    }
}
module.exports = router
