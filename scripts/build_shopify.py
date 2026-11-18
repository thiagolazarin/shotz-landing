"""Gera o pacote de tema Shopify (Liquid) a partir da prévia src/index.html.

A marcação das seções é a mesma da prévia; aqui entram os pontos dinâmicos:
dados do produto e da assinatura, fotos (image_tag com srcset/WebP/AVIF automáticos),
políticas, formas de pagamento, formulário de newsletter e app de avaliações.
"""
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = (ROOT / "src" / "index.html").read_text(encoding="utf-8")
OUT = ROOT / "shopify" / "theme"
if OUT.exists():
    shutil.rmtree(OUT)
for d in ("layout", "sections", "snippets", "templates", "assets"):
    (OUT / d).mkdir(parents=True)


def between(text: str, start: str, end: str, include_end: bool = True) -> str:
    i = text.index(start)
    j = text.index(end, i)
    return text[i:j + (len(end) if include_end else 0)]


def must_replace(text: str, old: str, new: str, count: int = 1) -> str:
    assert text.count(old) >= count, f"não encontrado: {old[:80]}"
    return text.replace(old, new, count)


def img_or_art(setting: str, art_html: str, width: int, widths: str, sizes: str, alt: str, extra: str = "") -> str:
    """Foto escolhida no editor do tema; sem foto, mantém a ilustração da prévia."""
    return (
        f"{{%- liquid\n  assign img = section.settings.{setting}\n  assign img_alt = img.alt | default: '{alt}'\n-%}}\n"
        f"{{%- if img != blank -%}}{{{{ img | image_url: width: {width} | image_tag: widths: '{widths}', sizes: '{sizes}', loading: 'lazy', alt: img_alt{extra} }}}}"
        f"{{%- else -%}}{art_html}{{%- endif -%}}"
    )


# ---------------------------------------------------------------- ícones
icons = between(SRC, '<svg width="0" height="0" style="position:absolute"', "</svg>\n\n<div class=\"announce\"", include_end=False).rstrip()
(OUT / "snippets" / "shotz-icons.liquid").write_text("{%- comment -%} Ícones no estilo Lucide usados pelas seções SHOTZ {%- endcomment -%}\n" + icons + "\n", encoding="utf-8")

# ---------------------------------------------------------------- header
header = between(SRC, '<div class="announce"', "</header>")
header = must_replace(header, """    <p class="announce__item is-active"><svg class="icon" aria-hidden="true"><use href="#i-truck"/></svg>Frete grátis em pedidos acima de R$ 129,90</p>
    <p class="announce__item"><svg class="icon" aria-hidden="true"><use href="#i-sparkles"/></svg>10% OFF na sua primeira compra</p>
    <p class="announce__item"><svg class="icon" aria-hidden="true"><use href="#i-repeat"/></svg>Assinatura mensal com 15% de desconto</p>""",
"""    {%- assign icons = 'truck,sparkles,repeat' | split: ',' -%}
    {%- assign shown = 0 -%}
    {%- for i in (1..3) -%}
      {%- assign key = 'announcement_' | append: i -%}
      {%- assign msg = section.settings[key] -%}
      {%- if msg != blank -%}
        <p class="announce__item{% if shown == 0 %} is-active{% endif %}"><svg class="icon" aria-hidden="true"><use href="#i-{{ icons[forloop.index0] }}"/></svg>{{ msg | escape }}</p>
        {%- assign shown = shown | plus: 1 -%}
      {%- endif -%}
    {%- endfor -%}""")
header = must_replace(header, '<div class="announce" role="region" aria-label="Promoções da loja">',
                      '{%- if section.settings.show_announcement -%}\n<div class="announce" role="region" aria-label="Promoções da loja">')
header = must_replace(header, "</div>\n</div>\n\n<header", "</div>\n</div>\n{%- endif -%}\n\n<header")
header = must_replace(header, """    <a class="logo" href="#inicio" aria-label="SHOTZ, ir para o início">
      <span class="logo__word">SHOTZ</span>
    </a>""", """    <a class="logo" href="#inicio" aria-label="{{ shop.name | escape }}, ir para o início">
      {%- if settings.logo != blank -%}
        {{ settings.logo | image_url: height: 56 | image_tag: class: 'logo__img', alt: shop.name, loading: 'eager' }}
      {%- else -%}
      <span class="logo__word">SHOTZ</span>
      {%- endif -%}
    </a>""")
header = must_replace(header, '<span class="cart-count" data-cart-count aria-hidden="true">0</span>',
                      '<span class="cart-count{% if cart.item_count > 0 %} has-items{% endif %}" data-cart-count aria-hidden="true">{{ cart.item_count }}</span>')
header = must_replace(header, '<li><svg class="icon" aria-hidden="true"><use href="#i-mail"/></svg>contato@meushotz.com.br</li>',
                      '{%- if section.settings.contact_email != blank -%}<li><svg class="icon" aria-hidden="true"><use href="#i-mail"/></svg>{{ section.settings.contact_email }}</li>{%- endif -%}')
header_schema = """
{% schema %}
{
  "name": "SHOTZ · Cabeçalho",
  "settings": [
    { "type": "checkbox", "id": "show_announcement", "label": "Mostrar barra de campanhas", "default": true },
    { "type": "text", "id": "announcement_1", "label": "Campanha 1", "default": "Frete grátis em pedidos acima de R$ 129,90" },
    { "type": "text", "id": "announcement_2", "label": "Campanha 2", "default": "10% OFF na sua primeira compra" },
    { "type": "text", "id": "announcement_3", "label": "Campanha 3", "default": "Assinatura mensal com 15% de desconto" },
    { "type": "text", "id": "contact_email", "label": "E-mail no menu mobile", "default": "contato@meushotz.com.br" }
  ]
}
{% endschema %}
"""
(OUT / "sections" / "shotz-header.liquid").write_text(header + "\n" + header_schema, encoding="utf-8")

# ---------------------------------------------------------------- footer
footer = between(SRC, '<footer class="site-footer">', "</footer>")
footer = must_replace(footer, """        <a class="logo" href="#inicio" aria-label="SHOTZ, ir para o início">
          <span class="logo__word">SHOTZ</span>
        </a>
        <p>Proteína em formato de shot. 23 g em 100 ml, pronta para beber.</p>""", """        <a class="logo" href="{{ routes.root_url }}" aria-label="{{ shop.name | escape }}, página inicial">
          {%- if settings.logo != blank -%}
            {{ settings.logo | image_url: height: 56 | image_tag: class: 'logo__img', alt: shop.name, loading: 'lazy' }}
          {%- else -%}
          <span class="logo__word">SHOTZ</span>
          {%- endif -%}
        </a>
        <p>{{ section.settings.description | escape }}</p>""")
newsletter_old = between(footer, '<form class="newsletter" data-newsletter novalidate>', "</form>")
footer = footer.replace(newsletter_old, """{%- if section.settings.show_newsletter -%}
        {%- form 'customer', class: 'newsletter', id: 'shotz-newsletter' -%}
          <input type="hidden" name="contact[tags]" value="newsletter">
          <label for="newsletter-email">Receba novidades e ofertas</label>
          <div class="newsletter__row">
            <input id="newsletter-email" name="contact[email]" type="email" autocomplete="email" placeholder="seu@email.com" required>
            <button class="btn btn--primary btn--sm" type="submit">Cadastrar</button>
          </div>
          <p class="newsletter__msg" role="status">
            {%- if form.posted_successfully? -%}Cadastro feito. Você vai receber nossas novidades.
            {%- elsif form.errors -%}Confira o e-mail digitado e tente de novo.{%- endif -%}
          </p>
        {%- endform -%}
        {%- endif -%}""")
footer = must_replace(footer, """            <li><a class="with-icon" href="mailto:contato@meushotz.com.br"><svg class="icon icon--sm" aria-hidden="true"><use href="#i-mail"/></svg>contato@meushotz.com.br</a></li>
            <li><a class="with-icon" href="https://meushotz.com.br/pages/contact">""", """            {%- if section.settings.contact_email != blank -%}<li><a class="with-icon" href="mailto:{{ section.settings.contact_email }}"><svg class="icon icon--sm" aria-hidden="true"><use href="#i-mail"/></svg>{{ section.settings.contact_email }}</a></li>{%- endif -%}
            <li><a class="with-icon" href="{{ section.settings.contact_page.url | default: '/pages/contact' }}">""")
footer = must_replace(footer, """            <li data-instagram hidden><a class="with-icon" href="#" data-instagram-link><svg class="icon icon--sm" aria-hidden="true"><use href="#i-instagram"/></svg>Instagram</a></li>""",
"""            {%- if settings.social_instagram_link != blank -%}<li><a class="with-icon" href="{{ settings.social_instagram_link }}" rel="noopener"><svg class="icon icon--sm" aria-hidden="true"><use href="#i-instagram"/></svg>Instagram</a></li>{%- endif -%}""")
policies_old = between(footer, """            <li><a href="https://meushotz.com.br/policies/privacy-policy">""", "\n          </ul>\n        </nav>", include_end=False)
footer = footer.replace(policies_old, """            {%- for policy in shop.policies -%}
            <li><a href="{{ policy.url }}">{{ policy.title | escape }}</a></li>
            {%- endfor -%}""")
footer = must_replace(footer, """            <li><p class="with-icon"><svg class="icon icon--sm" aria-hidden="true"><use href="#i-card"/></svg>Pagamento no checkout seguro da Shopify. As formas disponíveis aparecem na finalização.</p></li>""",
"""            <li><p class="with-icon"><svg class="icon icon--sm" aria-hidden="true"><use href="#i-card"/></svg>Pagamento no checkout seguro da Shopify.</p>
              {%- if shop.enabled_payment_types.size > 0 -%}
              <ul class="payment-icons" aria-label="Formas de pagamento">
                {%- for type in shop.enabled_payment_types -%}<li>{{ type | payment_type_svg_tag: class: 'payment-icon' }}</li>{%- endfor -%}
              </ul>
              {%- endif -%}
            </li>""")
footer = must_replace(footer, "Frete calculado pelo CEP. Grátis acima de R$ 129,90.", "{{ section.settings.shipping_note | escape }}")
footer = must_replace(footer, "<p>© 2026 SHOTZ. Todos os direitos reservados.</p>",
                      "<p>© {{ 'now' | date: '%Y' }} {{ shop.name | escape }}. Todos os direitos reservados.{% if section.settings.legal_info != blank %} {{ section.settings.legal_info | escape }}{% endif %}</p>")
footer_schema = """
{% schema %}
{
  "name": "SHOTZ · Rodapé",
  "settings": [
    { "type": "text", "id": "description", "label": "Descrição curta", "default": "Proteína em formato de shot. 23 g em 100 ml, pronta para beber." },
    { "type": "checkbox", "id": "show_newsletter", "label": "Mostrar cadastro de newsletter", "default": true },
    { "type": "text", "id": "contact_email", "label": "E-mail de contato", "default": "contato@meushotz.com.br" },
    { "type": "page", "id": "contact_page", "label": "Página de contato" },
    { "type": "text", "id": "shipping_note", "label": "Texto de entrega", "default": "Frete calculado pelo CEP. Grátis acima de R$ 129,90." },
    { "type": "textarea", "id": "legal_info", "label": "Dados legais (razão social, CNPJ, endereço)", "info": "Exigido pelo Decreto 7.962/2013 para lojas on-line no Brasil." }
  ]
}
{% endschema %}
"""
(OUT / "sections" / "shotz-footer.liquid").write_text(footer + "\n" + footer_schema, encoding="utf-8")

# ---------------------------------------------------------------- seção principal do produto
main = between(SRC, '<main id="conteudo">', "</main>")
main = main[len('<main id="conteudo">'):-len("</main>")]
overlays = between(SRC, "<!-- CTA fixo no mobile -->", '<p class="sr-only" aria-live="polite" data-announcer></p>')
body = main + "\n" + overlays

# Hero: foto real quando houver
hero_art = between(body, '        <div class="hero-art" role="img"', "\n        </div>\n      </div>\n\n      <div class=\"hero__buy\">", include_end=False) + "\n        </div>"
body = body.replace(hero_art, """{%- liquid
  assign hero = section.settings.hero_image
  assign hero_alt = hero.alt | default: 'Garrafas de SHOTZ com frutas tropicais, gelo e luz natural'
-%}
{%- if hero != blank -%}
        <div class="hero-art">
          {{ hero | image_url: width: 1400 | image_tag: widths: '480, 640, 800, 1000, 1200, 1400', sizes: '(min-width: 1024px) 48vw, 92vw', class: 'hero-art__photo', loading: 'eager', fetchpriority: 'high', alt: hero_alt }}
        </div>
{%- else -%}
""" + hero_art + "\n{%- endif -%}", 1)

# Momentos
for key, alt in (("work", "Pessoa no trabalho com SHOTZ"), ("gym", "Pessoa na academia com SHOTZ"),
                 ("travel", "Pessoa em viagem com SHOTZ"), ("daily", "SHOTZ na rotina do dia a dia")):
    m = re.search(rf'<div data-art="scene-{key}" role="img" aria-label="[^"]*"></div>', body)
    body = body.replace(m.group(0), img_or_art(f"moment_{key}_image", m.group(0), 900, "360, 540, 720, 900", "(min-width: 1024px) 24vw, 78vw", alt))

# Fotos da prévia (garrafas recortadas, frutas, flat-lays) viram assets do tema
body = re.sub(r'img/([\w-]+\.webp)', r"{{ 'shotz-\1' | asset_url }}", body)

# Formulário de produto nativo (funciona sem JavaScript; o script assume com a Ajax API)
body = must_replace(body, '<form class="buy-box" data-buy-box aria-labelledby="buy-title" novalidate>',
                    """{%- form 'product', product, class: 'buy-box', data-buy-box: '', novalidate: 'novalidate', aria-labelledby: 'buy-title' -%}
          <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}">
          <input type="hidden" name="selling_plan" value="" disabled>""")
body = must_replace(body, "        </form>\n      </div>\n    </div>\n  </section>\n\n  <!-- 7", "        {%- endform -%}\n      </div>\n    </div>\n  </section>\n\n  <!-- 7")

# Avaliações: espaço para o bloco do app de avaliações
body = must_replace(body, """      <ul class="reviews__track" data-reviews-track></ul>
    </div>""", """      <ul class="reviews__track" data-reviews-track></ul>
    </div>
    <div class="container reviews__app" data-reviews-app>{%- for block in section.blocks -%}{%- if block.type == '@app' -%}{% render block %}{%- endif -%}{%- endfor -%}</div>""")

# CTA final
final_art = between(body, '        <div class="final__art" aria-hidden="true">', "        </div>\n      </div>\n    </div>\n  </section>", include_end=False)
final_art_full = final_art + "        </div>"
body = body.replace(final_art_full, """{%- liquid
  assign final_img = section.settings.final_image
  assign final_alt = final_img.alt | default: 'Garrafas de SHOTZ'
-%}
{%- if final_img != blank -%}
        <div class="final__art final__art--photo">{{ final_img | image_url: width: 1200 | image_tag: widths: '480, 720, 960, 1200', sizes: '(min-width: 1024px) 45vw, 92vw', loading: 'lazy', alt: final_alt }}</div>
{%- else -%}
""" + final_art_full + "\n{%- endif -%}", 1)

# Tabela nutricional oficial
body = must_replace(body, '    <table class="nutri-table">', """    {%- if section.settings.nutrition_image != blank -%}
      {{ section.settings.nutrition_image | image_url: width: 1000 | image_tag: widths: '500, 750, 1000', sizes: '(min-width: 600px) 520px, 92vw', class: 'nutri-label', loading: 'lazy', alt: 'Tabela nutricional oficial do rótulo SHOTZ' }}
    {%- endif -%}
    <table class="nutri-table">""")
body = must_replace(body, "Valores declarados pelo fabricante na página do produto. Os itens marcados como “Ver rótulo” constam apenas na imagem oficial da tabela; na loja, essa imagem é exibida aqui.",
                    "{%- if section.settings.nutrition_image != blank -%}Acima, a tabela oficial do rótulo. Em caso de divergência, vale o rótulo do produto.{%- else -%}Valores declarados pelo fabricante. Os itens “Ver rótulo” constam na tabela impressa na embalagem.{%- endif -%}")
body = must_replace(body, 'href="https://meushotz.com.br/cart" data-checkout', 'href="{{ routes.cart_url }}" data-checkout')

config = r"""
{%- liquid
  assign plan = product.selling_plan_groups.first.selling_plans.first
  assign plan_pct = 0
  if plan and plan.price_adjustments.first.value_type == 'percentage'
    assign plan_pct = plan.price_adjustments.first.value
  endif
  assign notes_tropical = section.settings.tropical_notes | split: ','
  assign notes_cranberry = section.settings.cranberry_notes | split: ','
-%}
<script type="application/json" id="shotz-config">
{
  "mode": "shopify",
  "storeUrl": {{ request.origin | json }},
  "productUrl": {{ request.origin | append: product.url | json }},
  "productId": {{ product.id }},
  "currency": {{ cart.currency.iso_code | json }},
  "locale": {{ request.locale.iso_code | json }},
  "unitsPerBox": {{ section.settings.units_per_box | default: 6 }},
  "freeShippingThreshold": {{ section.settings.free_shipping_threshold | times: 100 | round }},
  "sellingPlan": {% if plan %}{ "id": {{ plan.id }}, "name": {{ plan.name | json }}, "percentage": {{ plan_pct }} }{% else %}null{% endif %},
  "flavors": {
    "tropical": { "name": "Frutas Tropicais", "thumb": {{ 'shotz-bottle-tropical-96.webp' | asset_url | json }}, "description": {{ section.settings.tropical_description | json }}, "notes": [{%- for n in notes_tropical -%}{{ n | strip | json }}{% unless forloop.last %},{% endunless %}{%- endfor -%}] },
    "cranberry": { "name": "Cranberry", "thumb": {{ 'shotz-bottle-cranberry-96.webp' | asset_url | json }}, "description": {{ section.settings.cranberry_description | json }}, "notes": [{%- for n in notes_cranberry -%}{{ n | strip | json }}{% unless forloop.last %},{% endunless %}{%- endfor -%}] }
  },
  "variants": [
    {%- assign sep = '' -%}
    {%- for v in product.variants -%}
      {%- assign opt = v.option1 | downcase -%}
      {%- assign fk = '' -%}
      {%- if opt contains 'tropic' -%}{%- assign fk = 'tropical' -%}{%- elsif opt contains 'cranberry' -%}{%- assign fk = 'cranberry' -%}{%- endif -%}
      {%- if fk == '' -%}{%- continue -%}{%- endif -%}
      {%- assign boxes = v.option2 | split: ' ' | first | plus: 0 -%}
      {%- assign sub_price = 'null' -%}
      {%- for a in v.selling_plan_allocations -%}{%- if plan and a.selling_plan.id == plan.id -%}{%- assign sub_price = a.price -%}{%- endif -%}{%- endfor -%}
      {{ sep }}{ "id": {{ v.id }}, "flavor": "{{ fk }}", "boxes": {{ boxes }}, "price": {{ v.price }}, "compareAt": {% if v.compare_at_price > v.price %}{{ v.compare_at_price }}{% else %}null{% endif %}, "subPrice": {{ sub_price }}, "available": {{ v.available }}, "sku": {{ v.sku | json }}, "image": {{ 'shotz-bottle-' | append: fk | append: '-96.webp' | asset_url | json }} }
      {%- assign sep = ',' -%}
    {%- endfor -%}
  ],
  "starterKit": {%- assign kit = null -%}{%- for v in product.variants -%}{%- assign opt = v.option1 | downcase -%}{%- if opt contains 'starter' -%}{%- assign kit = v -%}{%- endif -%}{%- endfor -%}
    {%- if kit -%}{ "id": {{ kit.id }}, "price": {{ kit.price }}, "compareAt": {{ kit.compare_at_price | default: 'null' }}, "available": {{ kit.available }} }{%- else -%}null{%- endif -%},
  "reviews": {
    "count": {{ product.metafields.reviews.rating_count.value | default: 0 }},
    "average": {% if product.metafields.reviews.rating.value != blank %}{{ product.metafields.reviews.rating.value.rating }}{% else %}null{% endif %},
    "items": {% if product.metafields.shotz.featured_reviews.value != blank %}{{ product.metafields.shotz.featured_reviews.value | json }}{% else %}[]{% endif %},
    "url": {% if section.settings.reviews_url != blank %}{{ section.settings.reviews_url | json }}{% else %}null{% endif %}
  },
  "instagramUrl": {% if settings.social_instagram_link != blank %}{{ settings.social_instagram_link | json }}{% else %}null{% endif %},
  "analytics": { "ga4Id": null, "metaPixelId": null },
  "defaults": { "flavor": "tropical", "boxes": 2, "plan": "once" },
  "routes": { "root": {{ routes.root_url | json }} }
}
</script>
"""

faq_ld = between(SRC, '<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "FAQPage"', "</script>")

product_schema = """
{% schema %}
{
  "name": "SHOTZ · Página de produto",
  "tag": "div",
  "class": "shotz-product",
  "settings": [
    { "type": "header", "content": "Fotografias" },
    { "type": "image_picker", "id": "hero_image", "label": "Hero", "info": "Produto com frutas tropicais, gelo e luz natural. Proporção quase quadrada. Sem foto, aparece a composição ilustrada." },
    { "type": "image_picker", "id": "moment_work_image", "label": "Momento: trabalho", "info": "Retrato 4:5" },
    { "type": "image_picker", "id": "moment_gym_image", "label": "Momento: academia", "info": "Retrato 4:5" },
    { "type": "image_picker", "id": "moment_travel_image", "label": "Momento: viagem", "info": "Retrato 4:5" },
    { "type": "image_picker", "id": "moment_daily_image", "label": "Momento: rotina", "info": "Retrato 4:5" },
    { "type": "image_picker", "id": "final_image", "label": "CTA final" },
    { "type": "image_picker", "id": "nutrition_image", "label": "Tabela nutricional oficial", "info": "Imagem do rótulo, exibida em “Tabela completa”." },
    { "type": "header", "content": "Regras comerciais" },
    { "type": "number", "id": "free_shipping_threshold", "label": "Frete grátis a partir de (R$)", "default": 129.9, "info": "Use o mesmo valor configurado em Configurações > Frete e entrega." },
    { "type": "number", "id": "units_per_box", "label": "Unidades por caixa", "default": 6 },
    { "type": "header", "content": "Sabores" },
    { "type": "textarea", "id": "tropical_description", "label": "Frutas Tropicais: descrição", "default": "Frutado, solar e refrescante, inspirado nas frutas amarelas tropicais. Textura leve, no estilo suco." },
    { "type": "text", "id": "tropical_notes", "label": "Frutas Tropicais: notas (separadas por vírgula)", "default": "Frutado, Refrescante, Textura leve" },
    { "type": "textarea", "id": "cranberry_description", "label": "Cranberry: descrição", "default": "Frutado e levemente ácido, com final refrescante. Textura leve, no estilo suco." },
    { "type": "text", "id": "cranberry_notes", "label": "Cranberry: notas (separadas por vírgula)", "default": "Levemente ácido, Refrescante, Textura leve" },
    { "type": "header", "content": "Avaliações" },
    { "type": "url", "id": "reviews_url", "label": "Link para todas as avaliações" },
    { "type": "paragraph", "content": "Adicione o bloco de carrossel do seu app de avaliações (Judge.me, Loox, Yotpo etc.) a esta seção. Nota média e total vêm dos metafields padrão reviews.rating e reviews.rating_count." }
  ],
  "blocks": [ { "type": "@app" } ]
}
{% endschema %}
"""
(OUT / "sections" / "shotz-product.liquid").write_text(
    "{%- comment -%} SHOTZ · landing de produto (hero → CTA final, compra, carrinho lateral, diálogos) {%- endcomment -%}\n"
    + body + "\n" + config + "\n" + faq_ld + "\n" + product_schema, encoding="utf-8")

# ---------------------------------------------------------------- snippets de SEO
(OUT / "snippets" / "shotz-meta-tags.liquid").write_text("""{%- liquid
  assign og_title = page_title | default: shop.name
  assign og_description = page_description | default: shop.description
  assign og_type = 'website'
  if request.page_type == 'product'
    assign og_type = 'product'
  endif
-%}
<meta property="og:site_name" content="{{ shop.name | escape }}">
<meta property="og:locale" content="pt_BR">
<meta property="og:url" content="{{ canonical_url }}">
<meta property="og:title" content="{{ og_title | escape }}">
<meta property="og:type" content="{{ og_type }}">
<meta property="og:description" content="{{ og_description | escape }}">
{%- if page_image -%}
<meta property="og:image" content="https:{{ page_image | image_url: width: 1200 }}">
<meta property="og:image:secure_url" content="https:{{ page_image | image_url: width: 1200 }}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="{{ 1200 | divided_by: page_image.aspect_ratio | round }}">
{%- endif -%}
{%- if request.page_type == 'product' -%}
<meta property="product:brand" content="{{ product.vendor | escape }}">
<meta property="product:price:amount" content="{{ product.price | money_without_currency | strip_html | escape }}">
<meta property="product:price:currency" content="{{ cart.currency.iso_code }}">
<meta property="product:availability" content="{% if product.available %}in stock{% else %}out of stock{% endif %}">
{%- endif -%}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{ og_title | escape }}">
<meta name="twitter:description" content="{{ og_description | escape }}">
""", encoding="utf-8")

(OUT / "snippets" / "shotz-structured-data.liquid").write_text("""{%- comment -%} Dados estruturados de produto: uma oferta por variante. Sem nota inventada: aggregateRating só aparece com dados do app de avaliações. {%- endcomment -%}
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": {{ product.title | json }},
  "brand": { "@type": "Brand", "name": {{ product.vendor | json }} },
  "description": {{ product.description | strip_html | strip_newlines | strip | truncate: 500 | json }},
  "url": {{ request.origin | append: product.url | json }},
  "productID": {{ product.id | json }},
  "image": [
    {%- assign sep = '' -%}
    {%- for media in product.media limit: 6 -%}{%- if media.media_type == 'image' -%}{{ sep }}{{ media | image_url: width: 1200 | prepend: 'https:' | json }}{%- assign sep = ',' -%}{%- endif -%}{%- endfor -%}
  ],
  {%- if product.metafields.reviews.rating.value != blank and product.metafields.reviews.rating_count.value > 0 -%}
  "aggregateRating": { "@type": "AggregateRating", "ratingValue": {{ product.metafields.reviews.rating.value.rating | json }}, "bestRating": {{ product.metafields.reviews.rating.value.scale_max | json }}, "reviewCount": {{ product.metafields.reviews.rating_count.value | json }} },
  {%- endif -%}
  "offers": [
    {%- for v in product.variants -%}
    { "@type": "Offer", "sku": {{ v.sku | json }}, "name": {{ v.title | json }}, "price": {{ v.price | divided_by: 100.0 | json }}, "priceCurrency": {{ cart.currency.iso_code | json }}, "availability": "https://schema.org/{% if v.available %}InStock{% else %}OutOfStock{% endif %}", "url": {{ request.origin | append: v.url | json }} }{% unless forloop.last %},{% endunless %}
    {%- endfor -%}
  ]
}
</script>
""", encoding="utf-8")

# ---------------------------------------------------------------- layout próprio
fonts = re.search(r'<link rel="stylesheet" href="(https://fonts\.googleapis\.com/css2[^"]+)">', SRC).group(1)
consent = between(SRC, "<script>\n  window.dataLayer = window.dataLayer || [];", "</script>")
(OUT / "layout" / "shotz.liquid").write_text(f"""<!doctype html>
<html lang="{{{{ request.locale.iso_code }}}}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#FAF9F5">
  <link rel="canonical" href="{{{{ canonical_url }}}}">
  <title>{{{{ page_title }}}}{{%- unless page_title contains shop.name %}} | {{{{ shop.name }}}}{{%- endunless -%}}</title>
  {{%- if page_description -%}}<meta name="description" content="{{{{ page_description | escape }}}}">{{%- endif -%}}
  {{%- if settings.favicon != blank -%}}<link rel="icon" type="image/png" href="{{{{ settings.favicon | image_url: width: 64, height: 64 }}}}">{{%- endif -%}}
  {{% render 'shotz-meta-tags' %}}

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="{fonts}">
  {{{{ 'shotz.css' | asset_url | stylesheet_tag }}}}

  {consent}
  {{%- if request.page_type == 'product' -%}}{{% render 'shotz-structured-data', product: product %}}{{%- endif -%}}

  {{{{ content_for_header }}}}
</head>
<body>
  <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
  {{% render 'shotz-icons' %}}
  {{% section 'shotz-header' %}}
  <main id="conteudo">
    {{{{ content_for_layout }}}}
  </main>
  {{% section 'shotz-footer' %}}
  <script src="{{{{ 'shotz.js' | asset_url }}}}" defer></script>
</body>
</html>
""", encoding="utf-8")

# Versão "lata": mesmo layout com data-look="lata" e as fontes da embalagem
lata_layout = (OUT / "layout" / "shotz.liquid").read_text(encoding="utf-8")
lata_layout = lata_layout.replace('<html lang="{{ request.locale.iso_code }}">', '<html lang="{{ request.locale.iso_code }}" data-look="lata">', 1)
lata_layout = lata_layout.replace(fonts, "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@75..100,500..900&family=JetBrains+Mono:wght@500;700&family=Hanken+Grotesk:wght@400;500;600;700&display=swap", 1)
assert 'data-look="lata"' in lata_layout
(OUT / "layout" / "shotz-lata.liquid").write_text(lata_layout, encoding="utf-8")
(OUT / "templates" / "product.shotz-lata.json").write_text("""{
  "layout": "shotz-lata",
  "sections": {
    "main": { "type": "shotz-product", "settings": {} }
  },
  "order": ["main"]
}
""", encoding="utf-8")

(OUT / "templates" / "product.shotz.json").write_text("""{
  "layout": "shotz",
  "sections": {
    "main": { "type": "shotz-product", "settings": {} }
  },
  "order": ["main"]
}
""", encoding="utf-8")

shutil.copy(ROOT / "public" / "shotz.css", OUT / "assets" / "shotz.css")
shutil.copy(ROOT / "public" / "shotz.js", OUT / "assets" / "shotz.js")
for img in sorted((ROOT / "src" / "img").glob("*.webp")):
    shutil.copy(img, OUT / "assets" / f"shotz-{img.name}")
print("✔ tema Shopify gerado em shopify/theme:", sorted(str(p.relative_to(OUT)) for p in OUT.rglob("*") if p.is_file()))
