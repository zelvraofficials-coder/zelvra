// ============================================
// ZELVRA Admin Portal
// ============================================

const AUTH_KEY = "zelvra_admin_auth";

let products = [];
let orders = [];
let charts = { status: null, category: null, revenue: null };

// ---------- Auth ----------
function isAuthed() {
  return sessionStorage.getItem(AUTH_KEY) === "1";
}

function setAuth(ok) {
  if (ok) sessionStorage.setItem(AUTH_KEY, "1");
  else sessionStorage.removeItem(AUTH_KEY);
}

function showApp() {
  const login = document.getElementById("login-screen");
  const app = document.getElementById("admin-app");
  if (login) {
    login.hidden = true;
    login.style.display = "none";
  }
  if (app) {
    app.hidden = false;
    app.style.display = "grid";
  }
  loadAll(false);
}

function showLogin() {
  const login = document.getElementById("login-screen");
  const app = document.getElementById("admin-app");
  if (login) {
    login.hidden = false;
    login.style.display = "flex";
  }
  if (app) {
    app.hidden = true;
    app.style.display = "none";
  }
}

function getPassword() {
  try {
    if (typeof CONFIG !== "undefined" && CONFIG.ADMIN_PASSWORD) {
      return String(CONFIG.ADMIN_PASSWORD).trim();
    }
  } catch (e) {}
  return "zelvra2026";
}

document.getElementById("login-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const pass = (document.getElementById("admin-pass").value || "").trim();
  if (pass === getPassword()) {
    setAuth(true);
    showApp();
  } else {
    toast("Incorrect password. Use: " + getPassword());
    document.getElementById("admin-pass").select();
  }
});

document.getElementById("logout-btn").addEventListener("click", () => {
  setAuth(false);
  showLogin();
});

// ---------- Toast ----------
function toast(msg) {
  const el = document.getElementById("admin-toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 3000);
}

function formatPrice(n) {
  return (CONFIG.CURRENCY || "Rs.") + " " + Number(n || 0).toLocaleString("en-PK");
}

function primaryImage(p) {
  if (!p) return "";
  const raw = p.image || p.images || "";
  if (Array.isArray(raw)) return raw[0] || "";
  return String(raw).split(",")[0].trim();
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------- API ----------
async function fetchProducts() {
  const res = await fetch(getProductsUrl());
  if (!res.ok) throw new Error("Products fetch failed " + res.status);
  const data = await res.json();
  products = (Array.isArray(data) ? data : []).map((row, i) => {
    let c = String(row.category || row.Category || "polos")
      .toLowerCase()
      .replace(/\s+/g, "");
    if (c === "casual" || c === "casualwear") c = "bottoms";
    if (c === "t-shirts" || c === "tees") c = "tshirts";
    if (c === "bottomwear" || c === "trousers" || c === "pants" || c === "bottom") c = "bottoms";
    if (c === "2pc" || c === "2piece" || c === "2pieces" || c === "2-pcs" || c === "packs" || c === "pack") c = "2pcs";
    if (c === "football" || c === "footballjersey" || c === "jersey" || c === "jerseys") c = "jerseys";
    if (c === "shoe" || c === "sneakers" || c === "footwear") c = "shoes";
    if (c === "accessory" || c === "menaccessories" || c === "accessorie") c = "accessories";
    return {
      id: String(row.id || row.ID || i + 1),
      name: row.name || row.Name || "Untitled",
      category: c,
      price: Number(row.price || row.Price || 0),
      image: row.image || row.Image || "",
      description: row.description || row.Description || "",
      sizes: row.sizes || row.Sizes || "S,M,L,XL",
      rating: Number(row.rating || row.Rating || 4.5),
      reviews: Number(row.reviews || row.Reviews || 0),
      badge: row.badge || row.Badge || "",
      stock: Number(row.stock ?? row.Stock ?? 99)
    };
  });
  return products;
}

async function fetchOrders() {
  const res = await fetch(getOrdersUrl());
  if (!res.ok) throw new Error("Orders fetch failed " + res.status);
  const data = await res.json();
  orders = (Array.isArray(data) ? data : []).map((row, idx) => {
    const oid = String(row.order_id || row.Order_ID || "").trim();
    return {
      order_id: oid,
      _rowKey: oid || ("ROW-" + idx + "-" + String(row.phone || "") + "-" + String(row.date || "").slice(0, 16)),
      date: row.date || row.Date || "",
      customer_name: row.customer_name || row.Customer_Name || "",
      phone: row.phone || row.Phone || "",
      email: row.email || row.Email || "",
      address: row.address || row.Address || "",
      city: row.city || row.City || "",
      items: row.items || row.Items || "",
      total: Number(row.total || row.Total || 0),
      payment: row.payment || row.Payment || "COD",
      status: row.status || row.Status || "Pending",
      notes: row.notes || row.Notes || ""
    };
  });
  orders.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return orders;
}

async function loadAll(showToastMsg) {
  try {
    await Promise.all([fetchProducts(), fetchOrders()]);
    const sync = document.getElementById("last-sync");
    if (sync) sync.textContent = "Synced " + new Date().toLocaleTimeString();
    renderDashboard();
    renderProductsTable();
    renderOrdersTable();
    if (showToastMsg) toast("Data refreshed");
  } catch (err) {
    console.error(err);
    toast("Could not load SheetDB. Check APIs / internet / CORS.");
  }
}

document.getElementById("refresh-btn").addEventListener("click", () => loadAll(true));

// ---------- Navigation ----------
const viewTitles = {
  dashboard: "Dashboard",
  products: "Products",
  orders: "Orders",
  "add-product": "Add Product"
};

function showView(name) {
  document.querySelectorAll(".admin-view").forEach((v) => v.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach((n) => n.classList.remove("active"));
  const view = document.getElementById("view-" + name);
  if (view) view.classList.add("active");
  document.querySelector(`.nav-item[data-view="${name}"]`)?.classList.add("active");
  const title = document.getElementById("view-title");
  if (title) title.textContent = viewTitles[name] || name;
  if (name === "add-product" && !document.getElementById("pf-edit-id").value) {
    resetProductForm();
  }
}

document.querySelectorAll(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => showView(btn.dataset.view));
});

document.querySelectorAll("[data-view-goto]").forEach((btn) => {
  btn.addEventListener("click", () => showView(btn.dataset.viewGoto));
});

// ---------- Dashboard + Charts ----------
function renderDashboard() {
  const revenue = orders
    .filter((o) => o.status !== "Cancelled")
    .reduce((s, o) => s + (Number(o.total) || 0), 0);
  const pending = orders.filter((o) => o.status === "Pending").length;

  const elRev = document.getElementById("stat-revenue");
  const elOrd = document.getElementById("stat-orders");
  const elPen = document.getElementById("stat-pending");
  const elProd = document.getElementById("stat-products");
  if (elRev) elRev.textContent = formatPrice(revenue);
  if (elOrd) elOrd.textContent = orders.length;
  if (elPen) elPen.textContent = pending;
  if (elProd) elProd.textContent = products.length;

  if (typeof Chart === "undefined") return;

  const statusCounts = {};
  orders.forEach((o) => {
    const s = o.status || "Pending";
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });
  const statusLabels = Object.keys(statusCounts).length ? Object.keys(statusCounts) : ["No orders"];
  const statusData = Object.keys(statusCounts).length ? Object.values(statusCounts) : [1];

  if (charts.status) charts.status.destroy();
  const ctxStatus = document.getElementById("chart-status");
  if (ctxStatus) {
    charts.status = new Chart(ctxStatus, {
      type: "doughnut",
      data: {
        labels: statusLabels,
        datasets: [{
          data: statusData,
          backgroundColor: ["#f59e0b", "#3b82f6", "#6366f1", "#10b981", "#ef4444", "#94a3b8"]
        }]
      },
      options: { plugins: { legend: { position: "bottom" } } }
    });
  }

  const catCounts = {};
  products.forEach((p) => {
    const c = p.category || "other";
    catCounts[c] = (catCounts[c] || 0) + 1;
  });
  if (charts.category) charts.category.destroy();
  const ctxCat = document.getElementById("chart-category");
  if (ctxCat) {
    charts.category = new Chart(ctxCat, {
      type: "bar",
      data: {
        labels: Object.keys(catCounts).length ? Object.keys(catCounts) : ["none"],
        datasets: [{
          label: "Products",
          data: Object.keys(catCounts).length ? Object.values(catCounts) : [0],
          backgroundColor: "#b8975a"
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
  }

  const byDay = {};
  orders
    .filter((o) => o.status !== "Cancelled")
    .forEach((o) => {
      const d = (o.date || "").slice(0, 10) || "unknown";
      byDay[d] = (byDay[d] || 0) + (Number(o.total) || 0);
    });
  const days = Object.keys(byDay).sort().slice(-14);
  if (charts.revenue) charts.revenue.destroy();
  const ctxRev = document.getElementById("chart-revenue");
  if (ctxRev) {
    charts.revenue = new Chart(ctxRev, {
      type: "line",
      data: {
        labels: days.length ? days : ["—"],
        datasets: [{
          label: "Revenue (Rs.)",
          data: days.length ? days.map((d) => byDay[d]) : [0],
          borderColor: "#0c0c0c",
          backgroundColor: "rgba(184,151,90,0.15)",
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  const tbody = document.querySelector("#recent-orders-table tbody");
  if (!tbody) return;
  const recent = orders.slice(0, 8);
  tbody.innerHTML = recent.length
    ? recent
        .map(
          (o) => `
      <tr>
        <td><code>${escapeHtml(o.order_id)}</code></td>
        <td>${escapeHtml(o.customer_name)}</td>
        <td>${escapeHtml(o.phone)}</td>
        <td>${escapeHtml(o.city)}</td>
        <td>${formatPrice(o.total)}</td>
        <td><span class="status-pill ${escapeHtml(o.status)}">${escapeHtml(o.status)}</span></td>
        <td>${(o.date || "").slice(0, 10)}</td>
        <td class="row-actions"><button type="button" data-view-order="${escapeHtml(o._rowKey)}">View</button></td>
      </tr>`
        )
        .join("")
    : `<tr><td colspan="8" style="text-align:center;color:var(--text-muted)">No orders yet</td></tr>`;

  tbody.querySelectorAll("[data-view-order]").forEach((btn) => {
    btn.addEventListener("click", () => openOrderEdit(btn.dataset.viewOrder));
  });
}

// ---------- Products CRUD ----------
function renderProductsTable() {
  const tbody = document.querySelector("#products-table tbody");
  if (!tbody) return;
  if (!products.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--text-muted)">No products. Add one or check SheetDB.</td></tr>`;
    return;
  }
  tbody.innerHTML = products
    .map(
      (p) => `
    <tr>
      <td>${escapeHtml(p.id)}</td>
      <td><img class="thumb" src="${primaryImage(p)}" alt="" /></td>
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.category)}</td>
      <td>${formatPrice(p.price)}</td>
      <td>${p.stock}</td>
      <td>${escapeHtml(p.badge)}</td>
      <td class="row-actions">
        <button type="button" data-edit-product="${escapeHtml(p.id)}">Edit</button>
        <button type="button" class="danger" data-delete-product="${escapeHtml(p.id)}">Delete</button>
      </td>
    </tr>`
    )
    .join("");

  tbody.querySelectorAll("[data-edit-product]").forEach((btn) => {
    btn.addEventListener("click", () => editProduct(btn.dataset.editProduct));
  });
  tbody.querySelectorAll("[data-delete-product]").forEach((btn) => {
    btn.addEventListener("click", () => deleteProduct(btn.dataset.deleteProduct));
  });
}

function resetProductForm() {
  document.getElementById("product-form-title").textContent = "Add Product";
  document.getElementById("pf-edit-id").value = "";
  document.getElementById("product-form").reset();
  document.getElementById("pf-sizes").value = "S,M,L,XL";
  document.getElementById("pf-stock").value = "50";
  document.getElementById("pf-rating").value = "4.5";
  document.getElementById("pf-reviews").value = "0";
  document.getElementById("pf-submit").textContent = "Save Product";
  const status = document.getElementById("pf-upload-status");
  if (status) {
    status.textContent = "Upload at least 3 PNG/JPEG images, then click Upload. URLs will be added below.";
    status.className = "form-hint";
  }
  const previews = document.getElementById("pf-image-previews");
  if (previews) previews.innerHTML = "";
  const fileInput = document.getElementById("pf-image-file");
  if (fileInput) fileInput.value = "";
}

function editProduct(id) {
  const p = products.find((x) => String(x.id) === String(id));
  if (!p) return;
  document.getElementById("product-form-title").textContent = "Edit Product";
  document.getElementById("pf-edit-id").value = p.id;
  document.getElementById("pf-name").value = p.name;
  const cat = p.category === "casual" ? "bottoms" : p.category;
  const catEl = document.getElementById("pf-category");
  if (catEl && [...catEl.options].some((o) => o.value === cat)) catEl.value = cat;
  else if (catEl) catEl.value = "polos";
  document.getElementById("pf-price").value = p.price;
  document.getElementById("pf-stock").value = p.stock;
  document.getElementById("pf-image").value = p.image;
  document.getElementById("pf-description").value = p.description;
  document.getElementById("pf-sizes").value = p.sizes;
  document.getElementById("pf-badge").value = p.badge;
  document.getElementById("pf-rating").value = p.rating;
  document.getElementById("pf-reviews").value = p.reviews;
  document.getElementById("pf-submit").textContent = "Update Product";
  renderImagePreviewsFromUrls(p.image);
  showView("add-product");
}

function renderImagePreviewsFromUrls(raw) {
  const previews = document.getElementById("pf-image-previews");
  if (!previews) return;
  previews.innerHTML = "";
  const urls = String(raw || "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.startsWith("http"));
  urls.forEach((url) => appendImagePreview(url));
}

function appendImagePreview(url) {
  const previews = document.getElementById("pf-image-previews");
  if (!previews) return;
  const wrap = document.createElement("div");
  wrap.className = "prev";
  wrap.innerHTML = `<img src="${escapeHtml(url)}" alt="" /><button type="button" title="Remove">×</button>`;
  wrap.querySelector("button").onclick = () => {
    wrap.remove();
    syncImageFieldFromPreviews();
  };
  previews.appendChild(wrap);
}

function syncImageFieldFromPreviews() {
  const previews = document.getElementById("pf-image-previews");
  const input = document.getElementById("pf-image");
  if (!previews || !input) return;
  const urls = [...previews.querySelectorAll("img")].map((img) => img.src).filter(Boolean);
  input.value = urls.join(",");
}

async function uploadFileToImgBB(file) {
  const key = (typeof CONFIG !== "undefined" && CONFIG.IMGBB_API_KEY) || "";
  if (!key) throw new Error("IMGBB_API_KEY missing in config.js");
  const form = new FormData();
  form.append("image", file);
  form.append("name", file.name.replace(/\.[^.]+$/, "") || "zelvra");
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(key)}`, {
    method: "POST",
    body: form
  });
  const json = await res.json();
  if (!res.ok || !json.success || !json.data || !json.data.url) {
    const msg = (json && json.error && json.error.message) || "ImgBB upload failed";
    throw new Error(msg);
  }
  return json.data.display_url || json.data.url;
}

document.getElementById("pf-upload-btn")?.addEventListener("click", async () => {
  const fileInput = document.getElementById("pf-image-file");
  const status = document.getElementById("pf-upload-status");
  const btn = document.getElementById("pf-upload-btn");
  if (!fileInput || !fileInput.files || !fileInput.files.length) {
    if (status) {
      status.textContent = "Choose at least one PNG or JPEG file first.";
      status.className = "form-hint error";
    }
    return;
  }
  const files = [...fileInput.files];
  const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
  const bad = files.filter((f) => !allowed.includes(f.type) && !/\.(png|jpe?g|webp)$/i.test(f.name));
  if (bad.length) {
    if (status) {
      status.textContent = "Only PNG, JPEG, or WebP images are allowed.";
      status.className = "form-hint error";
    }
    return;
  }
  btn.disabled = true;
  if (status) {
    status.textContent = `Uploading ${files.length} image(s) to ImgBB…`;
    status.className = "form-hint uploading";
  }
  const uploaded = [];
  try {
    for (const file of files) {
      const url = await uploadFileToImgBB(file);
      uploaded.push(url);
      appendImagePreview(url);
    }
    const existing = (document.getElementById("pf-image").value || "").trim();
    const all = [existing, ...uploaded].filter(Boolean).join(",");
    const unique = [...new Set(all.split(",").map((s) => s.trim()).filter(Boolean))];
    document.getElementById("pf-image").value = unique.join(",");
    const totalUrls = (document.getElementById("pf-image").value || "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.startsWith("http")).length;
    if (status) {
      if (totalUrls < 3) {
        status.textContent = `Uploaded ${uploaded.length}. Total: ${totalUrls}/3 — add more images (minimum 3).`;
        status.className = "form-hint error";
      } else {
        status.textContent = `Uploaded ${uploaded.length} image(s). Total: ${totalUrls} (OK — min 3 met).`;
        status.className = "form-hint success";
      }
    }
    fileInput.value = "";
  } catch (err) {
    console.error(err);
    if (status) {
      status.textContent = "Upload failed: " + (err.message || "check ImgBB key / network");
      status.className = "form-hint error";
    }
    toast("Image upload failed");
  } finally {
    btn.disabled = false;
  }
});

document.getElementById("pf-image")?.addEventListener("change", () => {
  renderImagePreviewsFromUrls(document.getElementById("pf-image").value);
});

document.getElementById("pf-cancel").addEventListener("click", () => {
  resetProductForm();
  showView("products");
});

document.getElementById("product-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const editId = document.getElementById("pf-edit-id").value;
  const imageRaw = document.getElementById("pf-image").value.trim();
  const imageUrls = imageRaw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.startsWith("http"));
  if (imageUrls.length < 3) {
    toast("Minimum 3 images required (PNG/JPEG URLs)");
    const status = document.getElementById("pf-upload-status");
    if (status) {
      status.textContent = `Only ${imageUrls.length} image(s) — please add at least 3.`;
      status.className = "form-hint error";
    }
    document.getElementById("pf-image").focus();
    return;
  }
  const payload = {
    name: document.getElementById("pf-name").value.trim(),
    category: document.getElementById("pf-category").value,
    price: Number(document.getElementById("pf-price").value),
    stock: Number(document.getElementById("pf-stock").value) || 0,
    image: imageUrls.join(","),
    description: document.getElementById("pf-description").value.trim(),
    sizes: document.getElementById("pf-sizes").value.trim() || "S,M,L,XL",
    badge: document.getElementById("pf-badge").value.trim(),
    rating: Number(document.getElementById("pf-rating").value) || 4.5,
    reviews: Number(document.getElementById("pf-reviews").value) || 0
  };

  const btn = document.getElementById("pf-submit");
  btn.disabled = true;
  const prev = btn.textContent;
  btn.textContent = "Saving...";

  try {
    if (editId) {
      const res = await fetch(`${getProductsUrl()}/id/${encodeURIComponent(editId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: payload })
      });
      if (!res.ok) throw new Error(await res.text());
      toast("Product updated");
    } else {
      const maxId = products.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0);
      payload.id = String(maxId + 1);
      const res = await fetch(getProductsUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: [payload] })
      });
      if (!res.ok) throw new Error(await res.text());
      toast("Product added");
    }
    resetProductForm();
    await loadAll(false);
    showView("products");
  } catch (err) {
    console.error(err);
    toast("Save failed. Enable Create/Update on Products SheetDB API.");
  } finally {
    btn.disabled = false;
    btn.textContent = prev;
  }
});

async function deleteProduct(id) {
  if (!confirm("Delete this product from the Google Sheet?")) return;
  try {
    const res = await fetch(`${getProductsUrl()}/id/${encodeURIComponent(id)}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error(await res.text());
    toast("Product deleted");
    await loadAll(false);
  } catch (err) {
    console.error(err);
    toast("Delete failed. Enable DELETE on Products SheetDB API.");
  }
}

// ---------- Orders ----------
function renderOrdersTable() {
  const filterEl = document.getElementById("order-status-filter");
  const filter = filterEl ? filterEl.value : "all";
  let list = orders;
  if (filter !== "all") list = orders.filter((o) => o.status === filter);

  const tbody = document.querySelector("#orders-table tbody");
  if (!tbody) return;
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;color:var(--text-muted)">No orders</td></tr>`;
    return;
  }

  tbody.innerHTML = list
    .map(
      (o) => `
    <tr>
      <td><code>${escapeHtml(o.order_id || "—")}</code></td>
      <td>
        <div class="order-cust">
          <strong>${escapeHtml(o.customer_name || "—")}</strong>
          <span class="order-phone">${escapeHtml(o.phone || "")}</span>
        </div>
      </td>
      <td class="order-address-cell">
        <div class="order-address">${escapeHtml(o.address || "—")}</div>
        <div class="order-city">${escapeHtml(o.city || "")}</div>
      </td>
      <td style="max-width:160px;font-size:0.75rem">${escapeHtml(o.items)}</td>
      <td>${formatPrice(o.total)}</td>
      <td>${escapeHtml(o.payment)}</td>
      <td><span class="status-pill ${escapeHtml(o.status)}">${escapeHtml(o.status)}</span></td>
      <td class="row-actions">
        <button type="button" data-view-order="${escapeHtml(o._rowKey)}">View details</button>
        <button type="button" class="danger" data-delete-order-key="${escapeHtml(o._rowKey)}">Delete</button>
      </td>
    </tr>`
    )
    .join("");

  tbody.querySelectorAll("[data-view-order]").forEach((btn) => {
    btn.addEventListener("click", () => openOrderEdit(btn.dataset.viewOrder));
  });
  tbody.querySelectorAll("[data-delete-order-key]").forEach((btn) => {
    btn.addEventListener("click", () => deleteOrderByKey(btn.dataset.deleteOrderKey));
  });
}

document.getElementById("order-status-filter")?.addEventListener("change", renderOrdersTable);

function findOrder(key) {
  return orders.find((x) => x._rowKey === key || x.order_id === key) || null;
}

function openOrderEdit(key) {
  const o = findOrder(key);
  if (!o) {
    toast("Order not found");
    return;
  }
  document.getElementById("oe-id").value = o._rowKey;
  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = (val && String(val).trim()) ? String(val) : "—";
  };
  setText("oe-display-id", o.order_id || "(no order id)");
  setText("oe-name", o.customer_name);
  setText("oe-phone", o.phone);
  setText("oe-email", o.email);
  setText("oe-address", o.address);
  setText("oe-city", o.city);
  setText("oe-payment", o.payment);
  setText("oe-total", formatPrice(o.total));
  setText("oe-date", o.date ? String(o.date).replace("T", " ").slice(0, 22) : "—");
  setText("oe-items", o.items);
  const statusEl = document.getElementById("oe-status");
  if (statusEl) {
    const s = o.status || "Pending";
    if ([...statusEl.options].some((opt) => opt.value === s)) statusEl.value = s;
    else statusEl.value = "Pending";
  }
  document.getElementById("oe-notes").value = o.notes || "";
  document.getElementById("order-modal").classList.add("open");
}

function closeOrderModal() {
  document.getElementById("order-modal").classList.remove("open");
}

document.querySelectorAll("[data-close-order]").forEach((el) => {
  el.addEventListener("click", closeOrderModal);
});

async function patchOrderOnSheet(o, data) {
  // Prefer order_id when present
  if (o.order_id) {
    const res = await fetch(`${getOrdersUrl()}/order_id/${encodeURIComponent(o.order_id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data })
    });
    if (!res.ok) throw new Error(await res.text());
    return;
  }
  // Fallback: match by phone + date (older rows without order_id)
  if (o.phone) {
    const res = await fetch(`${getOrdersUrl()}/phone/${encodeURIComponent(o.phone)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data })
    });
    if (!res.ok) throw new Error(await res.text());
    return;
  }
  throw new Error("No order_id or phone to update");
}

document.getElementById("order-edit-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const key = document.getElementById("oe-id").value;
  const o = findOrder(key);
  if (!o) {
    toast("Order not found");
    return;
  }
  const status = document.getElementById("oe-status").value;
  const notes = document.getElementById("oe-notes").value.trim();

  try {
    await patchOrderOnSheet(o, { status, notes });
    toast("Order status & notes saved — dashboard updated");
    closeOrderModal();
    await loadAll(false);
  } catch (err) {
    console.error(err);
    toast("Update failed. Check SheetDB Update permission / order_id column.");
  }
});

async function deleteOrderByKey(key) {
  const o = findOrder(key);
  if (!o) return;
  const label = o.order_id || o.customer_name || key;
  if (!confirm(`Delete order ${label}?`)) return;
  try {
    if (o.order_id) {
      const res = await fetch(`${getOrdersUrl()}/order_id/${encodeURIComponent(o.order_id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
    } else if (o.phone) {
      const res = await fetch(`${getOrdersUrl()}/phone/${encodeURIComponent(o.phone)}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
    } else {
      throw new Error("Cannot delete: no order_id or phone");
    }
    toast("Order deleted");
    await loadAll(false);
  } catch (err) {
    console.error(err);
    toast("Delete failed. Enable DELETE on Orders SheetDB API.");
  }
}

// ---------- Boot ----------
if (isAuthed()) {
  showApp();
} else {
  showLogin();
}
