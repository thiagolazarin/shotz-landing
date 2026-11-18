/* SHOTZ · gerado de src/shotz.ts */
(() => {
"use strict";
/* =========================================================================
   SHOTZ · comportamento da landing de produto
   - Lê a configuração comercial de <script id="shotz-config">.
   - Dois modos de carrinho com a mesma interface:
       "preview": carrinho local + checkout real via link permanente da Shopify
       "shopify": Ajax Cart API do tema (/cart/add.js, /cart/change.js, /cart.js)
   - Sem dependências. Compilado de TypeScript para shotz.js.
   ========================================================================= */
/* ---------- utilidades ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;
function readConfig() {
    const el = document.getElementById('shotz-config');
    if (!el || !el.textContent)
        throw new Error('SHOTZ: configuração não encontrada');
    return JSON.parse(el.textContent);
}
const CFG = readConfig();
const money = new Intl.NumberFormat(CFG.locale || 'pt-BR', { style: 'currency', currency: CFG.currency || 'BRL' });
const fmt = (cents) => money.format(cents / 100);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const boxesLabel = (n) => plural(n, 'caixa', 'caixas');
const shotsLabel = (n) => plural(n * CFG.unitsPerBox, 'shot', 'shots');
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function store(key, value) {
    try {
        if (value === undefined) {
            const raw = window.localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        }
        window.localStorage.setItem(key, JSON.stringify(value));
        return value;
    }
    catch {
        return null;
    }
}
const announcer = $('[data-announcer]');
function announce(msg) {
    if (!announcer)
        return;
    announcer.textContent = '';
    window.setTimeout(() => { announcer.textContent = msg; }, 60);
}
function variantFor(flavor, boxes) {
    return CFG.variants.find((v) => v.flavor === flavor && v.boxes === boxes);
}
const priceFor = (v, plan) => (plan === 'sub' && v.subPrice != null ? v.subPrice : v.price);
const referenceFor = (v) => v.compareAt ?? v.price;
/* =========================================================================
   Arte vetorial da prévia (garrafas, frutas, gelo, cenas)
   Na versão Shopify, fotografias reais substituem estes elementos.
   ========================================================================= */
const ART_COLORS = {
    tropical: { cap: '#F6D11E', capDark: '#C9A400', band: '#F6D11E', text: '#D9AE00', label: 'FRUTAS TROPICAIS' },
    cranberry: { cap: '#E6343F', capDark: '#AE1E2A', band: '#E6343F', text: '#D52A37', label: 'CRANBERRY' },
};
let uid = 0;
/* Desenho simplificado da garrafa real (alumínio prata, tampa e faixas na cor do sabor).
   Usado nas cenas ilustradas e como reserva quando não há foto. */
function bottleSVG(flavor, attrs = '') {
    const c = ART_COLORS[flavor];
    const u = `sz${++uid}`;
    const body = 'M30 62H90C101 66 110 77 110 96V282Q110 294 98 294H22Q10 294 10 282V96C10 77 19 66 30 62Z';
    const words = flavor === 'tropical' ? ['FRUTAS', 'TROPICAIS'] : ['CRANBERRY'];
    const flavorText = words.map((w, i) => `<text x="57" y="${222 + i * 8}" text-anchor="middle" font-size="7.4" font-weight="800" fill="${c.text}">${w}</text>`).join('');
    const shift = (words.length - 1) * 8;
    return `<svg ${attrs} viewBox="0 0 120 300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" font-family="Hanken Grotesk, Arial, sans-serif">
<defs>
<linearGradient id="${u}m" x1="0" x2="1"><stop offset="0" stop-color="#A3A8AD"/><stop offset=".16" stop-color="#E9EBED"/><stop offset=".38" stop-color="#C9CDD1"/><stop offset=".56" stop-color="#F8F9FA"/><stop offset=".8" stop-color="#D3D6D9"/><stop offset="1" stop-color="#999EA3"/></linearGradient>
<linearGradient id="${u}c" x1="0" x2="1"><stop offset="0" stop-color="${c.capDark}"/><stop offset=".35" stop-color="${c.cap}"/><stop offset=".6" stop-color="${c.cap}"/><stop offset="1" stop-color="${c.capDark}"/></linearGradient>
<clipPath id="${u}k"><path d="${body}"/></clipPath>
</defs>
<path d="${body}" fill="url(#${u}m)"/>
<g clip-path="url(#${u}k)">
<path d="M10 104 30 94V172L10 186Z" fill="${c.band}"/>
<path d="M10 236 30 222V294H10Z" fill="${c.band}"/>
<path d="M86 118 110 106V178L86 190Z" fill="${c.band}"/>
<path d="M86 294 110 268V294Z" fill="${c.band}"/>
<rect x="0" y="0" width="16" height="300" fill="#fff" opacity=".18"/>
</g>
<text transform="translate(40 104) rotate(90)" font-size="30" font-weight="800" letter-spacing="-.6" fill="#141414">SHOTZ</text>
<text x="57" y="${212}" text-anchor="middle" font-size="5.6" font-weight="700" fill="#141414">SABOR</text>
${flavorText}
<text x="57" y="${254 + shift}" text-anchor="middle" font-size="25" font-weight="800" letter-spacing="-.8" fill="#141414">23g</text>
<text x="57" y="${264 + shift}" text-anchor="middle" font-size="7" font-weight="800" fill="#141414">PROTEÍNA</text>
<g font-size="4.6" font-weight="800" fill="${c.text}" text-anchor="middle"><text x="98" y="204">ZERO</text><text x="98" y="218">0,8g</text><text x="98" y="232">ZERO</text><text x="98" y="246">ZERO</text></g>
<rect x="30" y="56" width="60" height="7" rx="1.5" fill="#BFC3C7"/>
<rect x="28" y="4" width="64" height="54" rx="9" fill="url(#${u}c)"/>
<ellipse cx="60" cy="8" rx="28" ry="3" fill="#fff" opacity=".22"/>
</svg>`;
}
function sceneSVG(kind) {
    const open = '<svg class="scene" viewBox="0 0 400 500" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">';
    const bottleAt = (flavor, x, y, w = 58) => bottleSVG(flavor, `x="${x}" y="${y}" width="${w}" height="${w * 2.5}"`);
    const shadow = (cx, cy, rx) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="7" fill="#2C4134" opacity=".12"/>`;
    switch (kind) {
        case 'work':
            return `${open}
<rect x="214" y="44" width="150" height="230" rx="75" fill="#FAF9F5" opacity=".6"/>
<path d="M289 44v230M214 160h150" stroke="#A9B79C" stroke-width="4" opacity=".55"/>
<path d="M330 300c-8-40 6-70 26-86-4 34-10 60-26 86Z" fill="#7F9474"/><path d="M336 302c14-30 36-44 52-46-12 24-30 40-52 46Z" fill="#A9B79C"/>
<rect x="318" y="296" width="44" height="80" rx="8" fill="#E99B62"/>
<rect x="0" y="374" width="400" height="126" fill="#D9C7A4"/><rect x="0" y="374" width="400" height="8" fill="#E8DABC"/>
<path d="M38 254h170a8 8 0 0 1 8 8v108H30V262a8 8 0 0 1 8-8Z" fill="#2C4134"/>
<rect x="38" y="262" width="170" height="102" rx="4" fill="#E3E8DA"/>
<rect x="52" y="278" width="64" height="9" rx="4.5" fill="#A9B79C"/><rect x="52" y="296" width="132" height="6" rx="3" fill="#fff"/><rect x="52" y="310" width="110" height="6" rx="3" fill="#fff"/><rect x="52" y="330" width="44" height="22" rx="6" fill="#F4D75E"/>
<path d="M18 370h210l12 10H6Z" fill="#405A48"/>
${shadow(268, 376, 34)}${bottleAt('tropical', 240, 228)}
<rect x="300" y="322" width="0" height="0"/>
<path d="M24 398l96-6 2 14-96 6Z" fill="#F4D75E"/>
</svg>`;
        case 'gym':
            return `${open}
<circle cx="292" cy="150" r="96" fill="#F4D75E" opacity=".55"/>
<rect x="0" y="392" width="400" height="108" fill="#E8DAAA"/><rect x="0" y="392" width="400" height="6" fill="#F0E4BC"/>
<rect x="20" y="326" width="176" height="66" rx="33" fill="#A9B79C"/>
<circle cx="53" cy="359" r="33" fill="#BDC9B1"/>
<path d="M53 359m-20 0a20 20 0 1 0 40 0a13 13 0 1 0-26 0a6 6 0 1 0 12 0" stroke="#7F9474" stroke-width="3" fill="none"/>
<rect x="132" y="324" width="12" height="70" rx="3" fill="#405A48"/>
<rect x="44" y="300" width="120" height="28" rx="8" fill="#FAF9F5"/><rect x="44" y="309" width="120" height="5" fill="#E99B62"/>
${shadow(236, 394, 32)}${bottleAt('cranberry', 208, 246)}
<rect x="294" y="377" width="62" height="9" rx="4.5" fill="#405A48"/>
<rect x="276" y="360" width="24" height="42" rx="8" fill="#2C4134"/><rect x="350" y="360" width="24" height="42" rx="8" fill="#2C4134"/>
</svg>`;
        case 'travel':
            return `${open}
<path d="M30 150C110 70 220 66 312 112" stroke="#E99B62" stroke-width="3.5" stroke-dasharray="1 11" stroke-linecap="round" fill="none"/>
<g transform="translate(306 82) rotate(22) scale(1.9)" fill="none" stroke="#405A48" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></g>
<rect x="0" y="410" width="400" height="90" fill="#EFC6A6"/><rect x="0" y="410" width="400" height="6" fill="#F5D6BE"/>
<path d="M104 232v-30a10 10 0 0 1 10-10h40a10 10 0 0 1 10 10v30" stroke="#2C4134" stroke-width="11" fill="none"/>
<rect x="52" y="228" width="164" height="186" rx="24" fill="#405A48"/>
<path d="M96 240v164M134 240v164M172 240v164" stroke="#2C4134" stroke-width="5" opacity=".55"/>
<circle cx="80" cy="270" r="15" fill="#F4D75E"/><circle cx="80" cy="270" r="6" fill="#E99B62"/>
<circle cx="82" cy="420" r="9" fill="#2C4134"/><circle cx="186" cy="420" r="9" fill="#2C4134"/>
${shadow(262, 412, 32)}${bottleAt('tropical', 234, 266)}
<g transform="rotate(-9 340 428)"><rect x="300" y="408" width="84" height="42" rx="6" fill="#FAF9F5"/><path d="M314 422h30M314 432h50M370 412v34" stroke="#A9B79C" stroke-width="3" stroke-linecap="round" stroke-dasharray="0" /></g>
<g fill="#2C4134" opacity=".9"><circle cx="318" cy="472" r="15"/><circle cx="356" cy="472" r="15"/></g><path d="M333 470q4-5 8 0" stroke="#2C4134" stroke-width="3" fill="none"/>
</svg>`;
        default:
            return `${open}
<rect x="210" y="40" width="160" height="210" rx="14" fill="#FBF6E7"/>
<circle cx="292" cy="134" r="58" fill="#F4D75E" opacity=".85"/>
<path d="M210 145h160M290 40v210" stroke="#E8DFCB" stroke-width="8"/>
<rect x="210" y="40" width="160" height="210" rx="14" fill="none" stroke="#E8DFCB" stroke-width="8"/>
<path d="M214 250 150 380h170l50-130Z" fill="#fff" opacity=".28"/>
<rect x="0" y="380" width="400" height="120" fill="#D9CDB3"/><rect x="0" y="380" width="400" height="7" fill="#E7DDC7"/>
<circle cx="70" cy="336" r="27" fill="#EC954A"/><circle cx="118" cy="326" r="29" fill="#F4D75E"/><circle cx="160" cy="340" r="23" fill="#E99B62"/>
<path d="M112 300c6-14 18-20 30-18-8 10-18 16-30 18Z" fill="#6E9468"/>
<path d="M34 340h168c0 26-30 42-84 42S34 366 34 340Z" fill="#FAF9F5"/>
${shadow(240, 382, 32)}${bottleAt('cranberry', 212, 238)}
<path d="M302 304l64 0 10 78h-84Z" fill="#A9B79C"/><path d="M318 306c0-28 32-28 32 0" stroke="#7F9474" stroke-width="5" fill="none"/>
</svg>`;
    }
}
function renderArt(root = document) {
    $$('[data-art]', root).forEach((el) => {
        if (el.dataset.artDone)
            return;
        const kind = el.dataset.art || '';
        let svg = '';
        if (kind === 'bottle-tropical')
            svg = bottleSVG('tropical');
        else if (kind === 'bottle-cranberry')
            svg = bottleSVG('cranberry');
        else if (kind.startsWith('scene-'))
            svg = sceneSVG(kind.slice(6));
        if (svg) {
            el.insertAdjacentHTML('afterbegin', svg);
            el.dataset.artDone = '1';
        }
    });
}
const productThumb = (flavor, image) => image ? `<img src="${esc(image)}" alt="" loading="lazy" decoding="async">` : bottleSVG(flavor || 'tropical');
const flavorThumb = (flavor) => productThumb(flavor, CFG.flavors[flavor].thumb || null);
/* =========================================================================
   Analytics com consentimento (GA4 + Meta Pixel + eventos da Shopify)
   ========================================================================= */
const Analytics = {
    granted: false,
    loaded: false,
    init() {
        window.dataLayer = window.dataLayer || [];
        const saved = store('shotz-consent');
        if (CFG.mode === 'shopify') {
            /* Na loja, o consentimento vem do banner nativo da Shopify (Customer Privacy API) */
            const read = () => this.apply(!!window.Shopify?.customerPrivacy?.analyticsProcessingAllowed?.(), false);
            document.addEventListener('visitorConsentCollected', read);
            if (window.Shopify?.loadFeatures)
                window.Shopify.loadFeatures([{ name: 'consent-tracking-api', version: '0.1' }], () => read());
            else
                read();
            return;
        }
        else {
            this.granted = saved === 'granted';
        }
        this.apply(this.granted, false);
    },
    apply(granted, persist = true) {
        this.granted = granted;
        if (persist && CFG.mode !== 'shopify')
            store('shotz-consent', granted ? 'granted' : 'denied');
        const state = granted ? 'granted' : 'denied';
        window.gtag?.('consent', 'update', { analytics_storage: state, ad_storage: state, ad_user_data: state, ad_personalization: state });
        const status = $('[data-consent-status]');
        if (status)
            status.textContent = granted ? 'autorizado' : 'não autorizado';
        if (granted)
            this.loadTags();
    },
    loadTags() {
        if (this.loaded)
            return;
        this.loaded = true;
        const ga = CFG.analytics?.ga4Id;
        if (ga) {
            const s = document.createElement('script');
            s.async = true;
            s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga)}`;
            document.head.appendChild(s);
            window.gtag?.('js', new Date());
            window.gtag?.('config', ga);
        }
        const px = CFG.analytics?.metaPixelId;
        if (px && !window.fbq) {
            /* Snippet oficial do Meta Pixel, carregado apenas após consentimento */
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const n = function (...args) { if (n.callMethod)
                n.callMethod(...args);
            else
                n.queue.push(args); };
            n.push = n;
            n.loaded = true;
            n.version = '2.0';
            n.queue = [];
            window.fbq = n;
            const s = document.createElement('script');
            s.async = true;
            s.src = 'https://connect.facebook.net/en_US/fbevents.js';
            document.head.appendChild(s);
            window.fbq?.('init', px);
            window.fbq?.('track', 'PageView');
        }
    },
    item(v, plan, quantity = 1) {
        return {
            item_id: v.sku || String(v.id),
            item_name: 'SHOTZ',
            item_brand: 'SHOTZ',
            item_variant: `${CFG.flavors[v.flavor].name} / ${boxesLabel(v.boxes)}${plan === 'sub' ? ' / assinatura' : ''}`,
            price: priceFor(v, plan) / 100,
            quantity,
        };
    },
    track(event, payload) {
        const ecommerce = { currency: CFG.currency, value: payload.value, items: payload.items };
        window.dataLayer.push({ ecommerce: null });
        window.dataLayer.push({ event, ecommerce });
        try {
            window.Shopify?.analytics?.publish?.(`shotz_${event}`, ecommerce);
        }
        catch { /* sem pixel customizado */ }
        if (!this.granted || !window.fbq)
            return;
        const map = { view_item: 'ViewContent', add_to_cart: 'AddToCart', begin_checkout: 'InitiateCheckout' };
        if (map[event])
            window.fbq('track', map[event], { value: payload.value, currency: CFG.currency, content_type: 'product' });
    },
};
/* =========================================================================
   Carrinho: adaptador da prévia (local + link permanente) e da Shopify (Ajax API)
   ========================================================================= */
function lineFromVariant(v, sellingPlanId, quantity, key) {
    const sub = sellingPlanId != null;
    return {
        key,
        variantId: v.id,
        sellingPlanId,
        quantity,
        unitPrice: priceFor(v, sub ? 'sub' : 'once'),
        unitCompare: referenceFor(v),
        flavor: v.flavor,
        boxes: v.boxes,
        title: `SHOTZ ${CFG.flavors[v.flavor].name}`,
        subtitle: `${boxesLabel(v.boxes)} · ${shotsLabel(v.boxes)}`,
        image: v.image || null,
    };
}
function summarize(lines) {
    return {
        lines,
        subtotal: lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
        compareSubtotal: lines.reduce((s, l) => s + Math.max(l.unitCompare, l.unitPrice) * l.quantity, 0),
        count: lines.reduce((s, l) => s + l.quantity, 0),
    };
}
class PreviewCart {
    constructor() {
        this.key = 'shotz-preview-cart-v1';
        this.items = [];
        const saved = store(this.key);
        if (Array.isArray(saved))
            this.items = saved.filter((i) => CFG.variants.some((v) => v.id === i.variantId));
    }
    state() {
        const lines = this.items
            .map((i) => {
            const v = CFG.variants.find((x) => x.id === i.variantId);
            return v ? lineFromVariant(v, i.sellingPlanId, i.quantity, `${i.variantId}:${i.sellingPlanId ?? 0}`) : null;
        })
            .filter((l) => l !== null);
        return summarize(lines);
    }
    save() { store(this.key, this.items); }
    async load() { return this.state(); }
    async add(v, plan, quantity) {
        const sp = plan === 'sub' && CFG.sellingPlan && v.subPrice != null ? CFG.sellingPlan.id : null;
        const found = this.items.find((i) => i.variantId === v.id && i.sellingPlanId === sp);
        if (found)
            found.quantity = Math.min(found.quantity + quantity, 10);
        else
            this.items.push({ variantId: v.id, sellingPlanId: sp, quantity });
        this.save();
        await new Promise((r) => window.setTimeout(r, reduceMotion ? 0 : 420));
        return this.state();
    }
    async setQuantity(key, quantity) {
        const [id, sp] = key.split(':').map(Number);
        const idx = this.items.findIndex((i) => i.variantId === id && (i.sellingPlanId ?? 0) === sp);
        if (idx > -1) {
            if (quantity <= 0)
                this.items.splice(idx, 1);
            else
                this.items[idx].quantity = Math.min(quantity, 10);
        }
        this.save();
        return this.state();
    }
    checkoutUrl(state) {
        const base = CFG.storeUrl.replace(/\/$/, '');
        if (!state.lines.length)
            return `${base}/cart`;
        if (!state.lines.some((l) => l.sellingPlanId)) {
            /* Link permanente oficial: cria o checkout com as variantes e quantidades */
            return `${base}/cart/${state.lines.map((l) => `${l.variantId}:${l.quantity}`).join(',')}`;
        }
        /* Com assinatura: limpa o carrinho da loja, adiciona os itens com selling_plan e segue ao checkout */
        const add = state.lines
            .map((l) => `items[][id]=${l.variantId}&items[][quantity]=${l.quantity}${l.sellingPlanId ? `&items[][selling_plan]=${l.sellingPlanId}` : ''}`)
            .join('&');
        return `${base}/cart/clear?return_to=${encodeURIComponent(`/cart/add?${add}&return_to=/checkout`)}`;
    }
}
class ShopifyCart {
    constructor() {
        this.root = (window.Shopify?.routes?.root || CFG.routes?.root || '/').replace(/\/?$/, '/');
    }
    async request(path, body) {
        const res = await fetch(`${this.root}${path}`, {
            method: body ? 'POST' : 'GET',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: body ? JSON.stringify(body) : undefined,
            credentials: 'same-origin',
        });
        const data = await res.json();
        if (!res.ok)
            throw new Error((data && (data.description || data.message)) || 'Não foi possível atualizar o carrinho.');
        return data;
    }
    map(cart) {
        const lines = cart.items.map((item) => {
            const v = CFG.variants.find((x) => x.id === item.variant_id);
            const sp = item.selling_plan_allocation?.selling_plan.id ?? null;
            if (v) {
                const line = lineFromVariant(v, sp, item.quantity, item.key);
                line.unitPrice = item.final_price;
                line.image = v.image || item.image;
                return line;
            }
            return {
                key: item.key, variantId: item.variant_id, sellingPlanId: sp, quantity: item.quantity,
                unitPrice: item.final_price, unitCompare: item.original_price, flavor: null, boxes: null,
                title: item.product_title, subtitle: item.variant_title || '', image: item.image,
            };
        });
        const state = summarize(lines);
        state.subtotal = cart.total_price;
        state.count = cart.item_count;
        return state;
    }
    async load() { return this.map(await this.request('cart.js')); }
    async add(v, plan, quantity) {
        const item = { id: v.id, quantity };
        if (plan === 'sub' && CFG.sellingPlan && v.subPrice != null)
            item.selling_plan = CFG.sellingPlan.id;
        await this.request('cart/add.js', { items: [item] });
        return this.load();
    }
    async setQuantity(key, quantity) {
        return this.map(await this.request('cart/change.js', { id: key, quantity }));
    }
    checkoutUrl() { return `${this.root}checkout`; }
}
const cart = CFG.mode === 'shopify' ? new ShopifyCart() : new PreviewCart();
let cartState = { lines: [], subtotal: 0, compareSubtotal: 0, count: 0 };
/* =========================================================================
   Seleção de compra (sabor, quantidade, assinatura)
   ========================================================================= */
const selection = { flavor: CFG.defaults.flavor, boxes: CFG.defaults.boxes, plan: CFG.defaults.plan };
(function presetFromUrl() {
    const id = Number(new URLSearchParams(window.location.search).get('variant'));
    const v = CFG.variants.find((x) => x.id === id);
    if (v) {
        selection.flavor = v.flavor;
        selection.boxes = v.boxes;
    }
})();
const buyBox = $('[data-buy-box]');
const bind = (name) => $$(`[data-bind="${name}"]`);
const sum = (name) => $(`[data-sum="${name}"]`);
function currentVariant() {
    return variantFor(selection.flavor, selection.boxes) || CFG.variants.find((v) => v.flavor === selection.flavor) || CFG.variants[0];
}
function renderQuantity() {
    const wrap = $('[data-qty-options]');
    if (!wrap)
        return;
    const options = CFG.variants.filter((v) => v.flavor === selection.flavor).sort((a, b) => a.boxes - b.boxes);
    const unit = (v) => priceFor(v, selection.plan) / (v.boxes * CFG.unitsPerBox);
    const avail = options.filter((v) => v.available);
    const best = avail.length > 1 ? Math.min(...avail.map(unit)) : -1;
    const bestCount = avail.filter((v) => Math.abs(unit(v) - best) < 0.5).length;
    wrap.innerHTML = options.map((v) => {
        const now = priceFor(v, selection.plan);
        const ref = referenceFor(v);
        const badges = [];
        if (v.compareAt && v.compareAt > v.price)
            badges.push(`<span class="badge badge--citrus">−${Math.round(((v.compareAt - v.price) / v.compareAt) * 100)}%</span>`);
        if (now >= CFG.freeShippingThreshold)
            badges.push('<span class="badge">Frete grátis</span>');
        if (v.available && bestCount === 1 && Math.abs(unit(v) - best) < 0.5)
            badges.push('<span class="badge badge--orange">Menor preço por shot</span>');
        if (!v.available)
            badges.push('<span class="badge badge--outline">Esgotado</span>');
        return `<label class="choice qty-opt">
  <input type="radio" name="boxes" value="${v.boxes}" ${v.boxes === selection.boxes ? 'checked' : ''} ${v.available ? '' : 'disabled'}>
  <span class="choice__card">
    <span class="qty-opt__main"><span class="qty-opt__title">${boxesLabel(v.boxes)}</span><span class="qty-opt__sub">${shotsLabel(v.boxes)}</span></span>
    <span class="qty-opt__badges">${badges.join('')}</span>
    <span class="qty-opt__price"><span class="qty-opt__now">${fmt(now)}</span>${ref > now ? `<s class="qty-opt__compare"><span class="sr-only">de </span>${fmt(ref)}</s>` : ''}<span class="qty-opt__unit">${fmt(unit(v))}/shot</span></span>
  </span>
</label>`;
    }).join('');
}
function renderSelection() {
    const v = currentVariant();
    selection.boxes = v.boxes;
    const flavor = CFG.flavors[v.flavor];
    const total = priceFor(v, selection.plan);
    const ref = referenceFor(v);
    const save = Math.max(ref - total, 0);
    const units = v.boxes * CFG.unitsPerBox;
    bind('flavor-name').forEach((el) => { el.textContent = flavor.name; });
    bind('flavor-desc').forEach((el) => { el.textContent = flavor.description; });
    bind('flavor-notes').forEach((el) => { el.innerHTML = flavor.notes.map((n) => `<li>${esc(n)}</li>`).join(''); });
    const one = variantFor(v.flavor, 1);
    bind('flavor-from').forEach((el) => { el.textContent = one ? fmt(one.price) : fmt(v.price); });
    const stage = $('[data-flavor-stage]');
    if (stage)
        stage.dataset.flavor = v.flavor;
    $$('[data-flavor-switch]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.flavorSwitch === v.flavor)));
    $$('input[name="flavor"]').forEach((i) => { i.checked = i.value === v.flavor; });
    /* Plano */
    const planGroup = $('[data-plan-group]');
    const hasSub = !!CFG.sellingPlan && v.subPrice != null;
    if (planGroup)
        planGroup.hidden = !CFG.sellingPlan;
    const subInput = $('input[name="plan"][value="sub"]');
    if (subInput)
        subInput.disabled = !hasSub;
    if (!hasSub && selection.plan === 'sub')
        selection.plan = 'once';
    $$('input[name="plan"]').forEach((i) => { i.checked = i.value === selection.plan; });
    const once = $('[data-plan-price="once"]');
    if (once)
        once.innerHTML = `${v.compareAt && v.compareAt > v.price ? `<s>${fmt(v.compareAt)}</s>` : ''}${fmt(v.price)}`;
    const sub = $('[data-plan-price="sub"]');
    if (sub && v.subPrice != null)
        sub.innerHTML = `<s>${fmt(ref)}</s>${fmt(v.subPrice)}`;
    if (CFG.sellingPlan)
        bind('sub-badge').forEach((el) => { el.textContent = `${CFG.sellingPlan?.percentage}% OFF`; });
    /* Resumo */
    const compareEl = sum('compare');
    if (compareEl) {
        compareEl.textContent = save > 0 ? fmt(ref) : '';
        compareEl.hidden = save <= 0;
    }
    const totalEl = sum('total');
    if (totalEl)
        totalEl.textContent = fmt(total);
    const unitEl = sum('unit');
    if (unitEl)
        unitEl.textContent = fmt(total / units);
    const saveEl = sum('save');
    if (saveEl)
        saveEl.textContent = save > 0 ? `${fmt(save)} (${Math.floor((save / ref) * 100)}%)` : 'Sem desconto nesta opção';
    const parts = [];
    if (v.compareAt && v.compareAt > v.price)
        parts.push(`${Math.round(((v.compareAt - v.price) / v.compareAt) * 100)}% no kit com ${boxesLabel(v.boxes)}`);
    if (selection.plan === 'sub' && CFG.sellingPlan)
        parts.push(`${CFG.sellingPlan.percentage}% da assinatura mensal`);
    const detail = sum('detail');
    if (detail) {
        detail.textContent = parts.length ? `Desconto: ${parts.join(' + ')}.` : '';
        detail.hidden = !parts.length;
    }
    const ship = sum('ship');
    if (ship) {
        ship.innerHTML = total >= CFG.freeShippingThreshold
            ? '<span class="summary__ship-free"><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg>Grátis</span>'
            : `Calculado no checkout · faltam ${fmt(CFG.freeShippingThreshold - total)} para frete grátis`;
    }
    const btnPrice = sum('btn-price');
    if (btnPrice)
        btnPrice.textContent = fmt(total);
    /* Campos nativos do formulário da Shopify (funcionam mesmo sem JavaScript) */
    const idInput = $('input[name="id"]', buyBox || document);
    if (idInput)
        idInput.value = String(v.id);
    const spInput = $('input[name="selling_plan"]', buyBox || document);
    if (spInput) {
        spInput.value = selection.plan === 'sub' && CFG.sellingPlan ? String(CFG.sellingPlan.id) : '';
        spInput.disabled = selection.plan !== 'sub';
    }
    const addBtn = $('[data-add-btn]');
    if (addBtn)
        addBtn.disabled = !v.available;
    /* CTA fixo */
    bind('sticky-title').forEach((el) => { el.textContent = `${flavor.name} · ${boxesLabel(v.boxes)}${selection.plan === 'sub' ? ' · Assinatura' : ''}`; });
    bind('sticky-price').forEach((el) => { el.textContent = fmt(total); });
    bind('sticky-thumb').forEach((el) => { el.innerHTML = flavorThumb(v.flavor); });
    /* Kit esgotado / disponível */
    const kit = CFG.starterKit;
    bind('kit-note').forEach((el) => {
        el.hidden = !kit;
        if (kit)
            el.textContent = kit.available
                ? `Starter Kit (2 Cranberry + 2 Frutas Tropicais) disponível por ${fmt(kit.price)}.`
                : 'Starter Kit (2 Cranberry + 2 Frutas Tropicais): esgotado no momento.';
    });
}
function setFlavor(flavor) {
    if (selection.flavor === flavor)
        return;
    selection.flavor = flavor;
    if (!variantFor(flavor, selection.boxes)?.available) {
        const first = CFG.variants.find((v) => v.flavor === flavor && v.available);
        if (first)
            selection.boxes = first.boxes;
    }
    renderQuantity();
    renderSelection();
}
function initBuyBox() {
    if (!buyBox)
        return;
    renderQuantity();
    renderSelection();
    buyBox.addEventListener('change', (e) => {
        const t = e.target;
        if (t.name === 'flavor')
            setFlavor(t.value);
        else if (t.name === 'boxes') {
            selection.boxes = Number(t.value);
            renderSelection();
        }
        else if (t.name === 'plan') {
            selection.plan = t.value;
            renderQuantity();
            renderSelection();
        }
    });
    buyBox.addEventListener('submit', (e) => {
        e.preventDefault();
        void addCurrent($('[data-add-btn]'));
    });
    $$('[data-flavor-switch]').forEach((b) => b.addEventListener('click', () => setFlavor(b.dataset.flavorSwitch)));
    const v = currentVariant();
    Analytics.track('view_item', { value: priceFor(v, selection.plan) / 100, items: [Analytics.item(v, selection.plan)] });
}
async function addCurrent(button, opts = {}) {
    const v = opts.variant || currentVariant();
    const plan = opts.plan || selection.plan;
    if (!v.available)
        return;
    const label = button?.querySelector('[data-add-label]');
    const original = label?.innerHTML || '';
    if (button) {
        button.classList.add('is-loading');
        button.setAttribute('aria-busy', 'true');
    }
    if (label)
        label.textContent = 'Adicionando…';
    try {
        cartState = await cart.add(v, plan, 1);
        const key = cartState.lines.find((l) => l.variantId === v.id && (plan === 'sub') === (l.sellingPlanId != null))?.key;
        renderCart(key);
        Analytics.track('add_to_cart', { value: priceFor(v, plan) / 100, items: [Analytics.item(v, plan)] });
        announce(`${CFG.flavors[v.flavor].name}, ${boxesLabel(v.boxes)}${plan === 'sub' ? ', assinatura mensal' : ''}, adicionado ao carrinho.`);
        if (button) {
            button.classList.add('is-added');
            if (label)
                label.textContent = 'Adicionado ✓';
        }
        Drawer.open(button || undefined);
        window.setTimeout(() => {
            if (button)
                button.classList.remove('is-added');
            if (label)
                label.innerHTML = original;
        }, 1800);
    }
    catch (err) {
        if (label)
            label.innerHTML = original;
        announce(err instanceof Error ? err.message : 'Não foi possível adicionar. Tente novamente.');
        Drawer.error(err instanceof Error ? err.message : 'Não foi possível adicionar. Tente novamente.');
    }
    finally {
        if (button) {
            button.classList.remove('is-loading');
            button.removeAttribute('aria-busy');
        }
    }
}
/* =========================================================================
   Carrinho lateral
   ========================================================================= */
function trapFocus(container, e) {
    if (e.key !== 'Tab')
        return;
    const items = $$('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])', container)
        .filter((el) => el.offsetParent !== null);
    if (!items.length)
        return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
    }
    else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
    }
}
const Drawer = {
    el: $('[data-drawer]'),
    panel: $('[data-drawer-panel]'),
    lastFocus: null,
    isOpen: false,
    open(trigger) {
        if (!this.el || !this.panel || this.isOpen)
            return;
        this.isOpen = true;
        this.lastFocus = trigger || document.activeElement;
        this.el.hidden = false;
        void this.el.offsetWidth;
        this.el.classList.add('is-open');
        document.body.classList.add('is-locked');
        $$('[data-cart-open]').forEach((b) => b.setAttribute('aria-expanded', 'true'));
        this.panel.focus({ preventScroll: true });
        Sticky.update();
        Analytics.track('view_cart', { value: cartState.subtotal / 100, items: [] });
    },
    close() {
        if (!this.el || !this.isOpen)
            return;
        this.isOpen = false;
        this.el.classList.remove('is-open');
        document.body.classList.remove('is-locked');
        $$('[data-cart-open]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
        window.setTimeout(() => { if (!this.isOpen && this.el)
            this.el.hidden = true; }, reduceMotion ? 0 : 460);
        this.lastFocus?.focus({ preventScroll: true });
        Sticky.update();
    },
    error(message) {
        const body = $('.drawer__body');
        if (!body)
            return;
        let box = $('[data-cart-error]', body);
        if (!box) {
            box = document.createElement('p');
            box.dataset.cartError = '';
            box.setAttribute('role', 'alert');
            box.className = 'opt-note';
            body.prepend(box);
        }
        box.textContent = message;
    },
    init() {
        $$('[data-cart-open]').forEach((b) => b.addEventListener('click', () => this.open(b)));
        this.el?.addEventListener('click', (e) => {
            const t = e.target;
            if (t.closest('[data-drawer-close]'))
                this.close();
        });
        this.el?.addEventListener('keydown', (e) => {
            if (e.key === 'Escape')
                this.close();
            if (this.panel)
                trapFocus(this.panel, e);
        });
        $('[data-cart-lines]')?.addEventListener('click', async (e) => {
            const t = e.target.closest('button');
            const line = t?.closest('[data-key]');
            if (!t || !line)
                return;
            const key = line.dataset.key;
            const current = cartState.lines.find((l) => l.key === key);
            if (!current)
                return;
            let next = current.quantity;
            if (t.hasAttribute('data-qty-inc'))
                next += 1;
            else if (t.hasAttribute('data-qty-dec'))
                next -= 1;
            else if (t.hasAttribute('data-remove'))
                next = 0;
            else
                return;
            t.disabled = true;
            try {
                cartState = await cart.setQuantity(key, next);
                renderCart();
                if (next === 0) {
                    announce(`${current.title} removido do carrinho.`);
                    const v = CFG.variants.find((x) => x.id === current.variantId);
                    if (v)
                        Analytics.track('remove_from_cart', { value: (current.unitPrice * current.quantity) / 100, items: [Analytics.item(v, current.sellingPlanId ? 'sub' : 'once', current.quantity)] });
                    this.panel?.focus();
                }
                else {
                    announce(`Quantidade de ${current.title}: ${next}.`);
                    $(`[data-key="${CSS.escape(key)}"] [${t.hasAttribute('data-qty-inc') ? 'data-qty-inc' : 'data-qty-dec'}]`)?.focus();
                }
            }
            catch (err) {
                t.disabled = false;
                this.error(err instanceof Error ? err.message : 'Não foi possível atualizar a quantidade.');
            }
        });
        $('[data-cross-sell]')?.addEventListener('click', (e) => {
            const b = e.target.closest('[data-cross-add]');
            if (!b)
                return;
            const v = CFG.variants.find((x) => x.id === Number(b.dataset.crossAdd));
            if (v)
                void addCurrent(b, { variant: v, plan: 'once' });
        });
        $('[data-checkout]')?.addEventListener('click', () => {
            Analytics.track('begin_checkout', {
                value: cartState.subtotal / 100,
                items: cartState.lines.map((l) => {
                    const v = CFG.variants.find((x) => x.id === l.variantId);
                    return v ? Analytics.item(v, l.sellingPlanId ? 'sub' : 'once', l.quantity) : { item_id: String(l.variantId), item_name: l.title, quantity: l.quantity };
                }),
            });
        });
    },
};
function renderCart(highlightKey) {
    const s = cartState;
    $$('[data-cart-count]').forEach((el) => {
        const prev = Number(el.textContent);
        el.textContent = String(s.count);
        el.classList.toggle('has-items', s.count > 0);
        if (s.count > prev) {
            el.classList.remove('is-bump');
            void el.offsetWidth;
            el.classList.add('is-bump');
        }
    });
    $$('[data-cart-open]').forEach((b) => b.setAttribute('aria-label', s.count ? `Abrir carrinho, ${plural(s.count, 'item', 'itens')}` : 'Abrir carrinho, vazio'));
    const countText = $('[data-cart-count-text]');
    if (countText)
        countText.textContent = `(${s.count})`;
    const list = $('[data-cart-lines]');
    const empty = $('[data-cart-empty]');
    const foot = $('[data-drawer-foot]');
    if (list) {
        list.innerHTML = s.lines.map((l) => {
            const total = l.unitPrice * l.quantity;
            const ref = Math.max(l.unitCompare, l.unitPrice) * l.quantity;
            return `<li class="cart-line${l.key === highlightKey ? ' is-new' : ''}" data-key="${esc(l.key)}">
  <div class="cart-line__img">${productThumb(l.flavor, l.image)}</div>
  <div class="cart-line__info">
    <p class="cart-line__title">${esc(l.title)}</p>
    <p class="cart-line__meta">${esc(l.subtitle)}</p>
    ${l.sellingPlanId ? `<span class="badge badge--citrus cart-line__plan">Assinatura mensal${CFG.sellingPlan ? ` · −${CFG.sellingPlan.percentage}%` : ''}</span>` : ''}
    <div class="stepper" role="group" aria-label="Quantidade de ${esc(l.title)}">
      <button type="button" data-qty-dec aria-label="Diminuir quantidade" ${l.quantity <= 1 ? 'disabled' : ''}><svg class="icon icon--sm" aria-hidden="true"><use href="#i-minus"/></svg></button>
      <output>${l.quantity}</output>
      <button type="button" data-qty-inc aria-label="Aumentar quantidade" ${l.quantity >= 10 && CFG.mode === 'preview' ? 'disabled' : ''}><svg class="icon icon--sm" aria-hidden="true"><use href="#i-plus"/></svg></button>
    </div>
  </div>
  <div class="cart-line__side">
    <p class="cart-line__price">${ref > total ? `<s><span class="sr-only">de </span>${fmt(ref)}</s>` : ''}${fmt(total)}</p>
    <button class="cart-line__remove" type="button" data-remove aria-label="Remover ${esc(l.title)}"><svg class="icon icon--sm" aria-hidden="true"><use href="#i-trash"/></svg>Remover</button>
  </div>
</li>`;
        }).join('');
    }
    if (empty)
        empty.hidden = s.lines.length > 0;
    if (foot)
        foot.hidden = s.lines.length === 0;
    const subtotal = $('[data-cart-subtotal]');
    if (subtotal)
        subtotal.textContent = fmt(s.subtotal);
    const saveEl = $('[data-cart-save]');
    if (saveEl) {
        const save = s.compareSubtotal - s.subtotal;
        saveEl.textContent = save > 0 ? `Você economiza ${fmt(save)}` : '';
    }
    /* Frete grátis */
    const progress = $('[data-ship-progress]');
    const text = $('[data-ship-text]');
    const bar = $('[data-ship-bar]');
    const pct = Math.min(100, Math.round((s.subtotal / CFG.freeShippingThreshold) * 100));
    if (progress && text && bar) {
        const done = s.subtotal >= CFG.freeShippingThreshold;
        progress.classList.toggle('is-done', done);
        text.innerHTML = `<svg class="icon" aria-hidden="true"><use href="#i-${done ? 'check' : 'truck'}"/></svg><span>${done
            ? 'Você ganhou <strong>frete grátis</strong>.'
            : s.subtotal > 0 ? `Faltam <strong>${fmt(CFG.freeShippingThreshold - s.subtotal)}</strong> para o frete grátis.` : `Frete grátis acima de ${fmt(CFG.freeShippingThreshold)}.`}</span>`;
        bar.setAttribute('aria-valuenow', String(pct));
        bar.firstElementChild?.style.setProperty('--p', String(pct));
    }
    /* Sugestão do outro sabor */
    const cross = $('[data-cross-sell]');
    if (cross) {
        const flavors = new Set(s.lines.map((l) => l.flavor).filter(Boolean));
        const other = flavors.size === 1 ? (flavors.has('tropical') ? 'cranberry' : 'tropical') : null;
        const ov = other ? CFG.variants.find((v) => v.flavor === other && v.boxes === 1 && v.available) : undefined;
        cross.hidden = !ov;
        if (ov) {
            cross.innerHTML = `<div class="cross-sell__img" aria-hidden="true">${flavorThumb(ov.flavor)}</div>
<p><b>Experimente também ${esc(CFG.flavors[ov.flavor].name)}</b><span>1 caixa · ${shotsLabel(1)} · ${fmt(ov.price)}</span></p>
<button class="btn btn--ghost btn--sm" type="button" data-cross-add="${ov.id}"><span data-add-label>Adicionar</span></button>`;
        }
    }
    const checkout = $('[data-checkout]');
    if (checkout)
        checkout.href = cart.checkoutUrl(s);
}
/* =========================================================================
   CTA fixo no mobile
   ========================================================================= */
const Sticky = {
    el: $('[data-sticky-cta]'),
    heroVisible: true,
    buyVisible: false,
    footerVisible: false,
    update() {
        if (!this.el)
            return;
        const show = !isDesktop() && !this.heroVisible && !this.buyVisible && !this.footerVisible && !Drawer.isOpen && !document.body.classList.contains('menu-open');
        this.el.classList.toggle('is-visible', show);
        this.el.setAttribute('aria-hidden', String(!show));
        if (show)
            this.el.removeAttribute('inert');
        else
            this.el.setAttribute('inert', '');
        document.body.classList.toggle('has-sticky-cta', show);
    },
    init() {
        if (!this.el)
            return;
        const watch = (sel, key) => {
            const target = $(sel);
            if (!target)
                return;
            new IntersectionObserver((entries) => {
                entries.forEach((en) => {
                    /* O CTA do hero só "libera" o fixo depois que o visitante rolou além dele */
                    this[key] = key === 'heroVisible' ? en.isIntersecting || en.boundingClientRect.top > 0 : en.isIntersecting;
                });
                this.update();
            }, { threshold: 0 }).observe(target);
        };
        watch('.hero__ctas', 'heroVisible');
        watch('[data-buy-box]', 'buyVisible');
        watch('.final', 'footerVisible');
        window.addEventListener('resize', () => this.update(), { passive: true });
        $('[data-sticky-add]', this.el)?.addEventListener('click', (e) => void addCurrent(e.currentTarget));
    },
};
/* =========================================================================
   Header, menu mobile, anúncios
   ========================================================================= */
function initHeader() {
    const header = $('[data-header]');
    const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    const toggle = $('[data-menu-toggle]');
    const menu = $('[data-mobile-menu]');
    const icon = $('[data-menu-icon] use');
    const setMenu = (open) => {
        if (!toggle || !menu)
            return;
        menu.hidden = !open;
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
        icon?.setAttribute('href', open ? '#i-x' : '#i-menu');
        document.body.classList.toggle('is-locked', open);
        document.body.classList.toggle('menu-open', open);
        Sticky.update();
        if (open)
            $('a', menu)?.focus();
    };
    toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
    menu?.addEventListener('click', (e) => { if (e.target.closest('a'))
        setMenu(false); });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') {
            setMenu(false);
            toggle.focus();
        }
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', (mq) => { if (mq.matches)
        setMenu(false); });
    /* Link ativo conforme a seção visível */
    const links = $$('[data-nav]');
    const sections = $$('main section[id]');
    const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
            if (!en.isIntersecting)
                return;
            links.forEach((a) => { if (a.getAttribute('href') === `#${en.target.id}`)
                a.setAttribute('aria-current', 'true');
            else
                a.removeAttribute('aria-current'); });
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => io.observe(s));
    $$('[data-track-cta]').forEach((a) => a.addEventListener('click', () => {
        window.dataLayer.push({ event: 'cta_click', cta_location: a.dataset.trackCta });
    }));
}
function initAnnouncements() {
    const items = $$('.announce__item');
    if (items.length < 2 || reduceMotion)
        return;
    let i = 0;
    let paused = false;
    const track = $('[data-announce]');
    track?.addEventListener('mouseenter', () => { paused = true; });
    track?.addEventListener('mouseleave', () => { paused = false; });
    window.setInterval(() => {
        if (paused || isDesktop() || document.hidden)
            return;
        items[i].classList.remove('is-active');
        i = (i + 1) % items.length;
        items[i].classList.add('is-active');
    }, 4500);
}
/* =========================================================================
   FAQ, avaliações, diálogos, newsletter
   ========================================================================= */
function initAccordion() {
    $$('[data-accordion] .acc-trigger').forEach((btn) => {
        btn.addEventListener('click', () => {
            const open = btn.getAttribute('aria-expanded') !== 'true';
            btn.setAttribute('aria-expanded', String(open));
            document.getElementById(btn.getAttribute('aria-controls') || '')?.classList.toggle('is-open', open);
        });
    });
}
function starsHTML(rating) {
    return `<span class="stars" role="img" aria-label="Nota ${rating.toLocaleString('pt-BR')} de 5">${[1, 2, 3, 4, 5]
        .map((n) => `<svg class="icon${n <= Math.round(rating) ? ' is-on' : ''}" aria-hidden="true"><use href="#i-star"/></svg>`).join('')}</span>`;
}
function initReviews() {
    const r = CFG.reviews;
    const summary = $('[data-reviews-summary]');
    const track = $('[data-reviews-track]');
    const countLabel = r.count ? plural(r.count, 'avaliação', 'avaliações') : 'Avaliações';
    bind('review-count-label').forEach((el) => { el.textContent = countLabel; });
    if (summary) {
        summary.innerHTML = r.average != null
            ? `<div class="reviews__score"><strong>${r.average.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</strong><p>${starsHTML(r.average)}<b>${countLabel}</b>de clientes da loja</p></div>`
            : `<div class="reviews__score"><strong>${r.count}</strong><p><b>avaliações de clientes</b>publicadas na loja SHOTZ</p></div>`;
    }
    if (!track)
        return;
    /* Se um bloco do app de avaliações foi adicionado à seção no editor do tema, ele assume o carrossel */
    if ($('[data-reviews-app]')?.children.length) {
        $('[data-carousel]')?.setAttribute('hidden', '');
        $('.carousel-ctrl')?.setAttribute('hidden', '');
        return;
    }
    if (r.items.length) {
        track.innerHTML = r.items.map((it) => `<li class="review-card">
  ${starsHTML(it.rating)}
  <blockquote><p>${esc(it.text)}</p></blockquote>
  <footer><div><cite>${esc(it.name)}</cite>${it.verified ? '<span class="meta">Compra verificada</span>' : ''}</div><span class="meta">${esc([it.flavor, it.date].filter(Boolean).join(' · '))}</span></footer>
</li>`).join('');
    }
    else {
        const link = r.url || CFG.productUrl;
        track.innerHTML = `<li class="review-card review-card--info">
  <h3>Avaliações reais, direto da loja</h3>
  <p>As ${r.count} avaliações publicadas pelos clientes entram aqui, importadas do app de avaliações da Shopify. Nenhum depoimento é escrito pela marca.</p>
  <a class="btn btn--sm" href="${esc(link)}">Ler avaliações na loja <svg class="icon icon--arrow" aria-hidden="true"><use href="#i-arrow"/></svg></a>
</li>${[1, 2, 3].map(() => `<li class="review-card review-card--pending" aria-hidden="true"><span class="stars">${[1, 2, 3, 4, 5].map(() => '<svg class="icon"><use href="#i-star"/></svg>').join('')}</span><div class="skeleton"><span></span><span></span><span></span><span></span></div><footer><span class="meta">Avaliação de cliente</span></footer></li>`).join('')}`;
    }
    const viewport = $('[data-carousel]');
    const prev = $('[data-carousel-prev]');
    const next = $('[data-carousel-next]');
    if (!viewport || !prev || !next)
        return;
    const step = () => track.firstElementChild?.getBoundingClientRect().width || 320;
    const sync = () => {
        prev.disabled = viewport.scrollLeft <= 4;
        next.disabled = viewport.scrollLeft + viewport.clientWidth >= viewport.scrollWidth - 4;
    };
    prev.addEventListener('click', () => viewport.scrollBy({ left: -(step() + 16), behavior: reduceMotion ? 'auto' : 'smooth' }));
    next.addEventListener('click', () => viewport.scrollBy({ left: step() + 16, behavior: reduceMotion ? 'auto' : 'smooth' }));
    viewport.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync, { passive: true });
    sync();
}
function initDialogs() {
    $$('[data-open-dialog]').forEach((b) => b.addEventListener('click', () => {
        /* Na loja, as preferências de cookies abrem o painel nativo da Shopify */
        const banner = window.privacyBanner;
        if (b.dataset.openDialog === 'consent-dialog' && CFG.mode === 'shopify' && banner?.showPreferences) {
            banner.showPreferences();
            return;
        }
        const d = document.getElementById(b.dataset.openDialog || '');
        if (d && typeof d.showModal === 'function')
            d.showModal();
    }));
    $$('dialog.modal').forEach((d) => {
        d.addEventListener('click', (e) => {
            if (e.target === d || e.target.closest('[data-close-dialog]'))
                d.close();
        });
    });
    $$('[data-consent]').forEach((b) => b.addEventListener('click', () => {
        Analytics.apply(b.dataset.consent === 'granted');
        b.closest('dialog')?.close();
    }));
}
function initNewsletter() {
    const form = $('[data-newsletter]');
    if (!form || CFG.mode === 'shopify')
        return; /* no Shopify, o formulário de cliente envia de verdade */
    const msg = $('[data-newsletter-msg]', form);
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = $('input[type="email"]', form);
        if (!input || !input.checkValidity()) {
            if (msg)
                msg.textContent = 'Digite um e-mail válido, como nome@exemplo.com.';
            input?.focus();
            return;
        }
        if (msg)
            msg.textContent = 'Esta é a prévia: na loja, o cadastro entra na lista de clientes da Shopify.';
    });
}
function initSocial() {
    const li = $('[data-instagram]');
    const a = $('[data-instagram-link]');
    if (li && a && CFG.instagramUrl) {
        a.href = CFG.instagramUrl;
        li.hidden = false;
    }
}
/* ---------- início ---------- */
function boot() {
    renderArt();
    Analytics.init();
    initHeader();
    initAnnouncements();
    initBuyBox();
    Drawer.init();
    Sticky.init();
    initAccordion();
    initReviews();
    initDialogs();
    initNewsletter();
    initSocial();
    cart.load().then((s) => { cartState = s; renderCart(); }).catch(() => renderCart());
}
if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', boot);
else
    boot();

})();
