import React from 'react'

const Logo = ({ size = 'md', showText = true, variant = 'dark' }) => {
  const sizes = {
    sm: 'h-16 w-16',
    md: 'h-20 w-20',
    lg: 'h-28 w-28',
  }

  return (
    <img
      src="/logo-camada.png"
      alt="CAMADA - Ideias que ganham forma"
      className={`${sizes[size]} object-contain`}
    />
  )
}

export default Logo