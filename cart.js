/* ============================
   cart.js - سلة التسوق المتطورة
   ============================ */

const FREE_SHIPPING_THRESHOLD = 300;
const SHIPPING_COST = 20;

let cart = JSON.parse(localStorage.getItem('warda_cart') || '[]');

function saveCart() {
  localStorage.setItem('warda_cart', JSON.stringify(cart));
}

function updateCartBadge() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  const el = document.getElementById('cart-count');
  if (!el) return;
  el.textContent = total;
  el.classList.remove('bump');
  void el.offsetWidth;
  if (total > 0) el.classList.add('bump');
}

function addToCart(id) {
  const product = window.products && window.products.find(p => p.id === id);
  if (!product) return;
  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      img: product.img,
      qty: 1,
      stock: product.stock ?? 99
    });
  }
  saveCart();
  updateCartBadge();
  if (typeof showToast === 'function') {
    showToast(`<i class="fas fa-check-circle"></i> تمت إضافة "${product.name}" للسلة`);
  }
}

function removeFromCart(id) {
  const doRemove = () => {
    cart = cart.filter(i => i.id !== id);
    saveCart();
    updateCartBadge();
    renderCart();
  };

  const itemEl = document.querySelector(`.cart-item[data-id="${id}"]`);
  if (itemEl) {
    itemEl.style.transition = 'opacity 0.3s, transform 0.3s';
    itemEl.style.opacity = '0';
    itemEl.style.transform = 'translateX(30px) scale(0.95)';
    setTimeout(doRemove, 300);
  } else {
    doRemove();
  }
}

function updateQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  const newQty = item.qty + delta;
  if (newQty <= 0) {
    removeFromCart(id);
    return;
  }
  item.qty = newQty;
  saveCart();
  updateCartBadge();
  renderCart();
}

function calculateTotals() {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping  = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total     = subtotal + shipping;
  return { subtotal, shipping, total };
}

function renderCart() {
  const wrap = document.getElementById('cart-content');
  if (!wrap) return;

  if (cart.length === 0) {
    wrap.innerHTML = `
      <div class="empty-cart">
        <i class="fas fa-shopping-bag" style="font-size:56px;color:var(--pink-dark);margin-bottom:16px;display:block;"></i>
        <h3>السلة فارغة</h3>
        <p>لم تُضيفي أي منتجات بعد. ابدئي التسوق الآن!</p>
        <button class="btn-primary" onclick="navigate('products')">
          <i class="fas fa-store"></i> تسوقي الآن
        </button>
      </div>`;
    return;
  }

  const { subtotal, shipping, total } = calculateTotals();

  const progressPercent = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remaining       = FREE_SHIPPING_THRESHOLD - subtotal;
  const freeShippingMsg = remaining <= 0
    ? '<i class="fas fa-check-circle"></i> لقد حصلتِ على توصيل مجاني!'
    : `<i class="fas fa-truck"></i> بقي لكِ ${remaining} درهم للشحن المجاني`;

  // ===== Upselling =====
  const cartIds        = new Set(cart.map(i => i.id));
  const cartCategories = [...new Set(
    cart.map(item => (window.products || []).find(p => p.id === item.id)?.category).filter(Boolean)
  )];

  let recommendedProducts = [];
  if (cartCategories.includes('بيجامات') && !cartCategories.includes('معاطف')) {
    recommendedProducts = (window.products || []).filter(p =>
      !cartIds.has(p.id) && (p.category === 'معاطف' || p.category === 'إكسسوارات')
    ).slice(0, 4);
  } else if (cartCategories.includes('جلابيات') && !cartCategories.includes('إكسسوارات')) {
    recommendedProducts = (window.products || []).filter(p =>
      !cartIds.has(p.id) && p.category === 'إكسسوارات'
    ).slice(0, 4);
  }

  const upsellHTML = recommendedProducts.length ? `
    <div class="upsell-section" style="margin-top:40px;">
      <div class="section-header">
        <span class="tag"><i class="fas fa-magic"></i> مقترحات</span>
        <h2>أكملي أناقتكِ</h2>
        <p>قطع مميزة تتناغم مع اختياراتكِ</p>
      </div>
      <div class="products-grid">
        ${recommendedProducts.map(p => {
          const stockBadge = (p.stock !== undefined && p.stock < 3)
            ? '<span class="card-badge"><i class="fas fa-fire"></i> آخر قطع</span>'
            : (p.badge ? `<span class="card-badge">${p.badge}</span>` : '');
          return `
            <div class="product-card" onclick="navigate('detail', ${p.id})">
              <div class="card-img-wrap">
                <img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.parentElement.style.background='var(--pink-soft)'" />
                ${stockBadge}
              </div>
              <div class="card-body">
                <div class="card-category">${p.category}</div>
                <div class="card-name">${p.name}</div>
                <div class="card-footer">
                  <div class="card-price">${p.price} <span>درهم</span></div>
                  <button class="buy-btn" onclick="event.stopPropagation(); handleBuyClick(this, ${p.id})">
                    <i class="fas fa-cart-plus"></i> أضف
                  </button>
                </div>
              </div>
            </div>`;
        }).join('')}
      </div>
    </div>` : '';

  // ===== عناصر السلة =====
  const itemsHTML = cart.map(item => {
    const product     = (window.products || []).find(p => p.id === item.id);
    const stockWarning = (product?.stock !== undefined && product.stock < 3)
      ? `<span class="stock-warning"><i class="fas fa-exclamation-triangle"></i> سارعي! آخر قطع متوفرة</span>`
      : '';
    return `
      <div class="cart-item" data-id="${item.id}">
        <div class="cart-item-img">
          <img src="${item.img}" alt="${item.name}" loading="lazy" onerror="this.parentElement.style.background='var(--pink-soft)'" />
        </div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}${stockWarning}</div>
          <div class="cart-item-price">
            <i class="fas fa-tag"></i> ${item.price} درهم
          </div>
          <div class="qty-ctrl">
            <button class="qty-btn" onclick="updateQty(${item.id}, -1)" aria-label="تقليل الكمية">
              <i class="fas fa-minus"></i>
            </button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="updateQty(${item.id}, 1)" aria-label="زيادة الكمية">
              <i class="fas fa-plus"></i>
            </button>
          </div>
        </div>
        <button class="remove-btn" onclick="removeFromCart(${item.id})" aria-label="حذف المنتج">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>`;
  }).join('');

  wrap.innerHTML = `
    <div class="cart-wrap">
      <div class="cart-items-list">
        ${itemsHTML}
      </div>

      <div class="cart-summary">
        <div class="summary-title">
          <i class="fas fa-receipt"></i> ملخص الطلب
        </div>

        <div class="free-shipping-bar">
          <div class="free-shipping-fill" style="width:${progressPercent}%"></div>
        </div>
        <div class="free-shipping-text">${freeShippingMsg}</div>

        <div class="summary-row">
          <span><i class="fas fa-box-open"></i> عدد المنتجات</span>
          <span class="val">${cart.reduce((s, i) => s + i.qty, 0)} قطعة</span>
        </div>
        <div class="summary-row">
          <span><i class="fas fa-calculator"></i> المجموع الفرعي</span>
          <span class="val">${subtotal} درهم</span>
        </div>
        <div class="summary-row">
          <span><i class="fas fa-truck"></i> التوصيل</span>
          <span class="val">${shipping === 0 ? '<i class="fas fa-gift"></i> مجاني' : shipping + ' درهم'}</span>
        </div>
        <div class="summary-row total">
          <span><i class="fas fa-coins"></i> الإجمالي</span>
          <span class="val">${total} درهم</span>
        </div>

        <button class="checkout-btn" onclick="openCheckoutModal()">
          <i class="fas fa-lock"></i> إتمام الطلب بأمان
        </button>
      </div>
    </div>
    ${upsellHTML}`;
}
