# SHOTZ · Landing de produto

Site estático da página de produto SHOTZ, em duas versões visuais:

- `/` → versão editorial (títulos serifados)
- `/lata` → versão com a cara da embalagem

O carrinho funciona no próprio site e o botão **Finalizar compra** leva ao checkout oficial da loja Shopify (meushotz.com.br), com os preços, as variantes e a assinatura reais.

## Requisitos

- [Node.js](https://nodejs.org) 18 ou mais novo (recomendado: versão LTS)
- [Git](https://git-scm.com)

## Rodar no computador

```powershell
npm install
npm run dev
```

Abra http://localhost:3000 (editorial) ou http://localhost:3000/lata (versão lata).
Ao salvar qualquer arquivo em `src/`, o site é gerado de novo; é só recarregar a página.

## Estrutura

```
src/
  index.html      Marcação de todas as seções + configuração comercial (bloco "shotz-config")
  shotz.css       Estilos (mobile first); a versão lata fica no bloco [data-look="lata"]
  shotz.ts        Comportamento: seletor de compra, carrinho lateral, checkout, analytics
  img/            Fotos otimizadas (WebP)
scripts/
  build.mjs       Gera o site em public/
  dev.mjs         Servidor local com recarga do build
  build_shopify.py  Gera os arquivos do tema Shopify em shopify/theme (opcional, requer Python)
shopify/          Versão para instalar no tema Shopify + instruções
vercel.json       Configuração de publicação na Vercel
```

### Onde mudar preços e textos comerciais

Os preços, IDs de variante e regras (frete grátis, assinatura) ficam no bloco
`<script type="application/json" id="shotz-config">` no fim de `src/index.html`.
Eles precisam ser iguais aos da Shopify, porque o checkout usa os IDs das variantes.

## Publicar

1. **GitHub:** crie um repositório vazio e envie esta pasta (passo a passo no guia de instalação).
2. **Vercel:** em *Add New → Project*, importe o repositório. As configurações já vêm do `vercel.json`
   (build `npm run build`, saída `public`). Cada novo `git push` publica de novo.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor local em http://localhost:3000 |
| `npm run build` | Gera o site em `public/` |
| `npm run typecheck` | Verifica os tipos do TypeScript |
| `npm run shopify` | Gera o site e o tema Shopify em `shopify/theme` (requer Python) |
