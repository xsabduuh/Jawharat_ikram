/* ============================
   cart.js - سلة التسوق المتطورة
   ============================ */

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
      stock: product.stock
    });
  }
  saveCart();
  updateCartBadge();
  if (typeof showToast === 'function') {
    showToast(`تمت إضافة "${product.name}" للسلة`);
  }
}

function removeFromCart(id) {
  const itemEl = document.querySelector(`.cart-item[data-id="${id}"]`);
  if (itemEl) {
    itemEl.style.transition = 'opacity 0.3s, transform 0.3s';
    itemEl.style.opacity = '0';
    itemEl.style.transform = 'scale(0.95)';
    setTimeout(() => {
      cart = cart.filter(i => i.id !== id);
      saveCart();
      updateCartBadge();
      renderCart();
    }, 300);
  } else {
    cart = cart.filter(i => i.id !== id);
    saveCart();
    updateCartBadge();
    renderCart();
  }
}

function updateQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart();
  updateCartBadge();
  renderCart();
}

function calculateTotals() {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = subtotal >= 300 ? 0 : 20;  // تغيير: 300 درهم للتوصيل المجاني، وإلا 20 درهم
  const total = subtotal + shipping;
  return { subtotal, shipping, total };
}

function renderCart() {
  const wrap = document.getElementById('cart-content');
  if (!wrap) return;

  if (cart.length === 0) {
    wrap.innerHTML = `
      <div class="empty-cart">
        <h3>السلة فارغة</h3>
        <p>لم تُضيفي أي منتجات بعد. ابدئي التسوق الآن!</p>
        <button class="btn-primary" onclick="navigate('products')">تسوقي الآن</button>
      </div>`;
    return;
  }

  const { subtotal, shipping, total } = calculateTotals();

  // شريط التوصيل المجاني (الهدف 300 درهم)
  const progressPercent = Math.min((subtotal / 300) * 100, 100);
  const remaining = subtotal >= 300 ? 0 : 300 - subtotal;
  const freeShippingMsg = remaining > 0
    ? `بقي لكِ ${remaining} درهم للشحن المجاني`
    : 'لقد حصلتِ على توصيل مجاني!';

  // التوصيات الذكية (Upselling)
  const cartCategories = [...new Set(cart.map(item => {
    const product = window.products.find(p => p.id === item.id);
    return product ? product.category : null;
  }).filter(Boolean))];

  let recommendedProducts = [];
  if (cartCategories.includes('بيجامات') && !cartCategories.includes('معاطف')) {
    recommendedProducts = window.products.filter(p => p.category === 'معاطف' || p.category === 'إكسسوارات').slice(0, 4);
  } else if (cartCategories.includes('جلابيات') && !cartCategories.includes('إكسسوارات')) {
    recommendedProducts = window.products.filter(p => p.category === 'إكسسوارات').slice(0, 4);
  }

  const upsellHTML = recommendedProducts.length ? `
    <div class="upsell-section">
      <div class="section-header">
        <h2>أكملي أناقتكِ</h2>
        <p>قطع مميزة تتناغم مع اختياراتكِ</p>
      </div>
      <div class="products-grid">
        ${recommendedProducts.map(p => {
          const stockBadge = p.stock < 3 ? '<span class="card-badge stock-badge">سارعي! آخر قطع متوفرة</span>' : (p.badge ? `<span class="card-badge">${p.badge}</span>` : '');
          return `
            <div class="product-card" onclick="navigate('detail', ${p.id})">
              <div class="card-img-wrap">
                <img src="${p.img}" alt="${p.name}" loading="lazy" />
                ${stockBadge}
              </div>
              <div class="card-body">
                <div class="card-category">${p.category}</div>
                <div class="card-name">${p.name}</div>
                <div class="card-footer">
                  <div class="card-price">${p.price} <span>درهم</span></div>
                  <button class="add-to-cart-btn" onclick="event.stopPropagation(); handleAddToCart(this, ${p.id})">+ السلة</button>
                </div>
              </div>
            </div>`;
        }).join('')}
      </div>
    </div>` : '';

  wrap.innerHTML = `
    <div class="cart-wrap">
      <div class="cart-items-list">
        ${cart.map(item => {
          const product = window.products.find(p => p.id === item.id);
          const stockWarning = product && product.stock < 3 ? '<span class="stock-badge" style="font-size:11px;color:#e05050;font-weight:700;display:block;margin-top:4px;">سارعي! آخر قطع متوفرة</span>' : '';
          return `
            <div class="cart-item" data-id="${item.id}">
              <div class="cart-item-img">
                <img src="${item.img}" alt="${item.name}" loading="lazy" />
              </div>
              <div class="cart-item-info">
                <div class="cart-item-name">${item.name}${stockWarning}</div>
                <div class="cart-item-price">${item.price} درهم</div>
                <div class="qty-ctrl">
                  <button class="qty-btn" onclick="updateQty(${item.id}, -1)">−</button>
                  <span class="qty-num">${item.qty}</span>
                  <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
                </div>
              </div>
              <button class="remove-btn" onclick="removeFromCart(${item.id})">حذف</button>
            </div>`;
        }).join('')}
      </div>

      <div class="cart-summary">
        <div class="summary-title">ملخص الطلب</div>
        <div class="free-shipping-bar">
          <div class="free-shipping-fill" style="width:${progressPercent}%"></div>
        </div>
        <div class="free-shipping-text">${freeShippingMsg}</div>
        <div class="summary-row">
          <span>عدد المنتجات</span>
          <span class="val">${cart.reduce((s,i)=>s+i.qty,0)} قطعة</span>
        </div>
        <div class="summary-row">
          <span>المجموع الفرعي</span>
          <span class="val">${subtotal} درهم</span>
        </div>
        <div class="summary-row">
          <span>التوصيل</span>
          <span class="val">${shipping === 0 ? 'مجاني' : shipping + ' درهم'}</span>
        </div>
        ${shipping > 0 ? `<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">أضيفي ${300 - subtotal} درهم أخرى للحصول على توصيل مجاني</div>` : ''}
        <div class="summary-row total">
          <span>الإجمالي</span>
          <span class="val">${total} درهم</span>
        </div>
        <button class="checkout-btn" onclick="openCheckoutModal()">
          إتمام الطلب
        </button>
      </div>
    </div>
    ${upsellHTML}`;
}