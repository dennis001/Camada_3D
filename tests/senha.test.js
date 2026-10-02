import test from 'node:test'
import assert from 'node:assert/strict'
import { validPassword, validarFormularioAcesso, REGRAS_SENHA } from '../src/lib/senha.js'

test('senha exige 8 caracteres, maiúscula, minúscula e especial sem exigir número', () => {
  for (const special of '!@#$%¨&*./\\|') assert.equal(validPassword(`Abcdefg${special}`), true)
  assert.equal(validPassword('Ábcdefg!'), true)
  for (const password of ['Abcdef!', 'abcdefg!', 'ABCDEFG!', 'Abcdefgh', 'Abcdefg ', 'Ab!' + 'a'.repeat(126), null]) assert.equal(validPassword(password), false)
  assert.equal(validPassword('Ab!' + 'a'.repeat(125)), true)
})

test('validação de formulário usa mensagens em português e foca campo inválido', () => {
  let focused = false
  const input = { tagName: 'INPUT', labels: [{ textContent: 'Nova senha' }], required: true, value: 'abcdefgh', autoComplete: 'new-password', focus: () => { focused = true } }
  assert.throws(() => validarFormularioAcesso({ elements: [input] }), { message: REGRAS_SENHA })
  assert.equal(focused, true)
  input.value = ''
  assert.throws(() => validarFormularioAcesso({ elements: [input] }), /Preencha o campo nova senha/)
  input.value = 'Abcdefg!'
  assert.doesNotThrow(() => validarFormularioAcesso({ elements: [input] }))
})
