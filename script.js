/* =========================================================
   BAKERY ABCs — SHARED APP LOGIC
   Reads business/product data from content.js (loaded first).
   This one file is shared by both pages:
     - index.html (data-page="customer"): browsing, cart,
       checkout, order placement, order tracking
     - staff.html (data-page="staff"): PIN login + order board
   Both pages read/write the SAME order data (see the "Orders"
   section below), so an order placed on the customer page is
   immediately visible to staff, and a status change made by
   staff is what customer tracking reads back.
   ========================================================= */

(function () {
  "use strict";

  // ---------- Storage keys (shared by both pages) ----------
  const STORAGE_ORDERS = "bakeryabc_orders";
  const STORAGE_ORDER_SEQ = "bakeryabc_order_seq";

  // ---------- App state ----------
  // cart: { [productId]: qty }
  let cart = {};

  // ---------- DOM refs (populated on init) ----------
  const el = {};

  document.addEventListener("DOMContentLoaded", bootstrap);

  function bootstrap() {
    const page = document.body.dataset.page;
    if (page === "customer") {
      initCustomerPage();
    } else if (page === "staff") {
      initStaffPage();
    }
  }

  function initCustomerPage() {
    cacheDom();
    renderCategoryNav();
    renderProducts();
    bindGlobalEvents();
    updateCartUI();
    syncHeaderHeight();
    window.addEventListener("resize", syncHeaderHeight);
  }

  // Keeps the sticky category nav pinned exactly under the header,
  // even if the business name/tagline wraps to more lines later.
  function syncHeaderHeight() {
    const header = document.querySelector(".site-header");
    if (!header) return;
    const height = header.getBoundingClientRect().height;
    document.documentElement.style.setProperty("--header-height", `${height}px`);
  }

  function cacheDom() {
    el.categoryNav = document.getElementById("categoryNav");
    el.productSections = document.getElementById("productSections");

    el.cartBtn = document.getElementById("cartBtn");
    el.cartCount = document.getElementById("cartCount");
    el.cartOverlay = document.getElementById("cartOverlay");
    el.cartItems = document.getElementById("cartItems");
    el.cartSubtotal = document.getElementById("cartSubtotal");
    el.cartCheckoutBtn = document.getElementById("cartCheckoutBtn");
    el.closeCartBtn = document.getElementById("closeCartBtn");

    el.mobileCartBar = document.getElementById("mobileCartBar");
    el.mobileCartTotal = document.getElementById("mobileCartTotal");
    el.mobileCartBtn = document.getElementById("mobileCartBtn");

    el.checkoutOverlay = document.getElementById("checkoutOverlay");
    el.checkoutForm = document.getElementById("checkoutForm");
    el.custName = document.getElementById("custName");
    el.custContact = document.getElementById("custContact");
    el.orderType = document.getElementById("orderType");
    el.paymentMethod = document.getElementById("paymentMethod");
    el.checkoutSummary = document.getElementById("checkoutSummary");
    el.closeCheckoutBtn = document.getElementById("closeCheckoutBtn");
    el.backToCartBtn = document.getElementById("backToCartBtn");

    el.confirmationOverlay = document.getElementById("confirmationOverlay");
    el.confirmationOrderNumber = document.getElementById("confirmationOrderNumber");
    el.confirmationStatus = document.getElementById("confirmationStatus");
    el.confirmationCloseBtn = document.getElementById("confirmationCloseBtn");
    el.trackThisOrderBtn = document.getElementById("trackThisOrderBtn");

    el.trackingForm = document.getElementById("trackingForm");
    el.trackingInput = document.getElementById("trackingInput");
    el.trackingResult = document.getElementById("trackingResult");

    el.toast = document.getElementById("toast");
  }

  // =========================================================
  // Rendering: categories & products
  // =========================================================

  function renderCategoryNav() {
    el.categoryNav.innerHTML = CATEGORIES.map(
      (cat, i) =>
        `<button class="category-chip${i === 0 ? " active" : ""}" data-category="${escapeAttr(cat)}">${escapeHtml(cat)}</button>`
    ).join("");

    el.categoryNav.addEventListener("click", (e) => {
      const btn = e.target.closest(".category-chip");
      if (!btn) return;
      el.categoryNav
        .querySelectorAll(".category-chip")
        .forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      const target = document.getElementById(
        "cat-" + slugify(btn.dataset.category)
      );
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  function renderProducts() {
    el.productSections.innerHTML = CATEGORIES.map((cat) => {
      const items = PRODUCTS.filter((p) => p.category === cat);
      if (items.length === 0) return "";
      return `
        <section class="category-section" id="cat-${slugify(cat)}">
          <h2>${escapeHtml(cat)}</h2>
          <div class="product-grid">
            ${items.map(renderProductCard).join("")}
          </div>
        </section>
      `;
    }).join("");

    el.productSections.addEventListener("click", handleProductGridClick);
  }

  function renderProductCard(product) {
    const qty = cart[product.id] || 0;
    return `
      <article class="product-card" data-product-id="${product.id}">
        <div class="product-image">
          <img
            src="${escapeAttr(product.image)}"
            alt="${escapeAttr(product.name)}"
            onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'${escapeAttr(product.icon || "🥖")}' }))"
          />
        </div>
        <div class="product-body">
          <h3>${escapeHtml(product.name)}</h3>
          <p>${escapeHtml(product.description)}</p>
          <div class="product-footer">
            <span class="price">${formatMoney(product.price)}</span>
            <div class="qty-control">
              ${
                qty > 0
                  ? `<div class="qty-stepper">
                      <button type="button" data-action="dec" data-id="${product.id}" aria-label="Decrease quantity">−</button>
                      <span>${qty}</span>
                      <button type="button" data-action="inc" data-id="${product.id}" aria-label="Increase quantity">+</button>
                    </div>`
                  : `<button type="button" class="add-btn" data-action="add" data-id="${product.id}">Add to Cart</button>`
              }
            </div>
          </div>
        </div>
      </article>
    `;
  }

  function handleProductGridClick(e) {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const action = btn.dataset.action;

    if (action === "add" || action === "inc") {
      cart[id] = (cart[id] || 0) + 1;
    } else if (action === "dec") {
      cart[id] = (cart[id] || 0) - 1;
      if (cart[id] <= 0) delete cart[id];
    }

    refreshProductCard(id);
    updateCartUI();
  }

  function refreshProductCard(id) {
    const card = el.productSections.querySelector(
      `.product-card[data-product-id="${id}"]`
    );
    if (!card) return;
    const product = getProduct(id);
    card.outerHTML = renderProductCard(product);
  }

  // =========================================================
  // Cart
  // =========================================================

  function getCartEntries() {
    return Object.keys(cart)
      .map((id) => {
        const product = getProduct(Number(id));
        const qty = cart[id];
        if (!product || qty <= 0) return null;
        return { product, qty, lineTotal: product.price * qty };
      })
      .filter(Boolean);
  }

  function getCartTotal() {
    return getCartEntries().reduce((sum, e) => sum + e.lineTotal, 0);
  }

  function getCartCount() {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  }

  function updateCartUI() {
    const count = getCartCount();
    const total = getCartTotal();

    el.cartCount.textContent = count;
    el.cartCount.classList.toggle("hidden", count === 0);

    el.mobileCartTotal.textContent = `${count} item${count === 1 ? "" : "s"} · ${formatMoney(total)}`;
    el.mobileCartBar.classList.toggle("hidden", count === 0);

    renderCartPanel();
  }

  function renderCartPanel() {
    const entries = getCartEntries();

    if (entries.length === 0) {
      el.cartItems.innerHTML = `<div class="empty-state">Your cart is empty.<br>Add something delicious!</div>`;
      el.cartCheckoutBtn.disabled = true;
    } else {
      el.cartItems.innerHTML = entries
        .map(
          (e) => `
        <div class="cart-item" data-product-id="${e.product.id}">
          <div class="cart-item-thumb">
            <img
              src="${escapeAttr(e.product.image)}"
              alt=""
              onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'${escapeAttr(e.product.icon || "🥖")}' }))"
            />
          </div>
          <div class="cart-item-info">
            <div class="cart-item-top">
              <h4>${escapeHtml(e.product.name)}</h4>
              <button class="remove-link" data-action="remove" data-id="${e.product.id}">Remove</button>
            </div>
            <div class="cart-item-bottom">
              <div class="qty-stepper">
                <button type="button" data-action="dec" data-id="${e.product.id}" aria-label="Decrease quantity">−</button>
                <span>${e.qty}</span>
                <button type="button" data-action="inc" data-id="${e.product.id}" aria-label="Increase quantity">+</button>
              </div>
              <span class="price">${formatMoney(e.lineTotal)}</span>
            </div>
          </div>
        </div>
      `
        )
        .join("");
      el.cartCheckoutBtn.disabled = false;
    }

    el.cartSubtotal.textContent = formatMoney(getCartTotal());
  }

  function handleCartPanelClick(e) {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const action = btn.dataset.action;

    if (action === "inc") {
      cart[id] = (cart[id] || 0) + 1;
    } else if (action === "dec") {
      cart[id] = (cart[id] || 0) - 1;
      if (cart[id] <= 0) delete cart[id];
    } else if (action === "remove") {
      delete cart[id];
    }

    updateCartUI();
    // Keep product grid in sync (steppers reflect current qty when reopened)
    if (getProduct(id)) refreshProductCard(id);
  }

  // =========================================================
  // Panels open / close
  // =========================================================

  function openOverlay(overlayEl) {
    overlayEl.classList.remove("hidden");
  }
  function closeOverlay(overlayEl) {
    overlayEl.classList.add("hidden");
  }

  function bindGlobalEvents() {
    el.cartBtn.addEventListener("click", () => openOverlay(el.cartOverlay));
    el.mobileCartBtn.addEventListener("click", () => openOverlay(el.cartOverlay));
    el.closeCartBtn.addEventListener("click", () => closeOverlay(el.cartOverlay));
    el.cartItems.addEventListener("click", handleCartPanelClick);

    el.cartCheckoutBtn.addEventListener("click", () => {
      if (getCartCount() === 0) return;
      closeOverlay(el.cartOverlay);
      openCheckout();
    });

    el.closeCheckoutBtn.addEventListener("click", () => closeOverlay(el.checkoutOverlay));
    el.backToCartBtn.addEventListener("click", () => {
      closeOverlay(el.checkoutOverlay);
      openOverlay(el.cartOverlay);
    });

    el.checkoutForm.addEventListener("submit", handleCheckoutSubmit);
    el.checkoutForm.addEventListener("input", updateCheckoutSummary);
    el.checkoutForm.addEventListener("change", updateCheckoutSummary);

    el.confirmationCloseBtn.addEventListener("click", () => {
      closeOverlay(el.confirmationOverlay);
    });
    el.trackThisOrderBtn.addEventListener("click", () => {
      const orderNumber = el.trackThisOrderBtn.dataset.orderNumber;
      closeOverlay(el.confirmationOverlay);
      el.trackingInput.value = orderNumber;
      document.getElementById("trackingSection").scrollIntoView({ behavior: "smooth" });
      lookupOrder(orderNumber);
    });

    el.trackingForm.addEventListener("submit", (e) => {
      e.preventDefault();
      lookupOrder(el.trackingInput.value);
    });

    // Close overlays when clicking the dark backdrop itself
    [el.cartOverlay, el.checkoutOverlay, el.confirmationOverlay].forEach((overlay) => {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeOverlay(overlay);
      });
    });
  }

  // =========================================================
  // Checkout
  // =========================================================

  function openCheckout() {
    populateCheckoutOptions();
    updateCheckoutSummary();
    openOverlay(el.checkoutOverlay);
  }

  function populateCheckoutOptions() {
    if (el.orderType.dataset.populated) return;
    el.orderType.innerHTML = BUSINESS_INFO.orderTypes
      .map((t) => `<option value="${escapeAttr(t)}">${escapeHtml(t)}</option>`)
      .join("");
    el.paymentMethod.innerHTML = BUSINESS_INFO.paymentMethods
      .map((p) => `<option value="${escapeAttr(p)}">${escapeHtml(p)}</option>`)
      .join("");
    el.orderType.dataset.populated = "1";
  }

  function updateCheckoutSummary() {
    const entries = getCartEntries();
    const total = getCartTotal();
    el.checkoutSummary.innerHTML = `
      ${entries
        .map(
          (e) => `
        <div class="summary-line">
          <span>${e.qty} × ${escapeHtml(e.product.name)}</span>
          <span>${formatMoney(e.lineTotal)}</span>
        </div>`
        )
        .join("")}
      <div class="summary-line" style="font-weight:700;border-top:1px dashed var(--color-border);margin-top:8px;padding-top:8px;">
        <span>Total</span>
        <span>${formatMoney(total)}</span>
      </div>
    `;
  }

  function setFieldValid(inputEl, valid) {
    const field = inputEl.closest(".field");
    if (field) field.classList.toggle("invalid", !valid);
  }

  function validateCheckoutForm() {
    let valid = true;

    const name = el.custName.value.trim();
    if (name.length < 2) {
      setFieldValid(el.custName, false);
      valid = false;
    } else {
      setFieldValid(el.custName, true);
    }

    // Accept digits, spaces, +, - ; require at least 7 digits total
    const contact = el.custContact.value.trim();
    const digitCount = (contact.match(/\d/g) || []).length;
    const contactPattern = /^[0-9+\-\s]+$/;
    if (digitCount < 7 || !contactPattern.test(contact)) {
      setFieldValid(el.custContact, false);
      valid = false;
    } else {
      setFieldValid(el.custContact, true);
    }

    return valid;
  }

  function handleCheckoutSubmit(e) {
    e.preventDefault();
    if (getCartCount() === 0) {
      showToast("Your cart is empty.");
      return;
    }
    if (!validateCheckoutForm()) {
      showToast("Please check the highlighted fields.");
      return;
    }

    const order = placeOrder({
      name: el.custName.value.trim(),
      contact: el.custContact.value.trim(),
      orderType: el.orderType.value,
      paymentMethod: el.paymentMethod.value
    });

    closeOverlay(el.checkoutOverlay);
    showConfirmation(order);
    resetCheckoutForm();
  }

  function resetCheckoutForm() {
    el.checkoutForm.reset();
    [el.custName, el.custContact].forEach((input) => setFieldValid(input, true));
  }

  // =========================================================
  // Orders (localStorage-backed so Order Tracking survives reloads
  // and a future staff page can read the same data)
  // =========================================================

  function loadOrders() {
    try {
      const raw = localStorage.getItem(STORAGE_ORDERS);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.error("Failed to read orders from storage", err);
      return [];
    }
  }

  function saveOrders(orders) {
    try {
      localStorage.setItem(STORAGE_ORDERS, JSON.stringify(orders));
    } catch (err) {
      console.error("Failed to save orders to storage", err);
    }
  }

  function nextOrderNumber() {
    let seq = 0;
    try {
      seq = parseInt(localStorage.getItem(STORAGE_ORDER_SEQ) || "0", 10) || 0;
    } catch (err) {
      seq = 0;
    }
    seq += 1;
    try {
      localStorage.setItem(STORAGE_ORDER_SEQ, String(seq));
    } catch (err) {
      /* ignore */
    }
    return "#" + String(seq).padStart(3, "0");
  }

  function placeOrder(customer) {
    const entries = getCartEntries();
    const order = {
      orderNumber: nextOrderNumber(),
      customer: {
        name: customer.name,
        contact: customer.contact,
        orderType: customer.orderType,
        paymentMethod: customer.paymentMethod
      },
      items: entries.map((e) => ({
        productId: e.product.id,
        name: e.product.name,
        price: e.product.price,
        qty: e.qty,
        lineTotal: e.lineTotal
      })),
      total: getCartTotal(),
      status: "NEW",
      createdAt: new Date().toISOString()
    };

    const orders = loadOrders();
    orders.push(order);
    saveOrders(orders);

    // Clear cart after a successful order
    cart = {};
    updateCartUI();
    document.querySelectorAll(".product-card").forEach((card) => {
      const id = Number(card.dataset.productId);
      refreshProductCard(id);
    });

    return order;
  }

  function findOrder(orderNumberRaw) {
    const orders = loadOrders();
    const normalized = normalizeOrderNumber(orderNumberRaw);
    return orders.find((o) => normalizeOrderNumber(o.orderNumber) === normalized);
  }

  function normalizeOrderNumber(value) {
    return String(value || "")
      .trim()
      .replace(/^#/, "")
      .replace(/^0+(?=\d)/, "")
      .toLowerCase();
  }

  // =========================================================
  // Confirmation
  // =========================================================

  function showConfirmation(order) {
    el.confirmationOrderNumber.textContent = order.orderNumber;
    el.confirmationStatus.innerHTML = statusPillHtml(order.status);
    el.trackThisOrderBtn.dataset.orderNumber = order.orderNumber;
    openOverlay(el.confirmationOverlay);
  }

  function statusPillHtml(status) {
    return `<span class="status-pill status-${status}">${status}</span>`;
  }

  // =========================================================
  // Order tracking
  // =========================================================

  function lookupOrder(orderNumberRaw) {
    const value = (orderNumberRaw || "").trim();
    if (!value) {
      el.trackingResult.innerHTML = `<p class="not-found">Please enter an order number.</p>`;
      return;
    }

    const order = findOrder(value);
    if (!order) {
      el.trackingResult.innerHTML = `<p class="not-found">No order found for "${escapeHtml(value)}". Please check your order number and try again.</p>`;
      return;
    }

    const currentIndex = ORDER_STATUSES.indexOf(order.status);

    el.trackingResult.innerHTML = `
      <div class="order-summary-box">
        <div class="summary-line"><span>Order</span><span><strong>${escapeHtml(order.orderNumber)}</strong></span></div>
        <div class="summary-line"><span>Placed</span><span>${formatDate(order.createdAt)}</span></div>
        <div class="summary-line"><span>Name</span><span>${escapeHtml(order.customer.name)}</span></div>
        <div class="summary-line"><span>Order type</span><span>${escapeHtml(order.customer.orderType)}</span></div>
        <div class="summary-line"><span>Total</span><span>${formatMoney(order.total)}</span></div>
      </div>
      <div class="tracking-progress">
        ${ORDER_STATUSES.map((status, i) => {
          const cls = i < currentIndex ? "done" : i === currentIndex ? "current" : "";
          const mark = i < currentIndex ? "✓" : i + 1;
          return `<div class="progress-step ${cls}"><span class="dot">${mark}</span><span>${status}</span></div>`;
        }).join("")}
      </div>
    `;
  }

  // =========================================================
  // STAFF PAGE — PIN login + Kanban order board
  // Reuses the exact same loadOrders/saveOrders/ORDER_STATUSES
  // as the customer page above, so there is one source of truth.
  // =========================================================

  const STAFF_PIN = "1234"; // simple workshop/demo PIN — change here only
  const staffEl = {};
  let staffLoggedIn = false;

  function initStaffPage() {
    cacheStaffDom();
    bindStaffEvents();
    showStaffLogin();
  }

  function cacheStaffDom() {
    staffEl.loginScreen = document.getElementById("staffLoginScreen");
    staffEl.loginForm = document.getElementById("staffLoginForm");
    staffEl.pinInput = document.getElementById("staffPinInput");
    staffEl.loginError = document.getElementById("staffLoginError");
    staffEl.boardScreen = document.getElementById("staffBoardScreen");
    staffEl.board = document.getElementById("staffBoard");
    staffEl.logoutBtn = document.getElementById("staffLogoutBtn");
    staffEl.refreshBtn = document.getElementById("staffRefreshBtn");
    staffEl.emptyNotice = document.getElementById("staffEmptyNotice");
  }

  function bindStaffEvents() {
    staffEl.loginForm.addEventListener("submit", handleStaffLogin);
    staffEl.logoutBtn.addEventListener("click", handleStaffLogout);
    staffEl.refreshBtn.addEventListener("click", renderStaffBoard);
    staffEl.board.addEventListener("click", handleBoardClick);

    // Pick up new/updated orders the instant the customer page
    // (in another tab) writes to localStorage.
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_ORDERS && staffLoggedIn) renderStaffBoard();
    });
    // Fallback poll — covers browsers/setups where the 'storage'
    // event doesn't fire (e.g. same-tab testing tools).
    setInterval(() => {
      if (staffLoggedIn) renderStaffBoard();
    }, 4000);
  }

  function showStaffLogin() {
    staffLoggedIn = false;
    staffEl.boardScreen.classList.add("hidden");
    staffEl.loginScreen.classList.remove("hidden");
    staffEl.loginForm.reset();
    staffEl.loginError.classList.add("hidden");
    staffEl.pinInput.focus();
  }

  function handleStaffLogin(e) {
    e.preventDefault();
    const entered = staffEl.pinInput.value.trim();
    if (entered === STAFF_PIN) {
      staffLoggedIn = true;
      staffEl.loginError.classList.add("hidden");
      staffEl.loginScreen.classList.add("hidden");
      staffEl.boardScreen.classList.remove("hidden");
      renderStaffBoard();
    } else {
      staffLoggedIn = false;
      staffEl.loginError.classList.remove("hidden");
      staffEl.loginForm.reset();
      staffEl.pinInput.focus();
    }
  }

  function handleStaffLogout() {
    showStaffLogin();
  }

  function renderStaffBoard() {
    const orders = loadOrders();
    staffEl.emptyNotice.classList.toggle("hidden", orders.length > 0);

    staffEl.board.innerHTML = ORDER_STATUSES.map((status) => {
      const columnOrders = orders
        .filter((o) => o.status === status)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return `
        <div class="board-column">
          <div class="board-column-header status-${status}">
            <span>${status}</span>
            <span class="column-count">${columnOrders.length}</span>
          </div>
          <div class="board-column-body">
            ${
              columnOrders.length === 0
                ? `<p class="column-empty">No orders</p>`
                : columnOrders.map(renderOrderCard).join("")
            }
          </div>
        </div>
      `;
    }).join("");
  }

  function renderOrderCard(order) {
    const nextStatus = getNextStatus(order.status);
    const itemsHtml = order.items
      .map((it) => `<li>${it.qty} &times; ${escapeHtml(it.name)}</li>`)
      .join("");

    return `
      <div class="order-card">
        <div class="order-card-top">
          <strong>${escapeHtml(order.orderNumber)}</strong>
          <span class="order-time">${formatDate(order.createdAt)}</span>
        </div>
        <div class="order-card-customer">
          <div>${escapeHtml(order.customer.name)}</div>
          <div class="muted">${escapeHtml(order.customer.contact)}</div>
        </div>
        <ul class="order-card-items">${itemsHtml}</ul>
        <div class="order-card-bottom">
          <span class="price">${formatMoney(order.total)}</span>
          <span class="muted">${escapeHtml(order.customer.paymentMethod)}</span>
        </div>
        <div class="muted order-card-type">${escapeHtml(order.customer.orderType)}</div>
        ${
          nextStatus
            ? `<button type="button" class="advance-btn" data-order-number="${escapeAttr(order.orderNumber)}" data-next-status="${nextStatus}">
                 Move to ${nextStatus} &rarr;
               </button>`
            : `<div class="completed-note">&#10003; Completed</div>`
        }
      </div>
    `;
  }

  function getNextStatus(current) {
    const idx = ORDER_STATUSES.indexOf(current);
    if (idx === -1 || idx >= ORDER_STATUSES.length - 1) return null;
    return ORDER_STATUSES[idx + 1];
  }

  function handleBoardClick(e) {
    const btn = e.target.closest(".advance-btn");
    if (!btn) return;
    updateOrderStatus(btn.dataset.orderNumber, btn.dataset.nextStatus);
    renderStaffBoard();
  }

  function updateOrderStatus(orderNumber, newStatus) {
    const orders = loadOrders();
    const order = orders.find(
      (o) => normalizeOrderNumber(o.orderNumber) === normalizeOrderNumber(orderNumber)
    );
    if (!order) return;
    order.status = newStatus;
    saveOrders(orders);
  }

  // =========================================================
  // Helpers
  // =========================================================

  function getProduct(id) {
    return PRODUCTS.find((p) => p.id === id);
  }

  function formatMoney(amount) {
    return `${BUSINESS_INFO.currencySymbol} ${amount.toFixed(2)}`;
  }

  function formatDate(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function slugify(str) {
    return String(str).toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, "&quot;");
  }

  let toastTimer = null;
  function showToast(message) {
    el.toast.textContent = message;
    el.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.toast.classList.remove("show"), 2200);
  }
})();
