import React, { useRef, useState } from 'react'
import { Menu, X, ShoppingBag, Search } from 'lucide-react'
import Logo from './Logo'
import { podeAdministrar } from '../lib/acesso'

export default function Navbar({ quantidadeCarrinho = 0, user = null }) {
  const [aberto, setAberto] = useState(false)
  const botaoMenu = useRef(null)
  const links = [
    { nome: 'Início', href: '#inicio' },
    { nome: 'Catálogo', href: '#catalogo' },
    { nome: 'Sobre', href: '#sobre' },
    { nome: 'Contato', href: '#contato' },
    ...(podeAdministrar(user) ? [{ nome: 'Administração', href: '/admin' }] : []),
    { nome: user ? 'Minha conta' : 'Entrar', href: '/login' },
  ]

  function buscar(event) {
    event.preventDefault()
    setAberto(false)
    window.location.hash = 'busca-produtos'
    document.getElementById('busca-produtos')?.focus({ preventScroll: true })
  }

  function fecharComEscape(event) {
    if (event.key === 'Escape' && aberto) {
      setAberto(false)
      botaoMenu.current?.focus()
    }
  }

  return (
    <nav aria-label="Navegação principal" onKeyDown={fecharComEscape} className="fixed inset-x-0 top-0 bg-white/95 backdrop-blur-md shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 gap-3">
          <a href="#inicio" onClick={() => setAberto(false)} aria-label="Studio Camadas — Início"><Logo size="md" showText variant="dark" /></a>
          <div className="hidden lg:flex items-center gap-2">
            {links.map((link) => <a key={link.href} href={link.href} className="text-gray-600 hover:text-camada-teal-700 px-3 py-2 rounded-md text-sm font-medium">{link.nome}</a>)}
          </div>
          <div className="flex items-center gap-3">
            <a href="#busca-produtos" onClick={buscar} aria-label="Buscar produtos" className="p-2 text-gray-600 hover:text-camada-teal-700"><Search size={21} aria-hidden="true" /></a>
            <a href="#carrinho" onClick={() => setAberto(false)} aria-label={'Carrinho: ' + quantidadeCarrinho + ' item(ns)'} className="p-2 text-gray-600 hover:text-camada-teal-700 relative mr-2">
              <ShoppingBag size={21} aria-hidden="true" />
              <span aria-hidden="true" className="absolute -top-1 -right-2 min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full bg-camada-teal-600 text-white text-xs font-semibold">{quantidadeCarrinho}</span>
            </a>
            <button ref={botaoMenu} type="button" onClick={() => setAberto(!aberto)} aria-expanded={aberto} aria-controls="menu-mobile" aria-label={aberto ? 'Fechar menu' : 'Abrir menu'} className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100">
              {aberto ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>
      <div id="menu-mobile" hidden={!aberto} className="lg:hidden bg-white border-t">
        <div className="px-4 pt-2 pb-5 space-y-1">
          {links.map((link) => <a key={link.href} href={link.href} onClick={() => setAberto(false)} className="block px-3 py-3 font-medium text-gray-700 hover:bg-gray-50 rounded-md">{link.nome}</a>)}
          <a href="#carrinho" onClick={() => setAberto(false)} className="block px-3 py-3 font-medium text-camada-teal-700">Carrinho ({quantidadeCarrinho})</a>
        </div>
      </div>
    </nav>
  )
}
