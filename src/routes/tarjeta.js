const { Router } = require('express')
const router = Router()

const {
    crearTarjeta,
    obtenerTarjetas,
    ingresos,
    egresos,
    cambiarPrincipal,
    obtenerTarjetaPrincipal,
    obtenerTodasTarjetas,
} = require('../controllers/tarjeta')

router.post('/:id', crearTarjeta)
router.get('/obtener-tarjetas/:id', obtenerTarjetas)
router.get('/obtener-tarjeta-principal/:id', obtenerTarjetaPrincipal)
router.get('/ingresos', ingresos)
router.get('/egresos', egresos)
router.put(
    '/cambiar-principal/:userId/tarjetaPrincipal/:tarjetaId',
    cambiarPrincipal
)
router.get('/todas-tarjetas/:id', obtenerTodasTarjetas)

module.exports = router
