import React from 'react'
import { Instagram, Mail } from 'lucide-react'
import Logo from './Logo'

export default function Footer() {
  const links = [
    { nome: 'Início', href: '#inicio' },
    { nome: 'Catálogo', href: '#catalogo' },
    { nome: 'Sobre o Studio', href: '#sobre' },
    { nome: 'Carrinho', href: '#carrinho' },
  ]

  return (
    <footer id="contato" className="scroll-mt-24 bg-camada-dark-900 text-white pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-10 mb-10">
          <div>
            <Logo size="sm" showText variant="light" />
            <p className="text-gray-300 leading-relaxed mt-3">Studio Camadas. Ideias que ganham forma, camada por camada.</p>
          </div>
          <div className="md:pt-8">
            <h2 className="text-lg font-semibold mb-5">Explore</h2>
            <ul className="space-y-3">{links.map((link) => <li key={link.href}><a href={link.href} className="text-gray-300 hover:text-camada-teal-300">{link.nome}</a></li>)}</ul>
          </div>
          <div className="md:pt-8">
            <h2 className="text-lg font-semibold mb-5">Fale com o Studio</h2>
            <p className="text-sm text-gray-300 leading-relaxed mb-5">Nossos canais oficiais estão em preparação. Os contatos serão publicados aqui quando estiverem disponíveis.</p>
            <ul className="grid grid-cols-2 gap-4 text-sm text-gray-400" aria-label="Canais ainda indisponíveis">
              <li className="flex items-center gap-2"><Instagram size={20} aria-hidden="true" /><span>Instagram <span className="sr-only">indisponível</span></span></li>
              <li className="flex items-center gap-2"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 3h3a5 5 0 0 0 5 5v3a8 8 0 0 1-5-1.75V16a6 6 0 1 1-6-6v3a3 3 0 1 0 3 3V3Z" /></svg><span>TikTok <span className="sr-only">indisponível</span></span></li>
              <li className="flex items-center gap-2"><Mail size={20} aria-hidden="true" /><span>E-mail <span className="sr-only">indisponível</span></span></li>
              <li className="flex items-center gap-2"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 11.5a9 9 0 0 1-13.4 7.85L3 21l1.65-4.6A9 9 0 1 1 21 11.5Z" /><path d="m8.5 7 1.5 3-1.2 1.2a8 8 0 0 0 4 4L14 14l3 1.5c0 1.5-1 2.5-2.5 2.5C10 18 6 14 6 9.5 6 8 7 7 8.5 7Z" transform="translate(2 0) scale(.85)" /></svg><span>WhatsApp <span className="sr-only">indisponível</span></span></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-6 text-sm text-gray-400">© {new Date().getFullYear()} Studio Camadas — Ideias que ganham forma.</div>
      </div>
    </footer>
  )
}
