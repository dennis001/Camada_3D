import test from 'node:test'
import assert from 'node:assert/strict'
import { criarConsultaViaCep } from '../server/cep.js'

test('ViaCEP consulta apenas CEP válido e retorna endereço sem confundir complemento', async () => {
  const calls = []
  const consultar = criarConsultaViaCep({ fetchImpl: async (url, options) => {
    calls.push(url)
    assert.equal(options.redirect, 'error')
    assert.ok(options.signal)
    return Response.json({ cep: '01001-000', logradouro: 'Praça da Sé', bairro: 'Sé', localidade: 'São Paulo', uf: 'SP', complemento: 'lado ímpar' })
  } })
  await assert.rejects(consultar('123'), { statusCode: 400 })
  await assert.rejects(consultar('../etc'), { statusCode: 400 })
  assert.equal(calls.length, 0)
  assert.deepEqual(await consultar('01001000'), { cep: '01001000', rua: 'Praça da Sé', bairro: 'Sé', cidade: 'São Paulo', uf: 'SP' })
  assert.deepEqual(calls, ['https://viacep.com.br/ws/01001000/json/'])
})

test('ViaCEP distingue inexistência, falha de serviço e resposta incorreta', async () => {
  for (const body of [{ erro: true }, { erro: 'true' }]) await assert.rejects(criarConsultaViaCep({ fetchImpl: async () => Response.json(body) })('99999999'), { statusCode: 404 })
  for (const fetchImpl of [
    async () => { throw new Error('timeout') },
    async () => new Response('', { status: 503 }),
    async () => new Response('não é JSON'),
    async () => Response.json({ cep: '99999-999', localidade: 'Cidade', uf: 'SP' }),
    async () => Response.json({ cep: '01001-000', localidade: 'Cidade', uf: 'XX' }),
  ]) await assert.rejects(criarConsultaViaCep({ fetchImpl })('01001000'), { statusCode: 503 })
})

test('CEP de localidade permite completar rua e bairro manualmente', async () => {
  const consultar = criarConsultaViaCep({ fetchImpl: async () => Response.json({ cep: '12345-678', logradouro: '', bairro: '', localidade: 'Cidade', uf: 'SP' }) })
  assert.deepEqual(await consultar('12345678'), { cep: '12345678', rua: '', bairro: '', cidade: 'Cidade', uf: 'SP' })
})
