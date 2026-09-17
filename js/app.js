// ============================================
// ZELVRA – Core Application Logic
// ============================================

let allProducts = [];
let cart = JSON.parse(localStorage.getItem("aurel_cart") || "[]");

/** Normalize sheet category labels → internal slugs used on homepage & shop */
function normalizeCategory(raw) {
  let c = String(raw || "polos")
    .toLowerCase()
    .trim()
    .replace(/[–—]/g, "-")
    .replace(/[_/]+/g, " ")
    .replace(/\s+/g, "");
  // remove common noise
  c = c.replace(/&/g, "and");
  if (c === "casual" || c === "casualwear" || c === "bottomwear" || c === "trousers" || c === "pants" || c === "bottoms") return "bottoms";
  if (c === "t-shirts" || c === "tshirts" || c === "tees" || c === "tee" || c === "tshirt") return "tshirts";
  if (c === "polo" || c === "polos" || c === "polo's") return "polos";
  if (
    c === "2pcs" || c === "2pc" || c === "2piece" || c === "2pieces" ||
    c === "2-piece" || c === "2-pcs" || c === "twopiece" || c === "twopieces" ||
    c === "packs" || c === "pack" || c === "valuepacks" || c === "sets" || c === "2pcssets"
  ) return "2pcs";
  if (c === "football" || c === "footballjersey" || c === "footballjerseys" || c === "jersey" || c === "jerseys") return "jerseys";
  if (c === "shoe" || c === "shoes" || c === "sneakers" || c === "footwear") return "shoes";
  if (c === "accessory" || c === "accessories" || c === "menaccessories" || c === "accessorie") return "accessories";
  return c || "polos";
}


// ---------- CART HELPERS ----------
function saveCart() {
  localStorage.setItem("aurel_cart", JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll(".cart-count").forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? "flex" : "none";
  });
}

function addToCart(productId, size = "M", qty = 1) {
  const product = allProducts.find(p => String(p.id) === String(productId));
  if (!product) return alert("Product not found");

  const existing = cart.find(i => i.id === productId && i.size === size);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: productId,
      name: product.name,
      price: Number(product.price),
      image: primaryImage(product),
      size,
      qty
    });
  }
  saveCart();
  showToast(`${product.name.split("—")[0].trim()} added to cart`);
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  if (typeof renderCart === "function") renderCart();
}

function updateQty(index, delta) {
  cart[index].qty += delta;
  if (cart[index].qty < 1) cart[index].qty = 1;
  saveCart();
  if (typeof renderCart === "function") renderCart();
}

function getCartTotal() {
  return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function getShipping() {
  const total = getCartTotal();
  return total >= CONFIG.FREE_SHIPPING_THRESHOLD ? 0 : CONFIG.SHIPPING_COST;
}

// ---------- TOAST ----------
function showToast(msg) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2800);
}


// Parse one cell with multiple image links separated by comma
function parseImages(val) {
  const fallback = ["https://via.placeholder.com/600x750?text=No+Image"];
  if (!val) return fallback.slice();
  let list = [];
  if (Array.isArray(val)) {
    list = val.map(String).map(s => s.trim()).filter(Boolean);
  } else {
    list = String(val)
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
  }
  // Accept http(s) URLs; also fix protocol-relative
  list = list.map(s => (s.startsWith("//") ? "https:" + s : s)).filter(s => /^https?:\/\//i.test(s));
  return list.length ? list : fallback.slice();
}

function primaryImage(p) {
  if (p.images && p.images.length) return p.images[0];
  if (p.image) return parseImages(p.image)[0];
  return "https://via.placeholder.com/600x750?text=No+Image";
}

// ---------- FORMAT ----------
function formatPrice(n) {
  return CONFIG.CURRENCY + " " + Number(n).toLocaleString("en-PK");
}

function stars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  let html = "";
  for (let i = 0; i < full; i++) html += "★";
  if (half) html += "½";
  for (let i = full + half; i < 5; i++) html += "☆";
  return html;
}

// ---------- PRODUCT CARD HTML ----------
function escapeAttr(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function productCardHTML(p) {
  if (!p || !p.id) return "";
  let sizes = String(p.sizes || "S,M,L,XL").split(",").map(s => s.trim()).filter(Boolean);
  if (!sizes.length) sizes = ["S", "M", "L", "XL"];
  const displayName = p.name || "Untitled";
  const img = primaryImage(p);
  const id = String(p.id).replace(/'/g, "");
  const rating = Number(p.rating);
  const ratingSafe = Number.isFinite(rating) ? rating : 4.5;
  return `
    <article class="product-card" data-id="${escapeAttr(id)}">
      <div class="product-image-wrap">
        ${p.badge ? `<span class="badge">${escapeAttr(p.badge)}</span>` : ""}
        <a href="product.html?id=${encodeURIComponent(id)}">
          <img src="${escapeAttr(img)}" alt="${escapeAttr(displayName)}" loading="lazy" />
        </a>
        <button type="button" class="quick-add" data-quick-add="${escapeAttr(id)}">Quick Add</button>
      </div>
      <div class="product-info">
        <a href="product.html?id=${encodeURIComponent(id)}" class="product-name">${escapeAttr(displayName)}</a>
        <div class="product-price">${formatPrice(p.price)}</div>
        <div class="product-meta">
          <span class="rating">${stars(ratingSafe)} <small>(${Number(p.reviews) || 0})</small></span>
        </div>
        <div class="size-pills">
          ${sizes.map(s => `<button type="button" class="size-pill" data-add-id="${escapeAttr(id)}" data-add-size="${escapeAttr(s)}">${escapeAttr(s)}</button>`).join("")}
        </div>
        <div class="card-actions">
          <a href="product.html?id=${encodeURIComponent(id)}" class="btn btn-buy">Buy Now</a>
          <button type="button" class="btn btn-cart-sm" data-add-id="${escapeAttr(id)}" data-add-size="M">Add to Cart</button>
        </div>
      </div>
    </article>
  `;
}

/** Bind cart buttons after injecting product cards (avoids inline onclick breakage) */
function bindProductCardActions(root) {
  const scope = root || document;
  scope.querySelectorAll("[data-quick-add]").forEach((btn) => {
    btn.onclick = (e) => {
      e.preventDefault();
      openQuickAdd(btn.getAttribute("data-quick-add"));
    };
  });
  scope.querySelectorAll("[data-add-id]").forEach((btn) => {
    btn.onclick = (e) => {
      e.preventDefault();
      addToCart(btn.getAttribute("data-add-id"), btn.getAttribute("data-add-size") || "M");
    };
  });
}

// ---------- SKELETON PLACEHOLDERS (avoid a blank "loading" grid) ----------
function skeletonCardHTML() {
  return `
    <article class="product-card skeleton-card">
      <div class="skeleton-block"></div>
      <div class="sk-lines">
        <div class="skeleton-line" style="width:80%;margin-bottom:8px"></div>
        <div class="skeleton-line" style="width:40%"></div>
      </div>
    </article>`;
}

function paintSkeletonGrids(count = 8) {
  document.querySelectorAll(".product-grid").forEach((grid) => {
    if (!grid.children.length) {
      grid.innerHTML = skeletonCardHTML().repeat(grid.id === "shop-grid" ? count : 4);
    }
  });
}

// ---------- LOAD PRODUCTS (cache-first for instant page paint) ----------
const PRODUCTS_CACHE_KEY = "zelvra_products_cache_v1";
const PRODUCTS_CACHE_MAX_AGE = 5 * 60 * 1000; // 5 min

function readProductsCache() {
  try {
    const raw = localStorage.getItem(PRODUCTS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.products) || !parsed.products.length) return null;
    return parsed;
  } catch (e) {
    return null;
  }
}

function writeProductsCache(products) {
  try {
    localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify({ products, ts: Date.now() }));
  } catch (e) {
    /* storage full/unavailable — ignore, not critical */
  }
}

async function loadProducts() {
  const applyRows = (data) => {
    const rows = Array.isArray(data) ? data : [];
    allProducts = rows.map((row, idx) => {
      const images = parseImages(row.image || row.Image || row.images || row.img || "");
      return {
        id: String(row.id || row.ID || idx + 1).trim(),
        name: String(row.name || row.Name || row.title || "Untitled").trim() || "Untitled",
        category: normalizeCategory(row.category || row.Category || "polos"),
        price: Number(row.price || row.Price || 0) || 0,
        image: images[0],
        images: images,
        description: String(row.description || row.Description || ""),
        sizes: String(row.sizes || row.Sizes || row.size || "S,M,L,XL") || "S,M,L,XL",
        rating: Number(row.rating || row.Rating || 4.5) || 4.5,
        reviews: Number(row.reviews || row.Reviews || 0) || 0,
        badge: String(row.badge || row.Badge || ""),
        stock: Number(row.stock || row.Stock || 99) || 0
      };
    }).filter((p) => p.id);
    return allProducts;
  };

  const useFallback = () => {
    try {
      if (typeof SAMPLE_PRODUCTS !== "undefined" && SAMPLE_PRODUCTS && SAMPLE_PRODUCTS.length) {
        allProducts = normalizeSampleProducts(SAMPLE_PRODUCTS);
        console.warn("Using fallback sample products:", allProducts.length);
      }
    } catch (e) {
      console.error(e);
      allProducts = allProducts || [];
    }
    return allProducts;
  };

  const fetchFresh = async () => {
    if (typeof getProductsUrl !== "function" || typeof CONFIG === "undefined") {
      console.warn("CONFIG missing — fallback products");
      return useFallback();
    }
    const url = getProductsUrl();
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    // Short timeout — a cached or fallback render is already on screen,
    // so we don't need to make the visitor wait long for a network answer.
    const timer = controller ? setTimeout(() => controller.abort(), 6000) : null;
    let res;
    try {
      res = await fetch(url, controller ? { signal: controller.signal } : undefined);
    } finally {
      if (timer) clearTimeout(timer);
    }
    if (!res.ok) throw new Error("SheetDB products error " + res.status);
    const data = await res.json();
    applyRows(data);
    if (!allProducts.length) return useFallback();
    writeProductsCache(allProducts);
    return allProducts;
  };

  // 1) Instant paint: use a recent cached copy if we have one, no network wait.
  const cached = readProductsCache();
  const cacheIsFresh = cached && (Date.now() - cached.ts) < PRODUCTS_CACHE_MAX_AGE;
  if (cached) {
    allProducts = cached.products;
  }

  // 2) If the cache is missing or stale, fetch now and wait for it (first
  //    visit / new browser). If the cache is fresh, render from it
  //    immediately and refresh quietly in the background.
  if (!cached) {
    try {
      await fetchFresh();
    } catch (err) {
      console.error("Failed to load products from SheetDB:", err);
      if (!allProducts.length) useFallback();
    }
  } else if (!cacheIsFresh) {
    fetchFresh()
      .then(() => { try { refreshRenderedGrids(); } catch (e) {} })
      .catch((err) => console.error("Background product refresh failed:", err));
  }

  return allProducts;
}

/** Re-render whichever product grids exist on the current page — used after a
 *  silent background refresh so a stale cache never stays on screen for long. */
function refreshRenderedGrids() {
  if (document.getElementById("polos-grid") || document.getElementById("tees-grid")) {
    try { renderHomeGrids(); } catch (e) {}
  }
  if (document.getElementById("shop-grid")) {
    try {
      const params = new URLSearchParams(location.search);
      const cat = params.get("category");
      const filter = cat ? ((p) => p.category === cat) : null;
      renderProductGrid("#shop-grid", filter);
    } catch (e) {}
  }
}

function normalizeSampleProducts(list) {
  return list.map(p => {
    const images = parseImages(p.image || p.images || "");
    return { ...p, image: images[0], images };
  });
}

// ---------- RENDER GRIDS ----------
function renderProductGrid(containerSelector, filterFn = null, limit = null) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  let list = filterFn ? allProducts.filter(filterFn) : [...allProducts];
  // Prefer products that have at least one image
  list = list.filter((p) => p && p.id);
  if (limit) list = list.slice(0, limit);

  if (list.length === 0) {
    container.innerHTML = `<p class="empty-msg">No products in this category yet.</p>`;
    return;
  }
  container.innerHTML = list.map(productCardHTML).join("");
  bindProductCardActions(container);
}

/** Render every homepage category grid from current allProducts (SheetDB). */
function renderHomeGrids() {
  // Exactly 4 products per category on the homepage
  // NOTE: ids are plain element ids (no leading "#") and are looked up with
  // getElementById — "2pcs-grid" starts with a digit, which is an invalid
  // CSS selector for querySelector (it throws), so querySelector must never
  // be used here or one bad id silently kills every grid after it in the list.
  const byCat = [
    ["polos-grid", "polos"],
    ["tees-grid", "tshirts"],
    ["bottoms-grid", "bottoms"],
    ["2pcs-grid", "2pcs"],
    ["jerseys-grid", "jerseys"],
    ["shoes-grid", "shoes"],
    ["accessories-grid", "accessories"]
  ];
  byCat.forEach(([id, cat]) => {
    const el = document.getElementById(id);
    if (!el) return;
    const list = allProducts.filter((p) => p.category === cat).slice(0, 4);
    if (!list.length) {
      el.innerHTML = "";
      // hide empty section (the parent .section)
      const section = el.closest("section");
      if (section) section.style.display = "none";
      return;
    }
    const section = el.closest("section");
    if (section) section.style.display = "";
    el.innerHTML = list.map(productCardHTML).join("");
    bindProductCardActions(el);
  });
}

// ---------- QUICK ADD MODAL ----------
function openQuickAdd(productId) {
  const p = allProducts.find(x => String(x.id) === String(productId));
  if (!p) return;

  const sizes = (p.sizes || "S,M,L,XL").split(",").map(s => s.trim());
  let modal = document.getElementById("quick-add-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "quick-add-modal";
    modal.className = "modal";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-backdrop" onclick="closeModal()"></div>
    <div class="modal-content">
      <button class="modal-close" onclick="closeModal()">×</button>
      <div class="modal-body">
        <img src="${primaryImage(p)}" alt="${p.name}" />
        <div>
          <h3>${p.name}</h3>
          <p class="price">${formatPrice(p.price)}</p>
          <p class="desc">${p.description}</p>
          <label>Size</label>
          <div class="size-select" id="qa-sizes">
            ${sizes.map((s, i) => `
              <button class="size-btn ${i === 1 ? "active" : ""}" data-size="${s}">${s}</button>
            `).join("")}
          </div>
          <button class="btn btn-primary btn-block" id="qa-add-btn">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.add("open");

  // size selection
  modal.querySelectorAll(".size-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      modal.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  modal.querySelector("#qa-add-btn").onclick = () => {
    const size = modal.querySelector(".size-btn.active")?.dataset.size || "M";
    addToCart(p.id, size);
    closeModal();
  };
}

function closeModal() {
  document.getElementById("quick-add-modal")?.classList.remove("open");
}

// ---------- PLACE ORDER (SheetDB) ----------
async function placeOrder(formData) {
  if (cart.length === 0) {
    alert("Your cart is empty");
    return false;
  }

  const orderId = "ZLV-" + Date.now().toString(36).toUpperCase();
  const itemsStr = cart.map(i => `${i.name} (${i.size}) x${i.qty}`).join(" | ");
  const total = getCartTotal() + getShipping();

  const payload = {
    data: [{
      order_id: orderId,
      date: new Date().toISOString(),
      customer_name: formData.name,
      phone: formData.phone,
      email: formData.email || "",
      address: formData.address,
      city: formData.city,
      items: itemsStr,
      total: total,
      payment: formData.payment || "COD",
      status: "Pending",
      notes: formData.notes || ""
    }]
  };

  try {
    const url = getOrdersUrl();
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || "Order failed");
    }

    cart = [];
    saveCart();
    return { success: true, orderId };
  } catch (err) {
    console.error(err);
    alert("Could not place order. Please try again or contact us on WhatsApp.");
    return { success: false };
  }
}

// ---------- INIT ----------

// ---------- ACTIVE NAV ----------
function setActiveNav() {
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const params = new URLSearchParams(location.search);
  const cat = (params.get("category") || "").toLowerCase();

  document.querySelectorAll(".nav-links a").forEach(a => a.classList.remove("active"));

  let key = "home";
  if (path.includes("about")) key = "about";
  else if (path.includes("cart")) key = "shop";
  else if (path.includes("product")) key = "shop";
  else if (path.includes("shop")) {
    if (cat === "polos") key = "polos";
    else if (cat === "tshirts" || cat === "t-shirts") key = "tshirts";
    else if (cat === "bottoms" || cat === "casual") key = "bottoms";
    else if (cat === "2pcs" || cat === "packs") key = "2pcs";
    else if (cat === "jerseys" || cat === "jersey") key = "jerseys";
    else if (cat === "shoes" || cat === "shoe") key = "shoes";
    else if (cat === "accessories" || cat === "accessory") key = "accessories";
    else key = "shop";
  } else if (path === "" || path === "index.html" || path === "/") {
    key = "home";
  }

  const link = document.querySelector(`.nav-links a[data-nav="${key}"]`);
  if (link) link.classList.add("active");
}

async function initApp() {
  try {
    updateCartCount();
  } catch (e) {}

  // Paint skeleton cards into any empty product grids right away so the
  // page never shows a blank "loading" area while products are fetched.
  try { paintSkeletonGrids(); } catch (e) {}

  try {
    const burger = document.querySelector(".burger");
    const nav = document.querySelector(".nav-links");
    if (burger && nav) {
      burger.addEventListener("click", () => {
        nav.classList.toggle("open");
        burger.classList.toggle("open");
      });
    }
  } catch (e) {}

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      try { closeModal(); } catch (err) {}
    }
  });

  await loadProducts();

  try { renderCollections(); } catch (e) { console.error(e); }
  try { renderHomeGrids(); } catch (e) { console.error(e); }
  try { setActiveNav(); } catch (e) { console.error(e); }

  // Shop page
  if (document.getElementById("shop-grid")) {
    try {
      const params = new URLSearchParams(location.search);
      const cat = params.get("category");
      const filter = cat ? ((p) => p.category === cat) : null;
      renderProductGrid("#shop-grid", filter);
      document.querySelectorAll(".filter-btn").forEach((btn) => {
        if (btn.dataset.cat === (cat || "all")) btn.classList.add("active");
        btn.addEventListener("click", () => {
          const c = btn.dataset.cat;
          window.location.href = c === "all" ? "shop.html" : `shop.html?category=${c}`;
        });
      });
    } catch (e) {
      console.error(e);
    }
  }

  // Product detail page — always leave loading state
  const pd = document.getElementById("product-detail");
  if (pd) {
    try {
      const params = new URLSearchParams(location.search);
      const id = decodeURIComponent((params.get("id") || "").trim());
      let product = allProducts.find((p) => String(p.id) === String(id));
      if (!product && id) {
        product = allProducts.find(
          (p) => String(p.id).trim() === id || String(Number(p.id)) === String(Number(id))
        );
      }
      if (product) {
        renderProductDetail(product);
      } else {
        pd.innerHTML = `
          <div class="container" style="padding:80px 20px;text-align:center">
            <h2>Product not found</h2>
            <p style="color:var(--text-muted);margin:0.75rem 0 1.25rem">ID: ${id || "(none)"} · Loaded ${allProducts.length} products.</p>
            <a href="shop.html" class="btn btn-primary">Back to Shop</a>
          </div>`;
      }
    } catch (err) {
      console.error("Product page error:", err);
      pd.innerHTML = `
        <div class="container" style="padding:80px 20px;text-align:center">
          <h2>Could not load product</h2>
          <p style="color:var(--text-muted);margin:0.75rem 0 1.25rem">Please go back and try again.</p>
          <a href="shop.html" class="btn btn-primary">Back to Shop</a>
        </div>`;
    }
  }

  if (document.getElementById("cart-items")) {
    try { renderCart(); } catch (e) { console.error(e); }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => { initApp(); });
} else {
  initApp();
}

// ---------- PRODUCT DETAIL RENDER ----------
function renderProductDetail(p) {
  if (!p) return;
  const el = document.getElementById("product-detail");
  if (!el) return;

  let sizes = String(p.sizes || "S,M,L,XL")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
  if (!sizes.length) sizes = ["S", "M", "L", "XL"];

  const displayName = p.name || "Untitled";
  let images = (p.images && p.images.length) ? p.images.slice() : parseImages(p.image);
  if (!images || !images.length) images = parseImages("");
  const mainSrc = images[0];

  const thumbsHTML = images.length > 1 ? `
    <div class="pd-thumbs" id="pd-thumbs">
      ${images.map((src, i) => `
        <button type="button" class="pd-thumb ${i === 0 ? "active" : ""}" data-src="${src}" aria-label="Image ${i + 1}">
          <img src="${src}" alt="" loading="lazy" />
        </button>
      `).join("")}
    </div>
  ` : "";

  const ratingVal = Number(p.rating);
  const ratingSafe = Number.isFinite(ratingVal) ? ratingVal : 4.5;

  el.innerHTML = `
    <div class="container product-detail-grid">
      <div class="pd-gallery">
        <div class="pd-main-wrap">
          <img src="${mainSrc}" alt="" id="main-image" />
        </div>
        ${thumbsHTML}
      </div>
      <div class="pd-info">
        ${p.badge ? `<span class="badge">${String(p.badge)}</span>` : ""}
        <h1></h1>
        <div class="pd-price">${formatPrice(p.price)}</div>
        <div class="pd-rating">${stars(ratingSafe)} <span>(${Number(p.reviews) || 0} reviews)</span></div>
        <p class="pd-desc"></p>

        <div class="pd-sizes">
          <label>Select Size</label>
          <div class="size-select" id="pd-sizes">
            ${sizes.map((s, i) => `
              <button type="button" class="size-btn ${i === 0 ? "active" : ""}" data-size="${s}">${s}</button>
            `).join("")}
          </div>
        </div>

        <div class="pd-actions">
          <button type="button" class="btn btn-primary btn-lg" id="buy-now-btn">Buy Now</button>
          <button type="button" class="btn btn-outline btn-lg" id="add-to-cart-btn">Add to Cart</button>
        </div>

        <ul class="pd-features">
          <li>✓ Free Shipping on orders above ${formatPrice(CONFIG.FREE_SHIPPING_THRESHOLD)}</li>
          <li>✓ Cash on Delivery available across Pakistan</li>
          <li>✓ 7-Day Hassle-Free Exchange</li>
          <li>✓ Premium Fabric • Quiet Luxury</li>
        </ul>
      </div>
    </div>
  `;

  // Set text safely (avoids broken HTML from product names/descriptions)
  const h1 = el.querySelector(".pd-info h1");
  if (h1) h1.textContent = displayName;
  const desc = el.querySelector(".pd-desc");
  if (desc) desc.textContent = p.description || "";
  const mainImg = el.querySelector("#main-image");
  if (mainImg) mainImg.alt = displayName;

  el.querySelectorAll(".pd-thumb").forEach(btn => {
    btn.addEventListener("click", () => {
      const main = el.querySelector("#main-image");
      if (main) main.src = btn.dataset.src;
      el.querySelectorAll(".pd-thumb").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  el.querySelectorAll(".size-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      el.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  const getSelectedSize = () => el.querySelector(".size-btn.active")?.dataset.size || sizes[0] || "M";

  const addBtn = el.querySelector("#add-to-cart-btn");
  const buyBtn = el.querySelector("#buy-now-btn");
  if (addBtn) addBtn.onclick = () => addToCart(p.id, getSelectedSize());
  if (buyBtn) buyBtn.onclick = () => {
    addToCart(p.id, getSelectedSize());
    window.location.href = "cart.html";
  };
}

// ---------- CART RENDER ----------
function renderCart() {
  const container = document.getElementById("cart-items");
  const summary = document.getElementById("cart-summary");
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-cart">
        <h2>Your bag is empty</h2>
        <p>Add pieces from the collection to place an order.</p>
        <a href="shop.html" class="btn btn-primary">Shop Collection</a>
      </div>`;
    if (summary) summary.style.display = "none";
    return;
  }

  container.innerHTML = cart.map((item, idx) => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}" />
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <p>Size: ${item.size}</p>
        <div class="qty-controls">
          <button onclick="updateQty(${idx}, -1)">−</button>
          <span>${item.qty}</span>
          <button onclick="updateQty(${idx}, 1)">+</button>
        </div>
      </div>
      <div class="cart-item-price">
        <strong>${formatPrice(item.price * item.qty)}</strong>
        <button class="remove-btn" onclick="removeFromCart(${idx})">Remove</button>
      </div>
    </div>
  `).join("");

  if (summary) {
    summary.style.display = "block";
    const subtotal = getCartTotal();
    const shipping = getShipping();
    const total = subtotal + shipping;

    summary.innerHTML = `
      <h3>Order Summary</h3>
      <div class="summary-row">
        <span>Subtotal</span>
        <span>${formatPrice(subtotal)}</span>
      </div>
      <div class="summary-row">
        <span>Shipping</span>
        <span>${shipping === 0 ? "FREE" : formatPrice(shipping)}</span>
      </div>
      ${shipping > 0 ? `
        <p class="shipping-note">Add ${formatPrice(CONFIG.FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping</p>
      ` : `<p class="shipping-note free">🎉 You qualify for free shipping!</p>`}
      <div class="summary-row total">
        <span>Total</span>
        <span>${formatPrice(total)}</span>
      </div>

      <form id="checkout-form" class="checkout-form">
        <h4>Shipping Details</h4>
        <input type="text" name="name" placeholder="Full Name *" required />
        <input type="tel" name="phone" placeholder="Phone Number *" required />
        <input type="email" name="email" placeholder="Email (optional)" />
        <textarea name="address" placeholder="Full Address *" required rows="3"></textarea>
        <input type="text" name="city" placeholder="City *" required />
        <select name="payment">
          <option value="COD">Cash on Delivery (COD)</option>
          <option value="Bank Transfer">Bank Transfer</option>
        </select>
        <textarea name="notes" placeholder="Order notes (optional)" rows="2"></textarea>
        <button type="submit" class="btn btn-primary btn-block btn-lg">
          Place Order
        </button>
      </form>
    `;

    document.getElementById("checkout-form").onsubmit = async (e) => {
      e.preventDefault();
      const form = e.target;
      const btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      btn.textContent = "Placing Order...";

      const data = {
        name: form.name.value.trim(),
        phone: form.phone.value.trim(),
        email: form.email.value.trim(),
        address: form.address.value.trim(),
        city: form.city.value.trim(),
        payment: form.payment.value,
        notes: form.notes.value.trim()
      };

      const result = await placeOrder(data);
      if (result.success) {
        container.innerHTML = `
          <div class="order-success">
            <div class="success-icon">✓</div>
            <h2>Thank you for your order!</h2>
            <p>Order ID: <strong>${result.orderId}</strong></p>
            ${result.demo ? "<p><em>(Demo mode – order logged to console)</em></p>" : ""}
            <p>We will contact you shortly by phone to confirm your order.</p>
            <a href="shop.html" class="btn btn-primary">Continue Shopping</a>

          </div>`;
        summary.style.display = "none";
      } else {
        btn.disabled = false;
        btn.textContent = "Place Order";
      }
    };
  }
}



// ---------- COLLECTIONS (Postimages-ready) ----------
function renderCollections() {
  const grid = document.getElementById("collections-grid");
  if (!grid || !CONFIG.COLLECTIONS) return;
  grid.innerHTML = CONFIG.COLLECTIONS.map(c => `
    <a href="${c.href}" class="collection-card">
      <img src="${c.image}" alt="${c.title}" loading="lazy" />
      <div class="collection-overlay">
        <h3>${c.title}</h3>
        <p>${c.subtitle || ""}</p>
        <span class="collection-explore">EXPLORE →</span>
      </div>
    </a>
  `).join("");
}

// ---------- REVIEWS CAROUSEL ----------
let reviewIndex = 0;

function getVisibleReviews() {
  if (window.innerWidth <= 768) return 1;
  if (window.innerWidth <= 1024) return 2;
  return 3;
}

function slideReviews(dir) {
  const track = document.getElementById("reviews-track");
  if (!track) return;
  const cards = track.querySelectorAll(".review-card");
  const visible = getVisibleReviews();
  const max = Math.max(0, cards.length - visible);
  reviewIndex = Math.max(0, Math.min(max, reviewIndex + dir));
  const cardWidth = cards[0].offsetWidth + 20; // gap ~1.25rem
  track.style.transform = `translateX(-${reviewIndex * cardWidth}px)`;
  updateReviewDots(max);
}

function updateReviewDots(max) {
  const dots = document.getElementById("reviews-dots");
  if (!dots) return;
  const total = max + 1;
  dots.innerHTML = "";
  for (let i = 0; i < total; i++) {
    const b = document.createElement("button");
    b.className = i === reviewIndex ? "active" : "";
    b.setAttribute("aria-label", "Slide " + (i + 1));
    b.onclick = () => {
      reviewIndex = i;
      slideReviews(0);
    };
    dots.appendChild(b);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("reviews-track")) {
    setTimeout(() => {
      const cards = document.querySelectorAll("#reviews-track .review-card");
      const max = Math.max(0, cards.length - getVisibleReviews());
      updateReviewDots(max);
    }, 100);
    window.addEventListener("resize", () => {
      reviewIndex = 0;
      slideReviews(0);
    });
  }
});
