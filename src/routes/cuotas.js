const { Router } = require('express')
const router = Router()

const {
    crear,
    obtenerTodas,
    obtenerCuotasTarjetaPrincipal,
} = require('../controllers/cuotas')

router.post('/', crear)
router.get('/:tarjetaId', obtenerTodas)
router.get('/principal/:usuarioId', obtenerCuotasTarjetaPrincipal)
module.exports = router
