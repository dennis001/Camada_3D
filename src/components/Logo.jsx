import React from 'react'

const Logo = ({ size = 'md', showText = true, variant = 'dark' }) => {
  const sizes = {
    sm: 'h-40 w-48',
    md: 'h-20 w-24',
    lg: 'h-56 w-64',
  }

  return (
    <img
      src="/logo-studio-camadas.jpeg"
      alt="Studio Camadas — Ideias que ganham forma"
      className={`${sizes[size]} object-contain`}
    />
  )
}

export default Logo
