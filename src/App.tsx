import { useState, type FormEvent } from 'react'
import { postCheckout, type CheckoutPayload } from './checkoutApi'
import './App.css'

type Product = {
  id: number
  name: string
  description: string
  price: number
  quantity: number
}

type CheckoutForm = {
  receiver: string
  address: string
  city: string
  zipCode: string
  number: string
  complement: string
  cardName: string
  cardNumber: string
  cardCode: string
  month: string
  year: string
}

const initialProducts: Product[] = [
  {
    id: 1,
    name: 'Pizza da casa',
    description: 'Molho artesanal, queijo e manjericão fresco',
    price: 49.9,
    quantity: 1,
  },
  {
    id: 2,
    name: 'Brownie de chocolate',
    description: 'Brownie macio com chocolate meio amargo',
    price: 12.5,
    quantity: 1,
  },
]

const initialForm: CheckoutForm = {
  receiver: '',
  address: '',
  city: '',
  zipCode: '',
  number: '',
  complement: '',
  cardName: '',
  cardNumber: '',
  cardCode: '',
  month: '',
  year: '',
}

const formatPrice = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function getDisplayValue(value: unknown): string | null {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  return null
}

function getConfirmationFields(value: unknown) {
  const record = asRecord(value)
  if (!record) return []

  const labels: Record<string, string> = {
    orderId: 'Número do pedido',
    id: 'Número do pedido',
    total: 'Total do pedido',
    price: 'Total do pedido',
    deliveryTime: 'Previsão de entrega',
    status: 'Status',
  }

  return Object.entries(labels)
    .map(([key, label]) => {
      const displayValue = getDisplayValue(record[key])
      return displayValue ? { label, value: displayValue } : null
    })
    .filter((field): field is { label: string; value: string } => field !== null)
}

function removeSensitiveData(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(removeSensitiveData)
  const record = asRecord(value)
  if (!record) return value

  return Object.fromEntries(
    Object.entries(record)
      .filter(([key]) => !/payment|card|cvv|cvc|security.?code/i.test(key))
      .map(([key, nestedValue]) => [key, removeSensitiveData(nestedValue)]),
  )
}

function App() {
  const [products, setProducts] = useState(initialProducts)
  const [form, setForm] = useState(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [confirmation, setConfirmation] = useState<unknown>(null)

  const total = products.reduce((sum, product) => sum + product.price * product.quantity, 0)

  function updateForm(field: keyof CheckoutForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function updateQuantity(id: number, change: number) {
    setProducts((current) =>
      current
        .map((product) =>
          product.id === id
            ? { ...product, quantity: Math.max(0, product.quantity + change) }
            : product,
        )
        .filter((product) => product.quantity > 0),
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (products.length === 0) {
      setError('Adicione pelo menos um produto antes de concluir o pedido.')
      return
    }

    const payload: CheckoutPayload = {
      products: products.flatMap(({ id, price, quantity }) =>
        Array.from({ length: quantity }, () => ({ id, price })),
      ),
      delivery: {
        receiver: form.receiver.trim(),
        address: {
          description: form.address.trim(),
          city: form.city.trim(),
          zipCode: form.zipCode.trim(),
          number: Number(form.number),
          complement: form.complement.trim(),
        },
      },
      payment: {
        card: {
          name: form.cardName.trim(),
          number: form.cardNumber.replace(/\D/g, ''),
          code: Number(form.cardCode),
          expires: {
            month: Number(form.month),
            year: Number(form.year),
          },
        },
      },
    }

    setIsSubmitting(true)
    try {
      const result = await postCheckout(payload)
      setConfirmation(result)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Não foi possível concluir o pedido. Tente novamente.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (confirmation !== null) {
    const fields = getConfirmationFields(confirmation)
    const safeResponse = removeSensitiveData(confirmation)

    return (
      <main className="confirmation-page">
        <header className="confirmation-header">
          <a className="wordmark" href="/" aria-label="efood, início">
            efood<span>.</span>
          </a>
        </header>
        <section className="confirmation-card" aria-labelledby="confirmation-title">
          <div className="success-mark" aria-hidden="true">✓</div>
          <p className="eyebrow">Pedido enviado</p>
          <h1 id="confirmation-title">Obrigado pelo seu pedido!</h1>
          <p className="confirmation-copy">
            A API confirmou o recebimento do seu pedido. Você pode acompanhar os dados abaixo.
          </p>
          {fields.length > 0 && (
            <dl className="confirmation-fields">
              {fields.map(({ label, value }) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{label === 'Total do pedido' && !Number.isNaN(Number(value))
                    ? formatPrice(Number(value))
                    : value}</dd>
                </div>
              ))}
            </dl>
          )}
          <details className="api-response">
            <summary>Ver resposta da API</summary>
            <pre>{JSON.stringify(safeResponse, null, 2)}</pre>
          </details>
          <button className="primary-button return-button" onClick={() => window.location.reload()}>
            Voltar ao checkout
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="checkout-page">
      <header className="site-header">
        <a className="wordmark" href="/" aria-label="efood, início">
          efood<span>.</span>
        </a>
        <span className="header-note">Comida boa, entregue com carinho</span>
        <a className="back-link" href="#pedido">Seu pedido</a>
      </header>

      <section className="checkout-intro">
        <div className="intro-content">
          <p className="eyebrow">Falta pouco</p>
          <h1>Finalize seu pedido</h1>
          <p>Preencha seus dados e escolha como deseja pagar.</p>
        </div>
        <div className="steps" aria-label="Etapas do pedido">
          <span className="step complete"><span>1</span> Sacola</span>
          <span className="step-divider" />
          <span className="step active"><span>2</span> Entrega e pagamento</span>
          <span className="step-divider" />
          <span className="step"><span>3</span> Confirmação</span>
        </div>
      </section>

      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <section className="form-section" aria-labelledby="delivery-title">
            <div className="section-heading">
              <span className="section-number">01</span>
              <div>
                <h2 id="delivery-title">Endereço de entrega</h2>
                <p>Onde vamos deixar seu pedido?</p>
              </div>
            </div>

            <div className="field-grid">
              <label className="field full-width">
                <span>Quem vai receber?</span>
                <input autoComplete="name" required value={form.receiver} onChange={(event) => updateForm('receiver', event.target.value)} placeholder="Nome completo" />
              </label>
              <label className="field full-width">
                <span>Endereço</span>
                <input autoComplete="street-address" required value={form.address} onChange={(event) => updateForm('address', event.target.value)} placeholder="Rua, avenida..." />
              </label>
              <label className="field">
                <span>Cidade</span>
                <input autoComplete="address-level2" required value={form.city} onChange={(event) => updateForm('city', event.target.value)} placeholder="Sua cidade" />
              </label>
              <label className="field">
                <span>CEP</span>
                <input autoComplete="postal-code" inputMode="numeric" required maxLength={9} value={form.zipCode} onChange={(event) => updateForm('zipCode', event.target.value)} placeholder="00000-000" />
              </label>
              <label className="field">
                <span>Número</span>
                <input required type="number" min="1" value={form.number} onChange={(event) => updateForm('number', event.target.value)} placeholder="Nº" />
              </label>
              <label className="field">
                <span>Complemento <em>opcional</em></span>
                <input autoComplete="address-line2" value={form.complement} onChange={(event) => updateForm('complement', event.target.value)} placeholder="Apto, bloco..." />
              </label>
            </div>
          </section>

          <section className="form-section payment-section" aria-labelledby="payment-title">
            <div className="section-heading">
              <span className="section-number">02</span>
              <div>
                <h2 id="payment-title">Pagamento</h2>
                <p>Pagamento seguro com cartão de crédito</p>
              </div>
              <span className="card-badge" aria-hidden="true">VISA ·•••</span>
            </div>

            <div className="field-grid">
              <label className="field full-width">
                <span>Nome impresso no cartão</span>
                <input autoComplete="cc-name" required value={form.cardName} onChange={(event) => updateForm('cardName', event.target.value)} placeholder="Como aparece no cartão" />
              </label>
              <label className="field full-width">
                <span>Número do cartão</span>
                <input autoComplete="cc-number" inputMode="numeric" required minLength={13} maxLength={19} value={form.cardNumber} onChange={(event) => updateForm('cardNumber', event.target.value.replace(/\D/g, '').slice(0, 19))} placeholder="0000 0000 0000 0000" />
              </label>
              <label className="field">
                <span>Validade</span>
                <div className="expiry-inputs">
                  <input aria-label="Mês de validade" autoComplete="cc-exp-month" inputMode="numeric" required min="1" max="12" maxLength={2} value={form.month} onChange={(event) => updateForm('month', event.target.value.replace(/\D/g, '').slice(0, 2))} placeholder="MM" />
                  <span>/</span>
                  <input aria-label="Ano de validade" autoComplete="cc-exp-year" inputMode="numeric" required minLength={4} maxLength={4} value={form.year} onChange={(event) => updateForm('year', event.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="AAAA" />
                </div>
              </label>
              <label className="field">
                <span>CVV</span>
                <input autoComplete="cc-csc" inputMode="numeric" required minLength={3} maxLength={4} value={form.cardCode} onChange={(event) => updateForm('cardCode', event.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="000" />
              </label>
            </div>
            <p className="secure-note"><span aria-hidden="true">⌑</span> Seus dados são enviados com segurança para a API de checkout.</p>
          </section>

          {error && <p className="error-message" role="alert">{error}</p>}
          <button className="primary-button submit-button" type="submit" disabled={isSubmitting || products.length === 0}>
            {isSubmitting ? 'Enviando pedido...' : 'Concluir pedido'}
            {!isSubmitting && <span aria-hidden="true">→</span>}
          </button>
          <p className="terms-note">Ao concluir, você confirma os dados do pedido e do pagamento.</p>
        </form>

        <aside className="order-card" id="pedido" aria-labelledby="order-title">
          <div className="order-heading">
            <div>
              <p className="eyebrow">Resumo</p>
              <h2 id="order-title">Seu pedido</h2>
            </div>
            <span className="item-count">{products.reduce((sum, item) => sum + item.quantity, 0)} itens</span>
          </div>
          <div className="product-list">
            {products.length === 0 ? (
              <p className="empty-cart">Sua sacola está vazia. Adicione produtos para continuar.</p>
            ) : products.map((product) => (
              <article className="product" key={product.id}>
                <div className={`product-thumb thumb-${product.id % 3}`} aria-hidden="true">
                  <span>{product.id % 3 === 1 ? '🍕' : product.id % 3 === 2 ? '🍫' : '🥤'}</span>
                </div>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <div className="quantity-control" aria-label={`Quantidade de ${product.name}`}>
                    <button type="button" onClick={() => updateQuantity(product.id, -1)} aria-label={`Remover uma unidade de ${product.name}`}>−</button>
                    <span>{product.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(product.id, 1)} aria-label={`Adicionar uma unidade de ${product.name}`}>+</button>
                  </div>
                </div>
                <strong className="product-price">{formatPrice(product.price * product.quantity)}</strong>
              </article>
            ))}
          </div>
          <div className="order-totals">
            <div><span>Subtotal</span><span>{formatPrice(total)}</span></div>
            <div><span>Entrega</span><span className="free-delivery">Grátis</span></div>
            <div className="grand-total"><strong>Total</strong><strong>{formatPrice(total)}</strong></div>
          </div>
          <div className="delivery-estimate">
            <span className="delivery-icon" aria-hidden="true">⌁</span>
            <div><strong>Entrega estimada</strong><span>Entre 30 e 45 minutos</span></div>
          </div>
          <p className="demo-note">Sacola de demonstração: substitua estes itens pelos produtos do catálogo efood ao integrar ao projeto original.</p>
        </aside>
      </div>
      <footer className="site-footer"><span>efood<span className="footer-dot">.</span></span><span>Feito para matar sua fome.</span></footer>
    </main>
  )
}

export default App
