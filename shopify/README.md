# SHOTZ · Landing de produto para Shopify

Pacote para instalar no tema atual da loja **meushotz.com.br** sem trocar catálogo, variantes, preços, estoque, assinatura, carrinho, checkout, pagamentos ou frete. Tudo continua sendo gerido pela Shopify; a página só lê e envia dados pela própria plataforma.

## O que vem no pacote

```
theme/
  layout/shotz.liquid                 Layout próprio, versão editorial (títulos serifados)
  layout/shotz-lata.liquid            Layout próprio, versão lata (grotesca pesada, preto, prata e cores dos sabores)
  templates/product.shotz.json        Template de produto que usa a versão editorial
  templates/product.shotz-lata.json   Template de produto que usa a versão lata
  sections/shotz-header.liquid        Barra de campanhas + cabeçalho + menu mobile
  sections/shotz-product.liquid       Hero → CTA final, seletor de compra, carrinho lateral, diálogos
  sections/shotz-footer.liquid        Rodapé com políticas, pagamento, newsletter e dados legais
  snippets/shotz-icons.liquid         Ícones (estilo Lucide)
  snippets/shotz-meta-tags.liquid     Open Graph / Twitter
  snippets/shotz-structured-data.liquid  Dados estruturados de produto (uma oferta por variante)
  assets/shotz.css                    Estilos (mobile first)
  assets/shotz.js                     Comportamento, compilado de TypeScript
(o código-fonte fica na raiz do repositório: src/ e scripts/build_shopify.py)
```

## Como instalar

1. **Faça uma cópia do tema publicado** em Loja virtual > Temas > ⋯ > Duplicar. Instale primeiro na cópia.
2. Na cópia, abra **Editar código** e crie cada arquivo na pasta correspondente com o conteúdo do pacote. Com a Shopify CLI: `shopify theme push --theme <ID-da-cópia> --path shopify/theme --nodelete`.
3. Em **Produtos > SHOTZ**, no campo *Modelo do tema*, escolha **product.shotz** (editorial) ou **product.shotz-lata** (mesma cara da embalagem). As duas usam as mesmas seções, o mesmo carrinho e as mesmas configurações; muda só a camada visual (`data-look="lata"` em `assets/shotz.css`).
4. Em **Personalizar** (com o produto SHOTZ aberto):
   - envie as fotos (hero, quatro momentos, CTA final e a imagem oficial da tabela nutricional);
   - adicione o bloco de carrossel do app de avaliações dentro da seção SHOTZ;
   - preencha **Dados legais** no rodapé (razão social, CNPJ e endereço).
5. Teste na cópia: trocar sabor, quantidade e assinatura; adicionar ao carrinho; alterar e remover itens; ir ao checkout com e sem assinatura.
6. Publique a cópia.

As fotos de produto enviadas pela marca já vêm no pacote (`assets/shotz-*.webp`): garrafas recortadas com fundo transparente, metades de limão e cranberries recortadas das fotos com frutas, e as duas fotos com frutas usadas no palco dos sabores. Para trocar alguma, substitua o arquivo com o mesmo nome. Os espaços de lifestyle (pessoas) continuam com a ilustração até receberem fotos no editor.

## Como funciona a compra

- O seletor lê as variantes reais (`product.variants`) e o plano de assinatura (`selling_plan_allocations`).
- “Adicionar ao carrinho” usa a Ajax Cart API da Shopify (`/cart/add.js` com `selling_plan` quando for assinatura); o carrinho lateral usa `/cart/change.js` e `/cart.js`.
- “Finalizar compra” leva ao `/checkout` nativo. Nada do checkout foi substituído.
- O formulário também é um `{% form 'product' %}` nativo: sem JavaScript, ainda adiciona a variante padrão ao carrinho.
- Frete grátis: a barra de progresso usa o valor definido na seção (R$ 129,90). Ele precisa ser igual à regra em Configurações > Frete e entrega.

## Medição e privacidade (LGPD)

- O Consent Mode do Google começa com tudo **negado**. Na loja, a página lê o banner nativo da Shopify (Customer Privacy API) e só libera medição após o aceite.
- Recomendado: instalar os apps oficiais **Google & YouTube** (GA4) e **Facebook & Instagram** (Meta Pixel), que já respeitam esse consentimento, e ativar o banner em Configurações > Privacidade do cliente.
- A página envia ao `dataLayer` os eventos GA4 `view_item`, `add_to_cart`, `remove_from_cart`, `view_cart`, `begin_checkout` e `cta_click`, e publica os mesmos dados como eventos personalizados (`shotz_*`) para pixels personalizados da Shopify.

## Pendências e divergências encontradas na loja (17/11/2026)

Encontrei estes pontos ao levantar os dados reais. Nenhum foi “corrigido” na página: ela mostra o que está configurado na loja.

1. **Preço do Cranberry 1 caixa:** está R$ 50,00, enquanto Frutas Tropicais 1 caixa está R$ 100,00. Com isso, a caixa avulsa de Cranberry sai a R$ 8,33 por shot, mais barata que os kits de 2 e 3 caixas, e o selo “Menor preço por shot” cai nela. Se for engano, basta corrigir a variante; a página se ajusta sozinha.
2. **Calorias:** a página de produto diz 95 kcal e a página “A ciência por trás da SHOTZ” diz 100 calorias. Alinhar com o rótulo.
3. **Descrição do produto:** o campo de descrição está com texto de teste (“tedtfsfsdf…”). Ele alimenta SEO, Google Shopping e os dados estruturados. Substituir por uma descrição real e preencher título e meta description em *Listagem do mecanismo de pesquisa*.
4. **Endereço do produto:** o handle atual é `shot-frutas-amarelas`. Sugestão: `shotz` ou `shot-de-proteina`, marcando a opção de criar redirecionamento.
5. **Página de ciência:** há um bloco com “18g” e o texto provisório “Título do stat”.
6. **Políticas:** só a Política de privacidade está publicada. Criar Troca e devolução, Termos de uso e Envio em Configurações > Políticas; o rodapé passa a listá-las automaticamente.
7. **Dados legais:** razão social, CNPJ e endereço não aparecem na loja. O Decreto 7.962/2013 exige essas informações em lojas on-line.
8. **Instagram:** não encontrei o perfil oficial. Preencher em Configurações do tema > Redes sociais.
9. **Avaliações:** as 21 avaliações são carregadas por um app via JavaScript e não puderam ser lidas. Nenhum depoimento foi criado. Com o bloco do app na seção, o carrossel mostra as avaliações reais; a nota média vem dos metafields `reviews.rating` e `reviews.rating_count`.
10. **Tabela nutricional completa:** só existe como imagem. Sódio, açúcares totais, gorduras saturadas e trans, fibras e %VD não estão em texto. Enviar a imagem oficial na seção.
11. **Ingredientes do Cranberry:** a lista publicada é a do sabor Frutas Tropicais (corante betacaroteno). Confirmar a lista do Cranberry.
12. **10% na primeira compra:** a barra de campanhas repete a oferta da loja, mas a página não mostra como obtê-la (cupom, pop-up ou newsletter). Vale deixar explícito.
13. **Starter Kit:** está esgotado; a página informa isso no seletor.
14. **Categoria do produto:** o rótulo informa “Suplemento alimentar líquido”. A página passou a usar essa designação no seletor de compra e no FAQ.
15. **Alegações:** “zero açúcar adicionado”, “zero gordura”, “zero lactose” e os teores de aminoácidos vêm da loja. Vale validar a redação final com o responsável técnico, à luz das normas da Anvisa para suplementos e rotulagem nutricional. A frase “primeiro shot de proteína do Brasil”, presente no site atual, não foi usada por não ter comprovação publicada.

## Fotografia: lista de cenas

| Espaço | Cena | Formato |
|---|---|---|
| Hero | Já resolvido com as fotos da marca (recortes). Opcional: foto única da composição | ~1:1, 2800 px |
| Trabalho | Mulher ou homem em mesa de escritório claro, notebook, SHOTZ na mão | 4:5 |
| Academia | Pessoa comum em academia moderna, pós-treino, sem estética de fisiculturismo | 4:5 |
| Viagem | Mala ou mochila aberta, SHOTZ no bolso lateral, aeroporto ou estrada | 4:5 |
| Rotina | Cozinha com luz da manhã, fruteira, SHOTZ sendo aberto | 4:5 |
| CTA final | Duas garrafas em close sobre superfície clara com sombra suave | ~4:3 |

## Desenvolvimento

Na raiz do repositório:

```powershell
npm run shopify   # gera o site e regenera shopify/theme a partir de src/ (requer Python)
```
