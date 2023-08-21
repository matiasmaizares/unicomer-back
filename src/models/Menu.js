const { Schema, model } = require('mongoose')

const menuSchema = new Schema(
    {
        title: String,
        icon: String,
        to: String,
    },
    {
        timestamps: true,
    }
)

module.exports = model('Menu', menuSchema, 'menus')
