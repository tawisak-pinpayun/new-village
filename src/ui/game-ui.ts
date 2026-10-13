import { ITEM_ASSETS, itemAssetStyle, type ItemAssetKey } from './item-assets'
import { SHOPS, type ShopDefinition } from '../shops'

export type MarketProduct = {
  id: ItemAssetKey
  name: string
  price: number
  action: 'buy' | 'sell'
  description?: string
}

const productCard = ({ id, name, price, action, description }: MarketProduct) => {
  const data = action === 'buy' ? `data-buy="${id}"` : `data-sell="${id}"`
  const actionText = action === 'buy' ? 'ซื้อ' : 'ขาย'
  return `<article class="game-item-card trade ${action === 'sell' ? 'sell-card' : ''}" data-item-card data-price="${price}" data-name="${name}" data-quantity="1">
    <span class="game-item-art" role="img" aria-label="${ITEM_ASSETS[id].alt}" style="${itemAssetStyle(id)}"></span>
    <span class="game-item-copy"><b>${name}</b>${description ? `<small>${description}</small>` : ''}${action === 'sell' ? `<small class="game-owned">มี <b data-owned-item="${id}">0</b> ชิ้น</small>` : ''}<em><i class="game-coin-icon" aria-hidden="true"></i>${price} Coins</em></span>
    <span class="game-quantity"><button type="button" data-qty="-1" aria-label="ลดจำนวน ${name}">−</button><output>1</output><button type="button" data-qty="1" aria-label="เพิ่มจำนวน ${name}">＋</button></span>
    <button type="button" class="game-purchase" ${data} aria-label="${actionText} ${name} ${price} Coins">${actionText}</button>
  </article>`
}

const section = (category: string, title: string, items: MarketProduct[], extraClass = '') => `<section class="game-shop-section ${extraClass}" data-market-section="${category}">
  <h3>${title}</h3><div class="shop-products">${items.map(productCard).join('')}</div>
</section>`

export function renderShopWindow(shop: ShopDefinition): string {
  const seeds: MarketProduct[] = [
    { id: 'radish_seed', name: 'เมล็ด Radish', price: 8, action: 'buy' },
    { id: 'carrot_seed', name: 'เมล็ดแครอท', price: 10, action: 'buy' },
    { id: 'tomato_seed', name: 'เมล็ดมะเขือเทศ', price: 12, action: 'buy' }
  ]
  const supplies: MarketProduct[] = [
    { id: 'rice_meal', name: 'ข้าวกล่อง', price: 12, action: 'buy', description: 'ฟื้น HP และพลังงาน' },
    { id: 'sword', name: 'ดาบ', price: 35, action: 'buy' },
    { id: 'bow', name: 'ธนู', price: 55, action: 'buy' }
  ]
  const sell: MarketProduct[] = [
    { id: 'carrot', name: 'แครอท', price: 18, action: 'sell' }, { id: 'tomato', name: 'มะเขือเทศ', price: 22, action: 'sell' },
    { id: 'meat', name: 'เนื้อ', price: 16, action: 'sell' }, { id: 'hide', name: 'หนังสัตว์', price: 12, action: 'sell' },
    { id: 'copper', name: 'แร่ทองแดง', price: 14, action: 'sell' }, { id: 'iron', name: 'แร่เหล็ก', price: 22, action: 'sell' },
    { id: 'moonstone', name: 'จันทราศิลา', price: 120, action: 'sell' }
  ]
  const theme = `--shop-primary:${shop.theme.primary};--shop-accent:${shop.theme.accent};--shop-banner:url('${shop.bannerAsset}');--shop-banner-position:${shop.bannerPosition}`
  const categories = shop.categories.map((category, index) => `<button class="${index === 0 ? 'active' : ''}" data-market-category="${category.id}">${category.label}</button>`).join('')
  return `<div id="market-shop" class="overlay hidden"><div class="dialog market-dialog shop-dialog game-window game-market" data-shop-id="${shop.shopId}" style="${theme}">
    <div class="dialog-top game-awning"><span>${shop.shopName}</span><strong class="shop-coins"><i class="game-coin-icon"></i><b data-shop-coins>0</b> Coins</strong><button id="close-market" aria-label="ปิดร้าน">✕</button></div>
    <aside class="game-shop-nav" aria-label="หมวดสินค้า">${categories}</aside>
    <header class="game-shop-hero"><div class="game-wood-sign"><small>FARMERS' MARKET</small><h2>ตลาดเมล็ดพันธุ์<br>และอุปกรณ์</h2><p>ซื้อเมล็ด อาหาร และอาวุธ หรือขายของจากการผจญภัย</p></div><div class="game-speech">ยินดีต้อนรับจ้า!<br>มีของดีมากมายเลยนะ</div></header>
    <main class="game-shop-content"><nav class="game-shop-tabs" aria-label="ซื้อหรือขาย"><button class="active" data-market-tab="buy">ซื้อสินค้า</button><button data-market-tab="sell">ขายสินค้า</button></nav><div class="game-market-tools"><label class="shop-toolbar">⌕ <input data-shop-search placeholder="ค้นหาสินค้า..." aria-label="ค้นหาสินค้า"></label><label class="game-sort">เรียงตาม<select data-market-sort aria-label="เรียงสินค้า"><option value="default">แนะนำ</option><option value="price-asc">ราคาน้อยไปมาก</option><option value="price-desc">ราคามากไปน้อย</option><option value="name">ชื่อสินค้า</option></select></label></div><div id="market-feedback" class="game-shop-feedback" role="status" aria-live="polite"></div>
      <div data-market-panel="buy">${section('seeds','เมล็ดพันธุ์', seeds)}${section('supplies','อาหารและอาวุธ', supplies)}</div><div data-market-panel="sell" hidden><div class="game-shop-empty" data-sell-empty hidden><span class="game-empty-art" aria-hidden="true"></span><strong>ยังไม่มีของที่ร้านรับซื้อ</strong><small>เก็บเกี่ยวหรือออกผจญภัย แล้วนำของกลับมาขายให้ลิลลี่ได้เลย</small></div>${section('sell','รับซื้อของ', sell, 'game-sell-section')}</div>
      <div class="dialog-foot">ลากอาวุธไป Hotbar ช่อง 8–10 · กด <kbd>Esc</kbd> ปิด</div>
    </main>
  </div></div>`
}

export function renderFarmersMarket(): string { return renderShopWindow(SHOPS.seed_shop) }
