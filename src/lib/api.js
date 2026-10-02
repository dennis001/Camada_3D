export async function api(path, { method = 'GET', body, csrfToken } = {}) {
  let response
  try {
    response = await fetch(`/api${path}`, {
      method, credentials: 'same-origin',
      headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  } catch { throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está iniciado.') }
  const result = await response.json().catch(() => null)
  if (!response.ok || !result) throw Object.assign(new Error(result?.error || 'Servidor indisponível. Tente novamente.'), { status: response.status })
  return result
}

export function downloadJson(data, filename) {
  const url = URL.createObjectURL(new Blob([typeof data === 'string' ? data : JSON.stringify(data, null, 2)], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
