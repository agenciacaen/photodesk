import crypto from 'crypto'

export async function dispararWebhook(url: string, secret: string, payload: object) {
  try {
    const body = JSON.stringify(payload)
    const ts   = Date.now().toString()
    const sig  = crypto.createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex')

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type':          'application/json',
        'X-PhotoDesk-Timestamp': ts,
        'X-PhotoDesk-Signature': `sha256=${sig}`,
      },
      body,
      signal: AbortSignal.timeout(15000), // Timeout de 15s para evitar que a API fique travada
    })
    
    return { sucesso: res.ok, status: res.status }
  } catch (error) {
    console.error("Erro ao disparar webhook:", error)
    return { sucesso: false, status: 500, error }
  }
}

// Validação no site do cliente (WordPress / Next.js / etc) 
// - Incluída aqui por completude da spec, embora seja primariamente usada do lado do cliente do webhook
export function verificarWebhook(body: string, ts: string, sig: string, secret: string) {
  try {
    const expected = `sha256=${crypto.createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex')}`
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  } catch (error) {
    return false
  }
}
