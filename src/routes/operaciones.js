const { Router } = require('express')
const router = Router()

const {
    transferir,
    depositar,
    extraer,
    obtenerTransacciones,
    calcularSaldoYVariacion,
} = require('../controllers/operaciones')

router.post('/transferencia', transferir)
router.post('/depositar', depositar)
router.post('/extraer', extraer)
router.get('/transacciones', obtenerTransacciones)
router.get('/balance', calcularSaldoYVariacion)
module.exports = router
