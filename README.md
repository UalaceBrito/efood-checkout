# efood — checkout

Projeto React + TypeScript com fluxo responsivo de entrega, pagamento e confirmação para o exercício EBAC.

## Executar localmente

```bash
npm install
npm run dev
```

Para validar a versão de produção:

```bash
npm run lint
npm run build
```

## Fluxo implementado

- Formulário obrigatório de destinatário, endereço e cartão.
- Resumo da sacola com alteração de quantidade e total recalculado.
- POST JSON para `https://api-ebac.vercel.app/api/efood/checkout`.
- Tratamento de erro HTTP/rede e estado de envio.
- Tela de confirmação com campos apresentados a partir da resposta da API.
- Resposta detalhada sanitizada para não expor dados de cartão/CVV.

## Integração com o catálogo efood

O repositório original do catálogo não estava disponível no ambiente durante a implementação. Para que o fluxo seja demonstrável, esta versão contém uma sacola inicial de demonstração (IDs `1` e `2`, preços ilustrativos). Antes de usar com o catálogo real, substitua `initialProducts` em `src/App.tsx` pelos itens e preços do carrinho existente; o POST já serializa as quantidades como itens repetidos no formato aceito pela rota.

O arquivo Figma informado retornou HTTP 403 durante a consulta, então o layout foi construído como uma aproximação responsiva, sem alegação de correspondência pixel-perfect ao arquivo. Nenhum dado de cartão é armazenado ou incluído na resposta exibida.

## Publicação na Vercel

Importe `UalaceBrito/efood-checkout` na Vercel e mantenha os valores padrão do Vite:

- Framework preset: **Vite**
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`
