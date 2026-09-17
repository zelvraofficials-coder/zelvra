# ZELVRA – Old Money Clothing

Two Google Sheets via **SheetDB** (two API keys).

---

## 1) Paste your API keys

Open `js/config.js` and set:

```js
PRODUCTS_API: "https://sheetdb.io/api/v1/YOUR_PRODUCTS_API_ID",
ORDERS_API:   "https://sheetdb.io/api/v1/YOUR_ORDERS_API_ID",
```

| API | Used for |
|-----|----------|
| **PRODUCTS_API** | Shop products, homepage grids, admin Add/Edit/Delete product |
| **ORDERS_API** | Checkout Place Order, admin Orders list / status / delete |

In SheetDB, enable **Create, Read, Update, Delete** on both APIs.

---

## 2) Google Sheet headers (Row 1 exactly)

### Sheet A — PRODUCTS (connect to PRODUCTS_API)

Type these **exact** headers in row 1, one column each:

```
id | name | category | price | image | description | sizes | rating | reviews | badge | stock
```

| Header | What to put |
|--------|-------------|
| **id** | Unique number: `1`, `2`, `3`… (required for edit/delete) |
| **name** | Product title e.g. `ZELVRA Premium Ribbed Polo — Navy` |
| **category** | One of: `polos` · `tshirts` · `bottoms` · `2pcs` |
| **price** | Number only, no Rs. e.g. `4499` |
| **image** | Full image URL. Multiple images: comma-separated |
| **description** | Product text |
| **sizes** | e.g. `S,M,L,XL` |
| **rating** | e.g. `4.8` |
| **reviews** | Number e.g. `12` |
| **badge** | Optional: `NEW` · `SALE` · `2PCS` · empty |
| **stock** | Quantity number e.g. `40` |

**Example product row:**

| id | name | category | price | image | description | sizes | rating | reviews | badge | stock |
|----|------|----------|-------|-------|-------------|-------|--------|---------|-------|-------|
| 1 | ZELVRA Polo — Navy | polos | 4499 | https://i.postimg.cc/xxx/polo.jpg | 220 GSM piqué… | S,M,L,XL | 4.8 | 6 | NEW | 40 |
| 21 | ZELVRA 2pcs Tee Pack | 2pcs | 5499 | https://i.postimg.cc/xxx/pack.jpg | White + Black tees | S,M,L,XL | 4.7 | 5 | 2PCS | 25 |

**Categories allowed:**

- `polos` → Polos  
- `tshirts` → T-Shirts  
- `bottoms` → Bottom Wear  
- `2pcs` → 2pcs packs  
- `jerseys` → Football Jerseys  
- `shoes` → Shoes  
- `accessories` → Men Accessories  

**Admin image upload:** Product form supports PNG / JPEG / WebP upload via ImgBB (`IMGBB_API_KEY` in `js/config.js`).

---

### Sheet B — ORDERS (connect to ORDERS_API)

Type these **exact** headers in row 1 only (leave data rows empty — the website fills them):

```
order_id | date | customer_name | phone | email | address | city | items | total | payment | status | notes
```

| Header | Filled by |
|--------|-----------|
| **order_id** | Website (e.g. `ZLV-XXXX`) |
| **date** | Website (timestamp) |
| **customer_name** | Checkout form |
| **phone** | Checkout form |
| **email** | Checkout form (optional) |
| **address** | Checkout form |
| **city** | Checkout form |
| **items** | Website (cart summary text) |
| **total** | Website (number) |
| **payment** | Checkout: `COD` or `Bank Transfer` |
| **status** | Starts as `Pending` — change in Admin |
| **notes** | Checkout optional + Admin |

**Status values used in Admin:**  
`Pending` · `Confirmed` · `Shipped` · `Delivered` · `Cancelled`

---

## 3) How to connect SheetDB

1. Create **two** Google Sheets (or two tabs + two SheetDB APIs).  
2. Put the headers above in row 1.  
3. Go to [sheetdb.io](https://sheetdb.io) → Create API for each sheet.  
4. Copy each API URL into `js/config.js`.  
5. In SheetDB settings for each API: allow **GET, POST, PATCH, DELETE**.

---

## Admin

- URL: `admin.html`  
- Password: `zelvra2026` (change `ADMIN_PASSWORD` in config)

---

## Run

```bash
npx serve .
```
