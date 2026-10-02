export const REGRAS_SENHA = 'Use de 8 a 128 caracteres, com pelo menos uma letra maiúscula, uma minúscula e um caractere especial (por exemplo: !, @, # ou %).'

export function validPassword(password) {
  return typeof password === 'string' && password.length >= 8 && password.length <= 128
    && /\p{Lu}/u.test(password) && /\p{Ll}/u.test(password) && /[\p{P}\p{S}]/u.test(password)
}

// Mensagens próprias para não depender do idioma configurado no navegador.
export function validarFormularioAcesso(form) {
  for (const input of Array.from(form.elements)) {
    if (input.tagName !== 'INPUT') continue
    const label = input.labels?.[0]?.textContent || 'Campo'
    let error = ''
    if (input.required && !input.value.trim()) error = `Preencha o campo ${label.toLowerCase()}.`
    else if (input.type === 'email' && input.validity.typeMismatch) error = 'Informe um e-mail válido.'
    else if (input.autoComplete === 'new-password' && !validPassword(input.value)) error = REGRAS_SENHA
    else if (input.minLength > 0 && input.value.length < input.minLength) error = `${label}: informe pelo menos ${input.minLength} caracteres.`
    else if (input.maxLength > 0 && input.value.length > input.maxLength) error = `${label}: use no máximo ${input.maxLength} caracteres.`
    if (error) { input.focus(); throw new Error(error) }
  }
}
