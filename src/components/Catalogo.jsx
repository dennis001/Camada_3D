import React, { useState } from 'react'
import { produtos, categorias } from '../data/produtos'
import { Search, Filter, ShoppingBag, ChevronDown, Star, Box } from 'lucide-react'

const Catalogo = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('todos')
  const [sortOption, setSortOption] = useState('padrao')
  const [filteredProdutos, setFilteredProdutos] = useState(produtos)

  React.useEffect(() => {
    const filtered = produtos.filter(produto => {
      const matchesSearch = produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           produto.descricao.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'todos' || produto.categoria.toLowerCase() === selectedCategory
      return matchesSearch && matchesCategory
    })

    let sorted = [...filtered]
    switch (sortOption) {
      case 'preco-asc':
        sorted.sort((a, b) => {
          const priceA = parseFloat(a.preco.replace('R$ ', '').replace(',', '.'))
          const priceB = parseFloat(b.preco.replace('R$ ', '').replace(',', '.'))
          return priceA - priceB
        })
        break
      case 'preco-desc':
        sorted.sort((a, b) => {
          const priceA = parseFloat(a.preco.replace('R$ ', '').replace(',', '.'))
          const priceB = parseFloat(b.preco.replace('R$ ', '').replace(',', '.'))
          return priceB - priceA
        })
        break
      case 'avaliacao':
        sorted.sort((a, b) => b.avaliacao - a.avaliacao)
        break
      case 'novidade':
        sorted.sort((a, b) => b.id - a.id)
        break
      default:
        break
    }
    setFilteredProdutos(sorted)
  }, [searchTerm, selectedCategory, sortOption])

  return (
    <section id="catalogo" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-camada-dark-900 text-center mb-6">Catálogo de Produtos</h2>
          <p className="text-center text-gray-600 max-w-3xl mx-auto">
            Explore nossa coleção única de produtos impressos em 3D, feitos com materiais premium e design inovador.
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 items-end">
            {/* Busca */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <div className="relative flex items-center">
                <Search size={18} className="absolute left-3 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200"
                />
              </div>
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 bg-white cursor-pointer"
                >
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icone} {cat.nome}
                    </option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Ordenação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ordenar por
              </label>
              <div className="relative">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="w-full appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 bg-white cursor-pointer"
                >
                  <option value="padrao">Padrão</option>
                  <option value="preco-asc">Preço: menor para maior</option>
                  <option value="preco-desc">Preço: maior para menor</option>
                  <option value="avaliacao">Melhor avaliado</option>
                  <option value="novidade">Novidades primeiro</option>
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Resultado da busca */}
            <div className="flex items-center justify-end pb-2 text-sm text-gray-600">
              <span>{filteredProdutos.length} produto{filteredProdutos.length !== 1 ? 's' : ''} encontrado{filteredProdutos.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Grid de produtos */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProdutos.length > 0 ? (
            filteredProdutos.map((produto) => (
              <div key={produto.id} className="group relative">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  {/* Imagem */}
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={produto.imagens[0]} 
                      alt={produto.nome} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Badge de estoque */}
                    {!produto.estoque && (
                      <div className="absolute top-4 left-4 bg-camada-dark-700 text-white text-xs font-medium px-2 py-1 rounded">
                        Indisponível
                      </div>
                    )}
                    {/* Badge de destaque */}
                    {produto.avaliacao >= 4.8 && (
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-camada-teal-500 to-camada-dark-900 text-white text-xs font-medium px-2 py-1 rounded">
                        <Star size={14} className="mr-1" /> Destaque
                      </div>
                    )}
                  </div>
                  
                  {/* Informações do produto */}
                  <div className="p-6">
                    <div className="mb-2 flex justify-between items-start">
                      <span className="text-xs text-camada-teal-600 bg-camada-teal-50 px-2 py-1 rounded">{produto.categoria}</span>
                      <span className="text-xs text-gray-500">{produto.material} • {produto.impressao}</span>
                    </div>
                    
                    <h3 className="text-lg font-medium text-camada-dark-900 mb-3 line-clamp-2">{produto.nome}</h3>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {produto.descricao}
                    </p>
                    
                    <div className="mb-4 flex justify-between items-center">
                      <div className="text-2xl font-bold text-camada-teal-600">{produto.preco}</div>
                      <div className="flex items-center space-x-1">
                        {[1,2,3,4,5].map((star) => (
                          <Star 
                            key={star} 
                            size={14} 
                            fill={star <= Math.floor(produto.avaliacao) ? 'currentColor' : 'none'} 
                            stroke={star <= Math.floor(produto.avaliacao) ? 'currentColor' : 'none'}
                            className={star <= Math.floor(produto.avaliacao) ? 'text-yellow-400' : 'text-gray-300'}
                          />
                        ))}
                        <span className="text-xs text-gray-500 ml-1">({produto.avaliacao})</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => alert('Produto adicionado ao carrinho!')}
                      className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!produto.estoque}
                    >
                      {produto.estoque ? 'Adicionar ao Carrinho' : 'Indisponível'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">Nenhum produto encontrado com os filtros aplicados.</p>
            </div>
          )}
        </div>
        
        {/* Mostrar mais botão */}
        {filteredProdutos.length > 0 && (
          <div className="mt-12 text-center">
            <button className="btn-secondary px-8 py-3">
              Ver Mais Produtos
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

export default Catalogo
        