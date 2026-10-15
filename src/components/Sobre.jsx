import React from 'react'
import { Box, Palette, ShoppingBag } from 'lucide-react'

export default function Sobre() {
  const passos = [
    { titulo: 'Encontre uma peça', texto: 'Veja a descrição, o material e as medidas dos modelos cadastrados no catálogo.', Icone: Box },
    { titulo: 'Escolha a cor', texto: 'Escolha entre as combinações cadastradas. Cada peça será produzida sob encomenda.', Icone: Palette },
    { titulo: 'Monte seu carrinho', texto: 'Reúna suas escolhas e confira as quantidades. A finalização da compra será liberada em uma próxima etapa.', Icone: ShoppingBag },
  ]

  return (
    <section id="sobre" aria-labelledby="titulo-sobre" className="scroll-mt-24 py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-camada-teal-700 mb-3">Sobre o Studio</p>
          <h2 id="titulo-sobre" className="text-3xl font-bold text-camada-dark-900 mb-4">Da impressão ao seu dia a dia</h2>
          <p className="text-gray-600 leading-relaxed">O Studio Camadas está preparando uma coleção de produtos impressos em 3D, produzidos sob encomenda, com modelos definidos e escolha de cores.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {passos.map(({ titulo, texto, Icone }, indice) => (
            <div key={titulo} className="rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-5"><Icone size={28} className="text-camada-teal-600" aria-hidden="true" /><span className="font-semibold text-gray-400">0{indice + 1}</span></div>
              <h3 className="text-lg font-semibold text-camada-dark-900 mb-2">{titulo}</h3>
              <p className="text-sm leading-relaxed text-gray-600">{texto}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
