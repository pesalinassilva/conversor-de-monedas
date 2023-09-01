// ---- DECLARACIÓN DE VARIABLES----
let monto = document.querySelector("#monto")
let tipoMoneda = document.querySelector("#tipoMoneda")
let resultado = document.querySelector("#resultado")
let btnConvertir = document.querySelector("#buscar")
let contenedorGrafico = document.querySelector('.grafico')
let grafico = document.querySelector("#myChart")

// ---- FUNCION PARA ACCEDER A API CON UN MENSAJE DE ERROR EN CASO QUE NO CARGUE LA API ----
async function getApi(url){
    try {
        const res = await fetch(url)
        const data = await res.json()
        return data
    }catch(e){
        //alert('Ups! hubo un problema inesperado :c ' + e.message)
        resultado.innerHTML = `Ups! hubo un problema inesperado :c ${e.message}`
    }
}

// ---- FUNCION PARA TRANSFORMAR OBJETO A ARREGLO ----
async function objToArray(api){
    const monedas = await getApi(api)
    delete monedas.version
    delete monedas.autor
    delete monedas.fecha
    const monedasArray = Object.entries(monedas)
    const newMonedas = monedasArray.filter(([,moneda]) => {
        return moneda.unidad_medida == 'Pesos' ||  moneda.unidad_medida == 'Dólar'
    })
    return newMonedas
}

// ---- FUNCION PARA LLENAR SELECTS DE FORMA DINÁMICA ----
async function selectMoneda(){
    const monedas = await objToArray('https://mindicador.cl/api')
    let html = '<option disabled selected value> Selecciona una moneda </option>'
    monedas.forEach(([,moneda]) => {
        html += `
        <option value='${moneda.nombre}'>${moneda.nombre}</option>
        `
    })
    tipoMoneda.innerHTML = html

}

// ---- LLENAR LAS OPCIONES DE MENÚ SELECT AL CARGAR LA PÁGINA ----
selectMoneda()

// ---- FUNCION PARA CONVERTIR LAS MONEDAS QUE ESTÁN EN DÓLARES Y NO EN PESOS (PESOS A DOLARES Y DE DOLARES A LA MONEDA INDICADA) ----
async function conversor(monto,monedaDifDePesos){
    const monedas = await objToArray('https://mindicador.cl/api')
    let valorDolar = 0
    let valorMonedaInput = 0
    monedas.forEach((moneda) => {
        if (moneda[1].codigo == 'dolar'){
            valorDolar += moneda[1].valor
        }else if (moneda[1].codigo == monedaDifDePesos){
            valorMonedaInput += moneda[1].valor
        }
    })
    let valorConvertido = (monto/valorDolar)/valorMonedaInput
    return valorConvertido.toFixed(2)
}

// ---- FUNCION PARA CREAR LAS PROPIEDADES DEL GRÁFICO Y RENDERIZAR----
let nuevoGrafico
async function crearGrafico(moneda){
    const monedaData = await getApi(`https://mindicador.cl/api/${moneda}`)
    contador = 0
    const fechaValor = monedaData.serie.flatMap((date) => {
        if(contador <= 9){
            contador += 1
            return date
        }else{
            return []
        }
    })

    let labels = fechaValor.map((fecha) => {
        return fecha.fecha
    })

    let data = fechaValor.map((valor) => {
        return valor.valor
    })

    if (nuevoGrafico) {
        nuevoGrafico.destroy();
    }

    const config = {
        type: 'line',
        data:{
            labels: labels,
            datasets: [
                {
                    label: `Valor ${moneda} los últimos 10 días`,
                    backgroundColor: 'red',
                    data: data
                }
            ]
        }
    }
    nuevoGrafico = new Chart(grafico, config)
    return nuevoGrafico
}

// ---- FUNCION PARA CONVERTIR EL MONTO CLP A LA MONEDA INDICADA ----
async function convertirMoneda(){
    const monedas = await objToArray('https://mindicador.cl/api')
    let montoValor = monto.value
    monedas.forEach( async ([,moneda]) => {
        if (tipoMoneda.value == moneda.nombre){
            if (moneda.unidad_medida !== 'Dólar'){
                resultado.innerHTML = `Resultado: ${montoValor} CLP son ${(montoValor/moneda.valor).toFixed(2)} ${(moneda.codigo).toUpperCase()}`
                crearGrafico(moneda.codigo)
            }else if(moneda.unidad_medida == 'Dólar'){
                let monedaConvertida = await conversor(montoValor,moneda.codigo)
                resultado.innerHTML = `Resultado: ${montoValor} CLP son ${monedaConvertida} ${(moneda.codigo).toUpperCase()}`
                crearGrafico(moneda.codigo)
            }
        }
    })
}

// ---- BOTÓN QUE GATILLA EL CALCULO ----
btnConvertir.addEventListener('click', async () => {
    let montoInput = monto.value
    let tipoMonedaInput = tipoMoneda.value
    if (montoInput != ''){
        contenedorGrafico.style.display = 'flex'
        convertirMoneda()
    }else if(montoInput == '' || tipoMonedaInput == ''){
        alert('Ingrese monto y seleccione moneda')
    }
    
})


