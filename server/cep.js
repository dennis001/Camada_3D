import { fail } from './catalog.js'

export function criarConsultaViaCep({ fetchImpl = fetch } = {}) {
  return async cep => {
    if (!/^\d{8}$/.test(cep)) throw fail(400, 'Informe um CEP com 8 dígitos.')
    let response
    try {
      response = await fetchImpl(`https://viacep.com.br/ws/${cep}/json/`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000), redirect: 'error',
      })
    } catch { throw fail(503, 'Consulta de CEP indisponível.') }
    if (response.status === 404) throw fail(404, 'CEP não encontrado. Confira o número ou preencha o endereço manualmente.')
    if (!response.ok) throw fail(503, 'Consulta de CEP indisponível.')
    let data
    try { data = await response.json() } catch { throw fail(503, 'Resposta de CEP inválida.') }
    if (data?.erro === true || data?.erro === 'true') throw fail(404, 'CEP não encontrado. Confira o número ou preencha o endereço manualmente.')
    const address = data
    const clean = value => typeof value === 'string' ? value.trim().slice(0, 160) : ''
    if (clean(address?.cep).replace(/\D/g, '') !== cep) throw fail(503, 'Resposta de CEP inválida.')
    const result = { cep, rua: clean(address.logradouro), bairro: clean(address.bairro), cidade: clean(address.localidade), uf: clean(address.uf) }
    if (!result.cidade || !'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ').includes(result.uf)) throw fail(503, 'Resposta de CEP inválida.')
    // Complemento do serviço descreve o logradouro, não apartamento/bloco do cliente.
    return result
  }
}
