export type CheckoutPayload = {
  products: Array<{ id: number; price: number }>
  delivery: {
    receiver: string
    address: {
      description: string
      city: string
      zipCode: string
      number: number
      complement: string
    }
  }
  payment: {
    card: {
      name: string
      number: string
      code: number
      expires: { month: number; year: number }
    }
  }
}

const checkoutUrl = 'https://api-ebac.vercel.app/api/efood/checkout'

export async function postCheckout(payload: CheckoutPayload): Promise<unknown> {
  const response = await fetch(checkoutUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const responseText = await response.text()
  let responseBody: unknown

  try {
    responseBody = responseText ? JSON.parse(responseText) : null
  } catch {
    responseBody = responseText
  }

  if (!response.ok) {
    const body = responseBody as { message?: unknown } | null
    const message =
      body && typeof body === 'object' && typeof body.message === 'string'
        ? body.message
        : `A API recusou o pedido (HTTP ${response.status}). Confira os dados e tente novamente.`
    throw new Error(message)
  }

  if (responseBody === null) {
    throw new Error('A API respondeu sem dados de confirmação.')
  }

  return responseBody
}
