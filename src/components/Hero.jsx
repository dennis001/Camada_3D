import React from 'react'
import { ArrowRight, CheckCircle, Star, Sparkles, Layers3 } from 'lucide-react'
import Logo from './Logo'

const Hero = () => {
  return (
    <section id="inicio" className="relative pt-20 overflow-hidden bg-gradient-to-br from-white via-gray-50 to-camada-teal-50">
      <div className="absolute top-20 right-0 w-96 h-96 bg-camada-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-camada-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-32 lg:pb-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="text-center lg:text-left animate-slide-up">
            {/* <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-md mb-8">
              <Layers3 size={16} className="text-camada-teal-600" />
              <span className="text-sm font-medium text-gray-700">Tecnologia de impressão 3D</span>
            </div> */}
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-camada-dark-900 leading-tight mb-6">
              Ideias que ganham
              <span className="gradient-text"> forma </span>
            </h1>
            
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Transformamos seus projetos em produtos de alta qualidade com impressão 3D. 
              Personalização, precisão e rapidez em cada peça criada especialmente para você.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <a href="#catalogo" className="btn-primary inline-flex items-center justify-center gap-2">
                Explorar Catálogo
                <ArrowRight size={18} />
              </a>
              <a href="#sobre" className="btn-secondary inline-flex items-center justify-center">
                Como Funciona
              </a>
            </div>
            
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle size={18} className="text-camada-teal-600" />
                <span>Entrega rápida</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={18} className="text-camada-teal-600" />
                <span>Alta qualidade</span>
              </div>
              <div className="flex items-center gap-2">
                <Star size={18} className="text-yellow-400 fill-yellow-400" />
                <span>4.9/5 avaliações</span>
              </div>
            </div>
          </div>
          
          <div className="relative animate-float">
            <div className="relative rounded-3xl bg-gradient-to-br from-camada-teal-400 via-camada-teal-500 to-camada-dark-900 p-8 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="bg-white/95 rounded-2xl p-8 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-camada-dark-900">Nova Coleção</h3>
                    <p className="text-sm text-gray-500">Peças exclusivas em 3D</p>
                  </div>
                  <div className="w-12 h-12 bg-camada-teal-50 rounded-full flex items-center justify-center">
                    <Sparkles size={24} className="text-camada-teal-600" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-camada-dark-900 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                      <div className="h-2 bg-gray-100 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-camada-teal-500 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded mb-2 w-2/3"></div>
                      <div className="h-2 bg-gray-100 rounded w-1/3"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-camada-dark-900 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded mb-2 w-1/2"></div>
                      <div className="h-2 bg-gray-100 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
                
                <button className="w-full mt-6 btn-primary">Ver Produtos</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero