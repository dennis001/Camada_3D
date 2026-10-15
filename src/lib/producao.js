// Uma estimativa por produto/cor: não presumimos mistura de cores na mesma placa.
export function estimarImpressao(quantidade, producao) {
  const unidades = producao?.unidadesPorPlaca
  const minutos = producao?.tempoPlacaMinutos
  if (!Number.isSafeInteger(quantidade) || quantidade <= 0 || !Number.isSafeInteger(unidades) || unidades <= 0 || typeof minutos !== 'number' || !Number.isFinite(minutos) || minutos <= 0) return { placas: null, minutos: null }
  const placas = Math.ceil(quantidade / unidades)
  const total = placas * minutos
  if (!Number.isFinite(total) || total > Number.MAX_SAFE_INTEGER) return { placas: null, minutos: null }
  return { placas, minutos: total }
}

export function resumirImpressao(itens) {
  if (itens.some(item => item.indisponivel || item.impressao?.minutos == null)) return { placas: null, minutos: null }
  const placas = itens.reduce((total, item) => total + item.impressao.placas, 0)
  const minutos = itens.reduce((total, item) => total + item.impressao.minutos, 0)
  return Number.isSafeInteger(placas) && Number.isFinite(minutos) && minutos <= Number.MAX_SAFE_INTEGER ? { placas, minutos } : { placas: null, minutos: null }
}

export function formatarTempoImpressao(minutos) {
  if (minutos == null || !Number.isFinite(minutos) || minutos < 0) return 'A calcular'
  const arredondado = Math.ceil(minutos)
  const horas = Math.floor(arredondado / 60)
  const resto = arredondado % 60
  return horas ? `${horas.toLocaleString('pt-BR')} h${resto ? ` ${resto} min` : ''}` : `${resto} min`
}
