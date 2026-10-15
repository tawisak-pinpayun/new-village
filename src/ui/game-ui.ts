import { ITEM_ASSETS, SHOP_ITEM_ASSETS, TAILOR_ITEM_ASSETS, PET_UI_ASSETS, itemAssetStyle, shopItemAssetStyle, tailorItemAssetStyle, petUiAssetStyle, type ItemAssetKey, type ShopItemAssetKey, type TailorItemAssetKey, type PetUiAssetKey } from './item-assets'
import type { ItemId } from '../domain'
import { SHOPS, type ShopDefinition } from '../shops'

export type MarketProduct = {
  id: ItemId
  art?: ItemAssetKey
  name: string
  price: number
  action: 'buy' | 'sell'
  description?: string
}

const productCard = ({ id, art, name, price, action, description }: MarketProduct) => {
  const data = action === 'buy' ? `data-buy="${id}"` : `data-sell="${id}"`
  const actionText = action === 'buy' ? 'ซื้อ' : 'ขาย'
  return `<article class="game-item-card trade ${action === 'sell' ? 'sell-card' : ''}" data-item-card data-price="${price}" data-name="${name}" data-quantity="1">
    <span class="game-item-art ${art ? '' : 'game-missing-art'}" role="img" aria-label="${art ? ITEM_ASSETS[art].alt : 'ยังไม่มีภาพสินค้า'}" style="${art ? itemAssetStyle(art) : ''}">${art ? '' : 'ภาพสินค้าอยู่ระหว่างจัดทำ'}</span>
    <span class="game-item-copy"><b>${name}</b>${description ? `<small>${description}</small>` : ''}${action === 'sell' ? `<small class="game-owned">มี <b data-owned-item="${id}">0</b> ชิ้น</small>` : ''}<em><i class="game-coin-icon" aria-hidden="true"></i>${price} Coins</em></span>
    <span class="game-quantity"><button type="button" data-qty="-1" aria-label="ลดจำนวน ${name}">−</button><output>1</output><button type="button" data-qty="1" aria-label="เพิ่มจำนวน ${name}">＋</button></span>
    <button type="button" class="game-purchase" ${data} aria-label="${actionText} ${name} ${price} Coins">${actionText}</button>
  </article>`
}

const section = (category: string, title: string, items: MarketProduct[], extraClass = '') => `<section class="game-shop-section ${extraClass}" data-market-section="${category}">
  <h3>${title}</h3><div class="shop-products">${items.map(productCard).join('')}</div>
</section>`

export function renderShopWindow(shop: ShopDefinition): string {
  const names: Record<string, string> = { radish_seed: 'เมล็ด Radish', carrot_seed: 'เมล็ดแครอท', tomato_seed: 'เมล็ดมะเขือเทศ', radish: 'Radish', carrot: 'แครอท', tomato: 'มะเขือเทศ' }
  const buy = shop.stock.map(product => ({ id: product.id, art: product.art as ItemAssetKey, name: names[product.id] ?? product.id, price: product.price, action: 'buy' as const, description: product.description }))
  const sell = shop.acceptedSellCategories.map(id => ({ id, art: id in ITEM_ASSETS ? id as ItemAssetKey : undefined, name: names[id] ?? id, price: shop.sellPrices[id] ?? 0, action: 'sell' as const }))
  const theme = `--shop-primary:${shop.theme.primary};--shop-accent:${shop.theme.accent};--shop-banner:url('${shop.bannerAsset}');--shop-banner-position:${shop.bannerPosition}`
  const categories = shop.categories.map((category, index) => `<button class="${index === 0 ? 'active' : ''}" data-market-category="${category.id}">${category.label}</button>`).join('')
  return `<div id="market-shop" class="overlay hidden"><div class="dialog market-dialog shop-dialog game-window game-market" data-shop-id="${shop.shopId}" style="${theme}">
    <div class="dialog-top game-awning"><span>${shop.shopName}</span><strong class="shop-coins"><i class="game-coin-icon"></i><b data-shop-coins>0</b> Coins</strong><button id="close-market" aria-label="ปิดร้าน">✕</button></div>
    <aside class="game-shop-nav" aria-label="หมวดสินค้า">${categories}</aside>
    <header class="game-shop-hero"><div class="game-wood-sign"><small>LILY'S SEED SHOP</small><h2>ร้านเมล็ดพันธุ์<br>ของลิลลี่</h2><p>ซื้อเมล็ดสำหรับสวน และขายผลผลิตที่ปลูกเอง</p></div><div class="game-speech">วันนี้อยากปลูก<br>อะไรดีจ๊ะ?</div></header>
    <main class="game-shop-content"><nav class="game-shop-tabs" aria-label="ซื้อหรือขาย"><button class="active" data-market-tab="buy">ซื้อสินค้า</button><button data-market-tab="sell">ขายสินค้า</button></nav><div class="game-market-tools"><label class="shop-toolbar">⌕ <input data-shop-search placeholder="ค้นหาสินค้า..." aria-label="ค้นหาสินค้า"></label><label class="game-sort">เรียงตาม<select data-market-sort aria-label="เรียงสินค้า"><option value="default">แนะนำ</option><option value="price-asc">ราคาน้อยไปมาก</option><option value="price-desc">ราคามากไปน้อย</option><option value="name">ชื่อสินค้า</option></select></label></div><div id="market-feedback" class="game-shop-feedback" role="status" aria-live="polite"></div>
      <div data-market-panel="buy">${section('seeds','เมล็ดพันธุ์', buy)}</div><div data-market-panel="sell" hidden><div class="game-shop-empty" data-sell-empty hidden><span class="game-empty-art" aria-hidden="true"></span><strong>ยังไม่มีผลผลิตที่ร้านรับซื้อ</strong><small>เก็บเกี่ยวผักแล้วนำกลับมาขายให้ลิลลี่ได้เลย</small></div>${section('sell','รับซื้อผลผลิต', sell, 'game-sell-section')}</div>
      <div class="dialog-foot">เลือกจำนวนก่อนซื้อหรือขาย · กด <kbd>Esc</kbd> ปิด</div>
    </main>
  </div></div>`
}

export function renderFarmersMarket(): string { return renderShopWindow(SHOPS.seed_shop) }

export type CatalogCard = {
  id: string; name: string; description: string; price: number; art: string; category: string
  action: 'buy' | 'sell' | 'craft' | 'outfit' | 'gear'
  owned?: number; quantity?: boolean; disabled?: boolean; actionText?: string
}

export function renderCatalogCard(card: CatalogCard): string {
  const tailorArt = card.art in TAILOR_ITEM_ASSETS
  const shopArt = card.art in SHOP_ITEM_ASSETS
  const petArt = card.art in PET_UI_ASSETS
  const art = tailorArt ? TAILOR_ITEM_ASSETS[card.art as TailorItemAssetKey] : shopArt ? SHOP_ITEM_ASSETS[card.art as ShopItemAssetKey] : petArt ? PET_UI_ASSETS[card.art as PetUiAssetKey] : ITEM_ASSETS[card.art as ItemAssetKey]
  const style = art ? tailorArt ? tailorItemAssetStyle(card.art as TailorItemAssetKey) : shopArt ? shopItemAssetStyle(card.art as ShopItemAssetKey) : petArt ? petUiAssetStyle(card.art as PetUiAssetKey) : itemAssetStyle(card.art as ItemAssetKey) : ''
  const buttonData = {
    buy: 'data-special-buy', sell: 'data-special-sell', craft: 'data-craft',
    outfit: 'data-outfit', gear: 'data-gear-buy'
  }[card.action]
  const label = card.actionText ?? { buy: 'ซื้อ', sell: 'ขาย', craft: 'หลอม', outfit: 'เลือก', gear: 'เลือก' }[card.action]
  return `<article class="game-item-card trade ${card.action === 'sell' ? 'sell-card' : ''}" data-special-card data-shop-category="${card.category}" data-price="${card.price}" data-name="${card.name}" data-quantity="1">
    <span class="game-item-art ${petArt ? 'pet-art' : ''} ${art ? '' : 'game-missing-art'}" role="img" aria-label="${art?.alt ?? 'ยังไม่มีภาพสินค้า'}" style="${style}">${art ? '' : 'ภาพสินค้าอยู่ระหว่างจัดทำ'}</span>
    <span class="game-item-copy"><b>${card.name}</b><small>${card.description}</small>${card.owned === undefined ? '' : `<small>มีในกระเป๋า ${card.owned} ชิ้น</small>`}<em>${card.price ? `<i class="game-coin-icon" aria-hidden="true"></i>${card.price} Coins` : label}</em></span>
    ${card.quantity && !card.disabled ? `<span class="game-quantity"><button type="button" data-special-qty="-1" aria-label="ลดจำนวน ${card.name}">−</button><output>1</output><button type="button" data-special-qty="1" aria-label="เพิ่มจำนวน ${card.name}">＋</button></span>` : '<span></span>'}
    <button class="game-purchase" type="button" ${buttonData}="${card.id}" ${card.disabled ? 'disabled' : ''} aria-label="${label} ${card.name}">${card.disabled ? 'เร็ว ๆ นี้' : label}</button>
  </article>`
}
