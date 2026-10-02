export function podeAdministrar(user) {
  return Boolean(user && ['admin', 'developer'].includes(user.role))
}
