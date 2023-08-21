const jwt = require('jsonwebtoken')

async function verifyToken(req, res, next) {
    try {
        if (!req.headers.authorization) {
            return res.status(401).send('Unauthorized Request')
        }
        let token = req.headers.authorization.split(' ')[1]
        if (token === 'null') {
            return res.status(401).send('Unauthorized Request')
        }

        const payload = await jwt.verify(token, 'secretkey')
        if (!payload) {
            return res.status(401).send('Unauthorized Request')
        }
        req.userId = payload._id
        next()
    } catch (e) {
        return res.status(401).send('Unauthorized Request')
    }
}

module.exports = verifyToken
