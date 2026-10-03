import React, { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'

const estados = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ')
const automaticos = ['rua', 'bairro', 'cidade', 'uf']
const campos = [['nome', 'Nome do destinatário', 'name'], ['cep', 'CEP', 'postal-code'], ['rua', 'Rua', 'address-line1'], ['numero', 'Número da residência', 'off'], ['complemento', 'Complemento (opcional)', 'address-line2'], ['bairro', 'Bairro', 'address-level3'], ['cidade', 'Cidade', 'address-level2'], ['uf', 'UF', 'address-level1']]
const input = 'mt-1 block w-full rounded-lg border border-gray-300 p-3 disabled:bg-gray-100'

export default function EnderecoCheckout({ endereco, onChange, onContinuar }) {
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [tentativa, setTentativa] = useState(0)
  const ultimaConsulta = useRef(endereco.cep || '')
  const versao = useRef(0)
  const form = useRef(null)
  const cep = endereco.cep || ''
  useEffect(() => {
    if (!/^\d{8}$/.test(cep) || ultimaConsulta.current === cep) return
    const consulta = ++versao.current
    let ativo = true
    setBuscando(true); setMensagem('Buscando endereço…')
    const timer = setTimeout(async () => {
      try {
        const data = await api(`/cep/${cep}`)
        if (!ativo || consulta !== versao.current) return
        ultimaConsulta.current = cep
        onChange(atual => atual.cep === cep ? { ...atual, ...data.endereco } : atual)
        setMensagem(automaticos.some(key => !data.endereco[key]) ? 'Endereço encontrado parcialmente. Complete os campos que faltam.' : 'Endereço preenchido. Confira os dados e informe o número e complemento, se houver.')
      } catch (error) {
        if (ativo && consulta === versao.current) setMensagem(error.status === 404 ? 'CEP não encontrado. Confira o CEP ou preencha o endereço manualmente.' : 'Não foi possível consultar o CEP agora. Você pode tentar novamente ou preencher o endereço manualmente.')
      } finally { if (ativo && consulta === versao.current) setBuscando(false) }
    }, 350)
    return () => { ativo = false; clearTimeout(timer) }
  }, [cep, tentativa, onChange])

  function alterar(key, value) {
    setErro('')
    if (key === 'cep') {
      const digits = value.replace(/\D/g, '').slice(0, 8)
      if (digits === cep) return
      versao.current++
      ultimaConsulta.current = ''
      setBuscando(false); setMensagem('')
      onChange(atual => ({ ...atual, cep: digits, rua: '', bairro: '', cidade: '', uf: '' }))
    } else onChange(atual => ({ ...atual, [key]: value }))
  }
  function continuar(event) {
    event.preventDefault()
    if (buscando) return
    const values = Object.fromEntries(campos.map(([key]) => [key, (endereco[key] || '').trim()]))
    const missing = campos.find(([key]) => key !== 'complemento' && !values[key])?.[0]
    const invalid = missing || (!/^\d{8}$/.test(values.cep) ? 'cep' : !estados.includes(values.uf) ? 'uf' : null)
    if (invalid) { setErro('Preencha o endereço completo, CEP com 8 dígitos e UF válida.'); form.current.elements.namedItem(invalid)?.focus(); return }
    onChange(values); onContinuar()
  }
  return <form ref={form} noValidate onSubmit={continuar} className="space-y-5">
    <h2 className="text-xl font-semibold">Seus dados e endereço de entrega</h2>
    <p className="text-gray-600">Digite seu CEP para preencher o endereço automaticamente. Não é necessário criar uma conta.</p>
    <div className="grid gap-4 sm:grid-cols-2">{campos.map(([key, label, autoComplete]) => <label key={key}>{label}
      {key === 'uf' ? <select name={key} autoComplete={autoComplete} value={endereco[key] || ''} disabled={buscando} onChange={event => alterar(key, event.target.value)} className={input}><option value="">Selecione</option>{estados.map(uf => <option key={uf}>{uf}</option>)}</select> : <input name={key} autoComplete={autoComplete} value={key === 'cep' ? cep.replace(/^(\d{5})(\d)/, '$1-$2') : endereco[key] || ''} onChange={event => alterar(key, event.target.value)} inputMode={key === 'cep' ? 'numeric' : undefined} required={key !== 'complemento'} maxLength={key === 'cep' ? 9 : 160} disabled={buscando && automaticos.includes(key)} className={input} />}
    </label>)}</div>
    <p role="status" aria-live="polite" className="text-sm text-gray-600">{mensagem}</p>
    {cep.length === 8 && !buscando && <button type="button" className="underline text-sm text-camada-teal-700" onClick={() => { ultimaConsulta.current = ''; setTentativa(value => value + 1) }}>Consultar CEP novamente</button>}
    {erro && <p role="alert" className="text-red-700">{erro}</p>}
    <button disabled={buscando} className="btn-primary disabled:opacity-50">{buscando ? 'Consultando CEP…' : 'Continuar para entrega'}</button>
  </form>
}
