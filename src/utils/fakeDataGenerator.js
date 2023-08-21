// Generar letras aleatorias
function generarLetrasAleatorias(longitud) {
    let letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let resultado = ''
    for (let i = 0; i < longitud; i++) {
        resultado += letras.charAt(Math.floor(Math.random() * letras.length))
    }
    return resultado
}

// Generar un número de tarjeta aleatorio en el formato 4929 8743 9832 5167
function generarNumeroTarjetaAleatorio() {
    const numeroBloques = Array.from({ length: 4 }, () =>
        Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, '0')
    )
    return numeroBloques.join(' ')
}

// Generar fecha de vencimiento aleatoria
function generarFechaVencimientoAleatoria() {
    const now = new Date()
    const futureYear = now.getFullYear() + Math.floor(Math.random() * 5)
    const futureMonth = Math.floor(Math.random() * 12) + 1

    if (futureMonth === 12) {
        futureYear++
    }

    return `${futureMonth.toString().padStart(2, '0')}/${futureYear
        .toString()
        .substr(2)}`
}

// Generar CBU aleatorio
function generarCbuAleatorio() {
    return Array.from({ length: 20 }, () =>
        Math.floor(Math.random() * 10)
    ).join('')
}

module.exports = {
    generarLetrasAleatorias,
    generarNumeroTarjetaAleatorio,
    generarFechaVencimientoAleatoria,
    generarCbuAleatorio,
}
