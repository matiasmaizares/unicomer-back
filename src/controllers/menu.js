const Menu = require('../models/Menu')

const getMenu = async (req, res) => {
    try {
        const menus = await Menu.find()
        return res.status(200).json({ ok: true, menus })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error })
    }
}

const postMenu = async (req, res) => {
    const menu = new Menu(req.body)
    try {
        const menuSave = await menu.save()
        return res.status(200).json({ ok: true, menuSave })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error })
    }
}
const menuItems = [
    { title: 'Inicio', icon: 'fa-solid fa-house', to: '/home' },
    { title: 'Tarjetas', icon: 'fa-solid fa-wallet', to: '/home/tarjetas' },
    {
        title: 'Prestamos',
        icon: 'fa-solid fa-money-check',
        to: '/home/prestamos',
    },
    {
        title: 'Operaciones',
        icon: 'fa-solid fa-right-left',
        to: '/home/operaciones',
    },
    { title: 'Te Ofreccemos', icon: 'fa-solid fa-tags', to: '/home' },
    { title: 'Seguros', icon: 'fa-solid fa-shield', to: '/home' },
    { title: 'Puntos', icon: 'fa-solid fa-gift', to: '/home' },
    { title: 'Ayuda', icon: 'fa-solid fa-circle-question', to: '/home' },
    {
        title: 'Cerrar sesión',
        icon: 'fa-solid fa-arrow-right-from-bracket',
        to: '/home',
    },
]
const saveAll = async (req, res) => {
    try {
        const savedMenuItems = await Menu.insertMany(menuItems)
        res.status(201).json(savedMenuItems)
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: 'An error occurred while saving menu items.',
        })
    }
}
module.exports = {
    getMenu,
    postMenu,
    saveAll,
}
