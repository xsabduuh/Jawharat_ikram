/* ════════════════════════════════════════════
   cart.js — جوهرة اكرام
   إدارة السلة + التخزين المحلي
════════════════════════════════════════════ */
(function () {
  'use strict';

  const FREE_SHIPPING_THRESHOLD = 300;
  const SHIPPING_COST           = 30;
  const STORAGE_KEY             = 'warda_cart';

  /* ─── تحميل السلة من localStorage ─── */
  window.cart = (function () {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  })();

  /* ─── حفظ السلة ─── */
  window.saveCart = function () {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    updateCartBadge();
  };

  /* ─── مسح السلة ─── */
  window.clearCart = function () {
    cart.length = 0;
    saveCart();
  };

  /* ─── تحديث عداد السلة ─── */
  window.updateCartBadge = function () {
    const total = cart.reduce(function (s, i) { return s + i.qty; }, 0);
    document.querySelectorAll('.cart-count').forEach(function (el) { el.textContent = total; });
  };

  /* ─── حساب الإجماليات ─── */
  window.calculateTotals = function () {
    const subtotal = cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
    const shipping  = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const total     = subtotal + shipping;
    return { subtotal, shipping, total };
  };

  /* ─── إضافة منتج (size اختياري)
       منتجات بلا مقاسات أو بمقاس "One Size" → size = null
       نفس المنتج + نفس المقاس → تزيد الكمية
       نفس المنتج + مقاس مختلف → إدخال جديد ─── */
  window.addToCart = function (id, size) {
    const p = products.find(function (x) { return x.id === id; });
    if (!p) return;
    const sizeKey  = size || null;
    const existing = cart.find(function (i) { return i.id === id && i.selectedSize === sizeKey; });
    if (existing) {
      existing.qty++;
    } else {
      cart.push({ id: p.id, name: p.name, price: p.price, img: p.img, category: p.category, qty: 1, selectedSize: sizeKey });
    }
    saveCart();
    const sizeLabel = size ? ' — ' + size : '';
    showToast('<i class="fas fa-check" style="margin-left:6px"></i> تمت الإضافة: ' + p.name + sizeLabel);
  };

  /* ─── حذف عنصر بالمؤشر (index) ─── */
  window.removeCartItem = function (idx) {
    cart.splice(idx, 1);
    saveCart();
    showToast('<i class="fas fa-trash-alt" style="margin-left:6px"></i> تمت إزالة المنتج من السلة');
    const page = document.getElementById('page-cart');
    if (page && page.classList.contains('active')) window.renderCart();
  };

  /* ─── تغيير الكمية بالمؤشر (index) ─── */
  window.updateCartItemQty = function (idx, delta) {
    if (!cart[idx]) return;
    cart[idx].qty += delta;
    if (cart[idx].qty <= 0) {
      window.removeCartItem(idx);
    } else {
      saveCart();
      window.renderCart();
    }
  };

  /* ─── عرض السلة ─── */
  window.renderCart = function () {
    const wrap = document.getElementById('cart-content');
    if (!wrap) return;

    if (!cart.length) {
      wrap.innerHTML =
        '<div class="empty-cart">' +
          '<i class="fas fa-shopping-bag" style="font-size:52px;color:var(--pink);display:block;margin-bottom:16px" aria-hidden="true"></i>' +
          '<h3>سلة التسوق فارغة</h3>' +
          '<p>أضيفي بعض المنتجات الرائعة!</p>' +
          '<button class="btn-primary" onclick="navigate(\'products\')">تسوقي الآن</button>' +
        '</div>';
      return;
    }

    const { subtotal, shipping, total } = calculateTotals();
    const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
    const pct       = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

    const itemsHtml = cart.map(function (item, idx) {
      const sizeTag = item.selectedSize
        ? '<div><span class="cart-item-size-tag"><i class="fas fa-ruler-combined" aria-hidden="true"></i> المقاس: ' + item.selectedSize + '</span></div>'
        : '';
      return (
        '<div class="cart-item" role="listitem">' +
          '<div class="cart-item-img">' +
            '<img src="' + item.img + '" alt="' + item.name + '" width="80" height="100" ' +
              'onerror="this.parentElement.style.background=\'var(--pink-soft)\';this.remove()" />' +
          '</div>' +
          '<div class="cart-item-info">' +
            '<div class="cart-item-name">' + item.name + '</div>' +
            sizeTag +
            '<div class="cart-item-price">' + item.price + ' درهم</div>' +
            '<div class="qty-ctrl" role="group" aria-label="كمية ' + item.name + '">' +
              '<button class="qty-btn" onclick="updateCartItemQty(' + idx + ',-1)" aria-label="تقليل الكمية">-</button>' +
              '<span class="qty-num" aria-live="polite">' + item.qty + '</span>' +
              '<button class="qty-btn" onclick="updateCartItemQty(' + idx + ',1)" aria-label="زيادة الكمية">+</button>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;flex-direction:column;align-items:center;gap:8px">' +
            '<div style="font-size:15px;font-weight:800;color:var(--text)">' + (item.price * item.qty) + '</div>' +
            '<div style="font-size:11px;color:var(--text-muted)">درهم</div>' +
            '<button class="remove-btn" onclick="removeCartItem(' + idx + ')" aria-label="حذف ' + item.name + ' من السلة">' +
              '<i class="fas fa-trash-alt" aria-hidden="true"></i>' +
            '</button>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    const shippingBarHtml = remaining > 0
      ? '<div class="free-shipping-bar" role="progressbar" aria-valuenow="' + Math.round(pct) + '" aria-valuemin="0" aria-valuemax="100">' +
          '<div class="free-shipping-fill" style="width:' + pct + '%"></div>' +
        '</div>' +
        '<div class="free-shipping-text">' +
          '<i class="fas fa-truck" aria-hidden="true"></i> أضيفي ' + remaining + ' درهم للشحن المجاني!' +
        '</div>'
      : '<div class="free-shipping-text" style="color:#6dbb8a">' +
          '<i class="fas fa-check-circle" aria-hidden="true"></i> تهانينا! الشحن مجاني لهذا الطلب' +
        '</div>';

    const shippingLabel = shipping === 0
      ? '<i class="fas fa-gift" aria-hidden="true" style="margin-left:4px"></i> مجاني'
      : shipping + ' درهم';

    wrap.innerHTML =
      '<div class="cart-wrap">' +
        '<div class="cart-items-list" role="list" aria-label="عناصر السلة">' + itemsHtml + '</div>' +
        '<aside class="cart-summary" aria-label="ملخص الطلب">' +
          '<div class="summary-title"><i class="fas fa-receipt" aria-hidden="true"></i> ملخص الطلب</div>' +
          shippingBarHtml +
          '<div class="summary-row"><span>المجموع الجزئي</span><span class="val">' + subtotal + ' درهم</span></div>' +
          '<div class="summary-row"><span>الشحن</span><span class="val" style="' + (shipping === 0 ? 'color:#6dbb8a' : '') + '">' + shippingLabel + '</span></div>' +
          '<div class="summary-row total"><span>الإجمالي</span><span class="val" style="color:var(--pink-deep)">' + total + ' درهم</span></div>' +
          '<button class="checkout-btn" onclick="openCheckoutModal()" aria-label="إتمام الطلب عبر واتساب">' +
            '<i class="fab fa-whatsapp" aria-hidden="true"></i> إتمام الطلب' +
          '</button>' +
          '<button class="btn-outline" style="width:100%;margin-top:10px;text-align:center;justify-content:center" onclick="navigate(\'products\')" aria-label="مواصلة التسوق">' +
            '<i class="fas fa-arrow-right" aria-hidden="true"></i> مواصلة التسوق' +
          '</button>' +
        '</aside>' +
      '</div>';
  };

  /* ─── تهيئة عند التحميل ─── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateCartBadge);
  } else {
    updateCartBadge();
  }

})();
