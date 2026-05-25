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
      qty: 1
    });
  }
  saveCart();
  updateCartBadge();
  if (typeof showToast === 'function') {
    showToast(`تمت إضافة "${product.name}" للسلة`);
  }
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  updateCartBadge();
  renderCart();
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
  const shipping = subtotal > 500 ? 0 : 35;
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

  wrap.innerHTML = `
    <div class="cart-wrap">
      <div class="cart-items-list">
        ${cart.map(item => `
          <div class="cart-item">
            <div class="cart-item-img">
              <img src="${item.img}" alt="${item.name}" />
            </div>
            <div class="cart-item-info">
              <div class="cart-item-name">${item.name}</div>
              <div class="cart-item-price">${item.price} درهم</div>
              <div class="qty-ctrl">
                <button class="qty-btn" onclick="updateQty(${item.id}, -1)">−</button>
                <span class="qty-num">${item.qty}</span>
                <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
              </div>
            </div>
            <button class="remove-btn" onclick="removeFromCart(${item.id})">حذف</button>
          </div>
        `).join('')}
      </div>

      <div class="cart-summary">
        <div class="summary-title">ملخص الطلب</div>
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
        ${shipping > 0 ? `<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">اطلبي بأكثر من 500 درهم للحصول على توصيل مجاني</div>` : ''}
        <div class="summary-row total">
          <span>الإجمالي</span>
          <span class="val">${total} درهم</span>
        </div>
        <button class="checkout-btn" onclick="checkout()">
          إتمام الطلب
        </button>
      </div>
    </div>`;
}

function checkout() {
  const { subtotal, shipping, total } = calculateTotals();

  let message = `مرحباً، أريد تأكيد الطلبية التالية من متجر جوهرة اكرام:%0A%0A`;
  cart.forEach((item, idx) => {
    message += `${idx+1}- ${item.name} (الكمية: ${item.qty}) - ${item.price * item.qty} درهم%0A`;
  });
  message += `%0Aالمجموع الفرعي: ${subtotal} درهم`;
  message += `%0Aالتوصيل: ${shipping === 0 ? 'مجاني' : shipping + ' درهم'}`;
  message += `%0Aالإجمالي: ${total} درهم`;
  message += `%0A%0Aالاسم: (يرجى كتابته)`;
  message += `%0Aالهاتف: (يرجى كتابته)`;
  message += `%0Aالمدينة: (يرجى كتابته)`;

  const whatsappUrl = `https://wa.me/${window.whatsappNumber}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
}