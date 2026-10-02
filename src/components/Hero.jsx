import React from 'react'
import { ArrowRight, Box, Layers, Palette } from 'lucide-react'

export default function Hero() {
  return (
    <section id="inicio" className="relative pt-20 overflow-hidden bg-gradient-to-br from-white via-gray-50 to-camada-teal-50">
      <div className="absolute top-20 right-0 w-96 h-96 bg-camada-teal-100 rounded-full blur-3xl opacity-60" aria-hidden="true" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <p className="text-sm uppercase tracking-widest font-semibold text-camada-teal-700 mb-5">Studio Camadas · Impressão 3D</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-camada-dark-900 leading-tight mb-6">Ideias que ganham <span className="gradient-text">forma</span></h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">Peças impressas em 3D para fazer parte do seu dia. Explore os modelos do catálogo e encontre a cor que combina com você.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a href="#catalogo" className="btn-primary inline-flex items-center justify-center gap-2">Explorar catálogo <ArrowRight size={18} aria-hidden="true" /></a>
              <a href="#sobre" className="btn-secondary inline-flex items-center justify-center">Conheça o Studio</a>
            </div>
            <p className="text-sm text-gray-500 mt-6">Catálogo em preparação. As compras ainda não estão disponíveis.</p>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-camada-teal-400 via-camada-teal-500 to-camada-dark-900 p-5 sm:p-8 shadow-xl">
            <div className="rounded-2xl bg-white p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-8"><Layers className="text-camada-teal-600" size={28} aria-hidden="true" /><h2 className="text-xl font-semibold text-camada-dark-900">Cada peça, uma nova forma</h2></div>
              <div className="space-y-5">
                <div className="flex gap-4 p-4 rounded-xl bg-gray-50"><Box size={24} className="text-camada-teal-600 shrink-0" aria-hidden="true" /><div><h3 className="font-medium text-camada-dark-900">Conheça os modelos</h3><p className="text-sm text-gray-600 mt-1">Fotos, materiais e medidas em cada produto.</p></div></div>
                <div className="flex gap-4 p-4 rounded-xl bg-gray-50"><Palette size={24} className="text-camada-teal-600 shrink-0" aria-hidden="true" /><div><h3 className="font-medium text-camada-dark-900">Escolha sua cor</h3><p className="text-sm text-gray-600 mt-1">Confira as opções disponíveis para cada peça.</p></div></div>
              </div>
              <a href="#catalogo" className="mt-7 inline-flex items-center gap-2 font-semibold text-camada-teal-700">Ver produtos <ArrowRight size={18} aria-hidden="true" /></a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
