import React, { useState } from 'react'
import { ShoppingBag, Trash2 } from 'lucide-react'
import { formatarMoeda } from '../lib/produtos.js'

function totalItem(item) {
  const total = item.precoCentavos * item.quantidade
  return Number.isSafeInteger(item.precoCentavos) && item.precoCentavos >= 0 &&
    Number.isSafeInteger(item.quantidade) && item.quantidade > 0 &&
    Number.isSafeInteger(total) ? total : null
}

export default function Carrinho({ itens = [], onQuantidade, onRemover, bloqueado = false }) {
  const [erro, setErro] = useState('')
  const subtotal = itens.reduce((total, item) => {
    if (item.indisponivel) return total
    const valor = totalItem(item)
    return total !== null && valor !== null && Number.isSafeInteger(total + valor) ? total + valor : null
  }, 0)
  const indisponiveis = itens.some((item) => item.indisponivel)

  function alterarQuantidade(item, quantidade) {
    const resultado = onQuantidade(item.chave, quantidade)
    setErro(resultado.ok ? '' : resultado.erro || 'Não foi possível atualizar a quantidade.')
  }

  function remover(chave) {
    onRemover(chave)
    setErro('')
  }

  return (
    <section id="carrinho" aria-labelledby="titulo-carrinho" className="scroll-mt-24 py-16 bg-camada-teal-50/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-3"><ShoppingBag size={28} className="text-camada-teal-700" aria-hidden="true" /><h2 id="titulo-carrinho" className="text-3xl font-bold text-camada-dark-900">Seu carrinho</h2></div>
        <p className="text-gray-600 mb-8">Produzimos sob encomenda. Suas escolhas ficam salvas neste navegador; adicionar ao carrinho não finaliza um pedido.</p>
        {itens.length ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] items-start">
            <div className="min-w-0 rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {itens.map((item) => (
                  <li key={item.chave} className="p-5 sm:p-6 flex flex-col sm:flex-row gap-5 sm:items-center">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-camada-dark-900 break-words">{item.nome}</h3>
                      <p className="text-sm text-gray-600 mt-1">Cor: {item.cor}</p>
                      {item.sku && <p className="text-xs text-gray-500 mt-1 break-words">SKU: {item.sku}</p>}
                      {item.indisponivel ? (
                        <div className="text-sm text-red-700 mt-2">
                          <p>Este produto ou cor saiu do catálogo. Remova-o do carrinho.</p>
                        </div>
                      ) : <p className="text-sm text-gray-600 mt-2">{formatarMoeda(item.precoCentavos)} por unidade</p>}
                    </div>
                    <div className="flex flex-wrap items-center justify-between sm:justify-end gap-4">
                      <div className="inline-flex items-center rounded-lg border border-gray-300" role="group" aria-label={'Quantidade de ' + item.nome + ', ' + item.cor}>
                        <button type="button" onClick={() => alterarQuantidade(item, item.quantidade - 1)} disabled={item.indisponivel || item.quantidade <= 1} aria-label={'Diminuir quantidade de ' + item.nome + ', ' + item.cor} className="px-3 py-2 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">−</button>
                        <span className="min-w-[2rem] px-1 text-center text-sm font-medium" aria-live="polite">{item.quantidade}</span>
                        <button type="button" onClick={() => alterarQuantidade(item, item.quantidade + 1)} disabled={item.indisponivel} aria-label={'Aumentar quantidade de ' + item.nome + ', ' + item.cor} className="px-3 py-2 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">+</button>
                      </div>
                      <p className="font-semibold text-camada-dark-900 sm:min-w-[6rem] sm:text-right">{item.indisponivel ? '—' : formatarMoeda(totalItem(item))}</p>
                      <button type="button" onClick={() => remover(item.chave)} aria-label={'Remover ' + item.nome + ', ' + item.cor + ', do carrinho'} className="p-2 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg"><Trash2 size={19} aria-hidden="true" /></button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <aside aria-label="Resumo do carrinho" className="rounded-2xl border border-gray-200 bg-white p-6">
              <h3 className="font-semibold text-lg text-camada-dark-900 mb-5">Resumo</h3>
              <div className="flex justify-between gap-3 text-camada-dark-900"><span>Subtotal</span><strong>{formatarMoeda(subtotal)}</strong></div>
              <p className="text-sm text-gray-500 mt-2">Somente produtos. Frete ainda não calculado.</p>
              {indisponiveis && <p className="text-sm text-red-700 mt-3">Os itens indisponíveis não entram no subtotal.</p>}
              {subtotal === null && <p className="text-sm text-red-700 mt-3">Não foi possível calcular o subtotal. Revise as quantidades e os valores dos produtos.</p>}
              {!bloqueado && !indisponiveis && subtotal !== null && <a href="/checkout" className="btn-primary block mt-6 text-center">Continuar compra</a>}
              <a href="/#catalogo" className="inline-block mt-5 text-sm font-semibold text-camada-teal-700 underline">Continuar no catálogo</a>
            </aside>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <h3 className="text-xl font-semibold text-camada-dark-900 mb-2">Seu carrinho está vazio</h3>
            <p className="text-gray-600 mb-6">Escolha um produto e uma cor disponível para começar.</p>
            <a href="/#catalogo" className="btn-secondary inline-flex">Explorar catálogo</a>
          </div>
        )}
        <p role="status" aria-live="polite" className="mt-4 text-sm text-red-700">{erro}</p>
      </div>
    </section>
  )
}
