const express = require('express')
const cors = require('cors')
const verifyToken = require('./middlewares/authMiddleware')
const app = express()

require('./database')

// settings
app.set('port', process.env.PORT || 4000)

// middlewares
app.use(express.json())
app.use(cors())

// routes
app.use('/api/auth', require('./routes/index'))
app.use('/api/menu', require('./routes/menu'))
app.use('/api/operaciones', verifyToken, require('./routes/operaciones'))
app.use('/api/tarjeta', verifyToken, require('./routes/tarjeta'))
app.use('/api/cuotas', verifyToken, require('./routes/cuotas'))

app.listen(app.get('port'))
console.log('Server on port', app.get('port'))
