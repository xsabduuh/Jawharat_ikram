/* ════════════════════════════════════════════
   cart.js — جوهرة اكرام
   إدارة السلة + التخزين المحلي
════════════════════════════════════════════ */
(function () {
  'use strict';

  const FREE_SHIPPING_THRESHOLD = 300;
  const SHIPPING_COST           = 20;
  const STORAGE_KEY             = 'warda_cart_v2';

  /* ─── تحميل السلة من localStorage ─── */
  window.cart = (function () {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  })();

  /* ─── حفظ السلة ─── */
  window.saveCart = function () {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  };

  /* ─── مسح السلة ─── */
  window.clearCart = function () {
    cart.length = 0;
    saveCart();
    updateCartBadge();
  };

  /* ─── تحديث badge العداد ─── */
  window.updateCartBadge = function () {
    const badge = document.getElementById('cart-count');
    if (!badge) return;
    const total = cart.reduce((s, i) => s + i.qty, 0);
    badge.textContent = total;
    badge.classList.remove('bump');
    void badge.offsetWidth;
    if (total > 0) badge.classList.add('bump');
  };

  /* ─── حساب الإجماليات ─── */
  window.calculateTotals = function () {
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const shipping  = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const total     = subtotal + shipping;
    return { subtotal, shipping, total };
  };

  /* ─── إضافة منتج ─── */
  window.addToCart = function (id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    const existing = cart.find(i => i.id === id);
    if (existing) {
      existing.qty++;
    } else {
      cart.push({ id: p.id, name: p.name, price: p.price, img: p.img, qty: 1 });
    }
    saveCart();
    updateCartBadge();
    showToast('<i class="fas fa-check" style="margin-left:6px"></i> تمت الإضافة إلى السلة: ' + p.name);
  };

  /* ─── تغيير الكمية ─── */
  window.changeQty = function (id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      const idx = cart.indexOf(item);
      cart.splice(idx, 1);
    }
    saveCart();
    updateCartBadge();
    renderCart();
  };

  /* ─── حذف عنصر ─── */
  window.removeFromCart = function (id) {
    const idx = cart.findIndex(i => i.id === id);
    if (idx > -1) cart.splice(idx, 1);
    saveCart();
    updateCartBadge();
    renderCart();
  };

  /* ─── عرض السلة ─── */
  window.renderCart = function () {
    const wrap = document.getElementById('cart-content');
    if (!wrap) return;

    if (!cart.length) {
      wrap.innerHTML = `
        <div class="empty-cart">
          <i class="fas fa-shopping-bag" style="font-size:60px;color:var(--pink);margin-bottom:20px" aria-hidden="true"></i>
          <h3>سلتكِ فارغة حالياً</h3>
          <p>أضيفي منتجاتكِ المفضلة وابدئي التسوق</p>
          <button class="btn-primary" onclick="navigate('products')">
            <i class="fas fa-store" aria-hidden="true"></i> تصفحي المتجر
          </button>
        </div>`;
      return;
    }

    const { subtotal, shipping, total } = calculateTotals();
    const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
    const pct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

    wrap.innerHTML = `
      <div class="cart-wrap">
        <div class="cart-items-list" role="list" aria-label="عناصر السلة">
          ${cart.map(item => `
          <div class="cart-item" role="listitem">
            <div class="cart-item-img">
              <img src="${item.img}" alt="${item.name}" width="80" height="100"
                onerror="this.parentElement.style.background='var(--pink-soft)';this.remove()" />
            </div>
            <div class="cart-item-info">
              <div class="cart-item-name">${item.name}</div>
              <div class="cart-item-price">${item.price} درهم</div>
              <div class="qty-ctrl" role="group" aria-label="كمية ${item.name}">
                <button class="qty-btn" onclick="changeQty(${item.id},-1)"
                  aria-label="تقليل الكمية">−</button>
                <span class="qty-num" aria-live="polite">${item.qty}</span>
                <button class="qty-btn" onclick="changeQty(${item.id},1)"
                  aria-label="زيادة الكمية">+</button>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
              <div style="font-size:15px;font-weight:800;color:var(--text)">${item.price * item.qty}</div>
              <div style="font-size:11px;color:var(--text-muted)">درهم</div>
              <button class="remove-btn" onclick="removeFromCart(${item.id})"
                aria-label="حذف ${item.name} من السلة">
                <i class="fas fa-trash-alt" aria-hidden="true"></i>
              </button>
            </div>
          </div>`).join('')}
        </div>

        <aside class="cart-summary" aria-label="ملخص الطلب">
          <div class="summary-title">
            <i class="fas fa-receipt" aria-hidden="true"></i> ملخص الطلب
          </div>

          ${remaining > 0 ? `
          <div class="free-shipping-bar" role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100" aria-label="التقدم نحو الشحن المجاني">
            <div class="free-shipping-fill" style="width:${pct}%"></div>
          </div>
          <div class="free-shipping-text">
            <i class="fas fa-truck" aria-hidden="true"></i>
            أضيفي ${remaining} درهم للشحن المجاني!
          </div>
          ` : `
          <div class="free-shipping-text" style="color:#6dbb8a">
            <i class="fas fa-check-circle" aria-hidden="true"></i> تهانينا! الشحن مجاني لهذا الطلب
          </div>`}

          <div class="summary-row">
            <span>المجموع الجزئي</span>
            <span class="val">${subtotal} درهم</span>
          </div>
          <div class="summary-row">
            <span>الشحن</span>
            <span class="val" style="${shipping===0 ? 'color:#6dbb8a' : ''}">
              ${shipping === 0
                ? '<i class="fas fa-gift" aria-hidden="true" style="margin-left:4px"></i> مجاني'
                : shipping + ' درهم'}
            </span>
          </div>
          <div class="summary-row total">
            <span>الإجمالي</span>
            <span class="val" style="color:var(--pink-deep)">${total} درهم</span>
          </div>

          <button class="checkout-btn" onclick="openCheckoutModal()"
            aria-label="إتمام الطلب عبر واتساب">
            <i class="fab fa-whatsapp" aria-hidden="true"></i> إتمام الطلب
          </button>

          <button class="btn-outline" style="width:100%;margin-top:10px;text-align:center;justify-content:center"
            onclick="navigate('products')" aria-label="مواصلة التسوق">
            <i class="fas fa-arrow-right" aria-hidden="true"></i> مواصلة التسوق
          </button>
        </aside>
      </div>`;
  };

  /* ─── تهيئة عند التحميل ─── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateCartBadge);
  } else {
    updateCartBadge();
  }

})();