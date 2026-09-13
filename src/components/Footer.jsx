import React from 'react'
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin, Clock } from 'lucide-react'
import Logo from './Logo'

const Footer = () => {
  return (
    <footer id="contato" className="bg-camada-dark-900 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Logo size="sm" showText={true} variant="light" />
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Transformando ideias em realidade com impressão 3D de alta qualidade. Qualidade, inovação e tecnologia.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-camada-teal-400 transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-camada-teal-400 transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-camada-teal-400 transition-colors">
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Links Rápidos</h3>
            <ul className="space-y-3">
              {['Início', 'Catálogo', 'Sobre Nós', 'Contato'].map((item) => (
                <li key={item}>
                  <a href={`#${item.toLowerCase().replace(' ', '')}`} className="text-gray-400 hover:text-camada-teal-400 transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Contato</h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-camada-teal-500" />
                <span className="text-gray-400">contato@printstore.com.br</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-camada-teal-500" />
                <span className="text-gray-400">(11) 99999-9999</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-camada-teal-500 mt-1" />
                <span className="text-gray-400">Rua 3D, 123 - São Paulo, SP</span>
              </li>
              <li className="flex items-center gap-3">
                <Clock size={18} className="text-camada-teal-500" />
                <span className="text-gray-400">Seg-Sex: 9h-18h</span>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Nossa Especialidade</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-camada-teal-500 flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-gray-400">Prototipagem Rápida</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-camada-dark-700 flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-gray-400">Garantia Estendida</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-camada-teal-500 flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-gray-400">Entrega Expressa</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-camada-dark-700 flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-gray-400">Suporte Técnico</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Benefits Banner */}
        <div className="bg-gradient-to-r from-camada-dark-800 to-camada-teal-700 rounded-2xl p-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="text-white">
              <h4 className="font-semibold mb-1">Material Ecológico</h4>
              <p className="text-sm text-white/80">Reciclado e sustentável</p>
            </div>
            <div className="text-white">
              <h4 className="font-semibold mb-1">Entrega Rápida</h4>
              <p className="text-sm text-white/80">Até 48h para produções</p>
            </div>
            <div className="text-white">
              <h4 className="font-semibold mb-1">Suporte Técnico</h4>
              <p className="text-sm text-white/80">24/7 para dúvidas</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2026 CAMADA — Ideias que ganham forma. Todos os direitos reservados.
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Política de Privacidade</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Termos de Serviço</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Política de Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer