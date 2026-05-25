/* ============================
   cart_final.js - سلة التسوق الاحترافية الذكية
   ============================ */

let cart = JSON.parse(localStorage.getItem('warda_cart_v2') || '[]');

function saveCart() {
  localStorage.setItem('warda_cart_v2', JSON.stringify(cart));
}

function updateCartBadge() {
  const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
  const badge = document.getElementById('cart-count');
  if (badge) {
    badge.textContent = totalQty;
    badge.style.transform = 'scale(1.2)';
    setTimeout(() => badge.style.transform = 'scale(1)', 200);
  }
}

function addToCart(id) {
  const product = window.products.find(p => p.id === id);
  if (!product) return;

  const existingItem = cart.find(item => item.id === id);
  if (existingItem) {
    existingItem.qty++;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      img: product.img,
      qty: 1,
      category: product.category
    });
  }

  saveCart();
  updateCartBadge();
  showToast(`تمت إضافة "${product.name}" إلى سلتكِ بنجاح ✨`);
  
  // إذا كان المستخدم في صفحة السلة، أعد الرندرة
  if (window.location.hash === '#cart') renderCart();
}

function updateQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.qty += delta;
  if (item.qty < 1) {
    removeFromCart(id);
  } else {
    saveCart();
    updateCartBadge();
    renderCart();
  }
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  updateCartBadge();
  renderCart();
  showToast('تمت إزالة المنتج من السلة');
}

function calculateTotals() {
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const freeShippingThreshold = 500;
  const shipping = subtotal >= freeShippingThreshold ? 0 : 35;
  const total = subtotal + shipping;
  
  const progress = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const remaining = freeShippingThreshold - subtotal;

  return { subtotal, shipping, total, progress, remaining };
}

function renderCart() {
  const root = document.getElementById('cart-root');
  if (!root) return;

  if (cart.length === 0) {
    root.innerHTML = `
      <div style="text-align: center; padding: 100px 0;">
        <div style="font-size: 80px; margin-bottom: 20px;">🛍️</div>
        <h3 style="font-size: 26px; font-weight: 900; margin-bottom: 15px;">سلتكِ فارغة حالياً</h3>
        <p style="color: var(--text-muted); margin-bottom: 35px;">اكتشفي أحدث صيحات الموضة وأضيفي قطعكِ المفضلة هنا.</p>
        <a href="#shop" class="btn-main" style="display: inline-block; width: auto;">ابدئي التسوق الآن</a>
      </div>
    `;
    return;
  }

  const { subtotal, shipping, total, progress, remaining } = calculateTotals();

  root.innerHTML = `
    <div class="cart-layout">
      <!-- قائمة المنتجات -->
      <div class="cart-items-container">
        ${cart.map(item => `
          <div class="cart-item">
            <img src="${item.img}" class="cart-item-img" alt="${item.name}">
            <div class="cart-item-info">
              <div class="cart-item-title">${item.name}</div>
              <div class="cart-item-price">${item.price} درهم</div>
              <div class="qty-box">
                <button class="qty-btn" onclick="updateQty(${item.id}, -1)">−</button>
                <span class="qty-val">${item.qty}</span>
                <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
              </div>
            </div>
            <button class="btn-remove" onclick="removeFromCart(${item.id})">إزالة</button>
          </div>
        `).join('')}

        <!-- قسم التوصيات الذكي -->
        <div style="margin-top: 50px; padding-top: 30px; border-top: 2px solid var(--pink-soft);">
          <h4 style="font-size: 20px; font-weight: 900; margin-bottom: 25px;">أكملي إطلالتكِ ✨</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            ${getSmartRecommendations().map(p => `
              <div style="display: flex; gap: 15px; align-items: center; background: var(--pink-bg); padding: 15px; border-radius: var(--radius-md);">
                <img src="${p.img}" style="width: 60px; height: 80px; object-fit: cover; border-radius: 8px;">
                <div style="flex: 1;">
                  <div style="font-size: 14px; font-weight: 800; line-height: 1.3; height: 36px; overflow: hidden;">${p.name}</div>
                  <div style="color: var(--pink-primary); font-weight: 800; font-size: 14px; margin-top: 5px;">${p.price} درهم</div>
                  <button onclick="addToCart(${p.id})" style="color: var(--pink-primary); font-size: 12px; font-weight: 800; margin-top: 8px; text-decoration: underline;">+ أضيفي للسلة</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- ملخص الطلب -->
      <div class="summary-box">
        <h3 class="summary-title">ملخص الطلب</h3>
        
        <!-- شريط التوصيل المجاني -->
        <div class="shipping-progress-container">
          <div class="shipping-msg">
            ${shipping === 0 
              ? '🎉 مبروك! حصلتِ على شحن مجاني لطلبكِ' 
              : `بقي لكِ <b>${remaining} درهم</b> للحصول على شحن مجاني`}
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${progress}%"></div>
          </div>
        </div>

        <div class="summary-row">
          <span>المجموع الفرعي</span>
          <span>${subtotal} درهم</span>
        </div>
        <div class="summary-row">
          <span>رسوم التوصيل</span>
          <span>${shipping === 0 ? '<span style="color: #2ecc71">مجاني</span>' : shipping + ' درهم'}</span>
        </div>
        
        <div class="summary-row summary-total">
          <span>الإجمالي النهائي</span>
          <span>${total} درهم</span>
        </div>

        <button class="btn-checkout" onclick="initiateCheckout()">إتمام الطلب عبر واتساب</button>
        
        <div style="margin-top: 25px; display: grid; gap: 15px;">
          <div style="display: flex; gap: 12px; align-items: center; font-size: 13px; color: var(--text-muted);">
            <span style="font-size: 18px;">🚚</span> توصيل سريع لجميع المدن المغربية
          </div>
          <div style="display: flex; gap: 12px; align-items: center; font-size: 13px; color: var(--text-muted);">
            <span style="font-size: 18px;">🛡️</span> الدفع نقداً عند الاستلام (COD)
          </div>
        </div>
      </div>
    </div>
  `;
}

function getSmartRecommendations() {
  const inCartIds = cart.map(item => item.id);
  // اختيار منتجات عشوائية ليست في السلة
  return window.products
    .filter(p => !inCartIds.includes(p.id))
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);
}

function initiateCheckout() {
  const { subtotal, shipping, total } = calculateTotals();
  
  let message = `مرحباً "جوهرة إكرام"، أود تأكيد طلبي من المتجر:%0A%0A`;
  
  cart.forEach((item, index) => {
    message += `📍 *${index + 1}. ${item.name}*%0A`;
    message += `   الكمية: ${item.qty} | السعر: ${item.price * item.qty} درهم%0A%0A`;
  });

  message += `---------------------------%0A`;
  message += `💰 *المجموع الفرعي:* ${subtotal} درهم%0A`;
  message += `🚚 *التوصيل:* ${shipping === 0 ? 'مجاني' : shipping + ' درهم'}%0A`;
  message += `✨ *الإجمالي النهائي:* ${total} درهم%0A`;
  message += `---------------------------%0A%0A`;
  message += `الرجاء تأكيد الطلب لبدء عملية الشحن 🌸`;

  const whatsappUrl = `https://wa.me/${window.whatsappNumber}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
}