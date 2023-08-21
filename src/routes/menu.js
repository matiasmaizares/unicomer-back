const { Router } = require('express')
const router = Router()

const { getMenu, postMenu, saveAll } = require('../controllers/menu')

router.post('/', postMenu)

router.get('/', getMenu)
router.post('/save-all', saveAll)

module.exports = router
