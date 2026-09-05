/* VentiRetail — shared behaviour: catalog, cart, drawer, nav, reveal */

const CATALOG = [
  { id: 'p01', name: 'Ceramic Coffee Mug', cat: 'home', price: 950, img: 'mug' },
  { id: 'p02', name: 'Sisal Storage Basket', cat: 'home', price: 2400, img: 'basket' },
  { id: 'p03', name: 'Olive Wood Serving Spoons', cat: 'home', price: 1450, img: 'spoons' },
  { id: 'p04', name: 'AA Grade Coffee Beans 500g', cat: 'pantry', price: 1200, img: 'coffee' },
  { id: 'p05', name: 'Loose Leaf Green Tea 250g', cat: 'pantry', price: 780, img: 'tea' },
  { id: 'p06', name: 'Macadamia Nuts 300g', cat: 'pantry', price: 990, img: 'macadamia' },
  { id: 'p07', name: 'Acacia Honey 500ml', cat: 'pantry', price: 1350, img: 'honey' },
  { id: 'p08', name: 'Cold Pressed Olive Oil 500ml', cat: 'pantry', price: 1650, img: 'oliveoil' },
  { id: 'p09', name: 'Dried Chillies 100g', cat: 'pantry', price: 320, img: 'chilli' },
  { id: 'p10', name: 'Canvas Market Tote', cat: 'carry', price: 1750, img: 'tote' },
  { id: 'p11', name: 'Leather Card Wallet', cat: 'carry', price: 2200, img: 'wallet' },
  { id: 'p12', name: 'Shea Body Butter 200ml', cat: 'care', price: 890, img: 'shea' },
  { id: 'p13', name: 'Olive Oil Soap Bar', cat: 'care', price: 450, img: 'soap' }
];

const CATS = { home: 'Home', pantry: 'Pantry', carry: 'Carry', care: 'Care' };

const money = n => 'KSh ' + n.toLocaleString('en-KE');
const imgSrc = p => 'assets/products/' + p.img + '.jpg';

/* ---------- cart store ---------- */

const Cart = {
  key: 'ventiretail.cart',
  read() {
    try { return JSON.parse(localStorage.getItem(this.key)) || {}; }
    catch (e) { return {}; }
  },
  write(data) {
    try { localStorage.setItem(this.key, JSON.stringify(data)); } catch (e) {}
    render();
  },
  add(id) {
    const data = this.read();
    data[id] = (data[id] || 0) + 1;
    this.write(data);
  },
  set(id, qty) {
    const data = this.read();
    if (qty <= 0) delete data[id]; else data[id] = qty;
    this.write(data);
  },
  remove(id) {
    const data = this.read();
    delete data[id];
    this.write(data);
  },
  items() {
    const data = this.read();
    return Object.keys(data)
      .map(id => {
        const p = CATALOG.find(x => x.id === id);
        return p ? Object.assign({}, p, { qty: data[id] }) : null;
      })
      .filter(Boolean);
  },
  count() { return this.items().reduce((n, i) => n + i.qty, 0); },
  total() { return this.items().reduce((n, i) => n + i.qty * i.price, 0); }
};

/* ---------- drawer render ---------- */

function render() {
  const badge = document.querySelector('[data-cart-count]');
  const body = document.querySelector('[data-cart-body]');
  const totalEl = document.querySelector('[data-cart-total]');
  const items = Cart.items();

  if (badge) {
    const n = Cart.count();
    badge.textContent = n;
    badge.hidden = n === 0;
  }

  if (!body) return;

  if (!items.length) {
    body.innerHTML = '<p class="drawer-empty">Your bag is empty.</p>';
  } else {
    body.innerHTML = items.map(i => `
      <div class="line-item">
        <div class="line-thumb"><img src="${imgSrc(i)}" alt="${i.name}"></div>
        <div class="line-info">
          <span class="card-cat">${CATS[i.cat]}</span>
          <span class="card-name">${i.name}</span>
          <span class="line-price">${money(i.price)}</span>
          <div class="qty">
            <button type="button" data-step="-1" data-id="${i.id}" aria-label="Decrease quantity">&minus;</button>
            <span>${i.qty}</span>
            <button type="button" data-step="1" data-id="${i.id}" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <button type="button" class="remove" data-drop="${i.id}">Remove</button>
      </div>
    `).join('');
  }

  if (totalEl) totalEl.textContent = money(Cart.total());
}

/* ---------- product cards ---------- */

function cardMarkup(p) {
  return `
    <article class="card" data-cat="${p.cat}">
      <div class="card-media"><img src="${imgSrc(p)}" alt="${p.name}" loading="lazy"></div>
      <div class="card-body">
        <span class="card-cat">${CATS[p.cat]}</span>
        <h3 class="card-name">${p.name}</h3>
        <div class="card-foot">
          <span class="price">${money(p.price)}</span>
          <button type="button" class="add" data-add="${p.id}">Add to bag</button>
        </div>
      </div>
    </article>`;
}

function mountGrid(el, list) {
  el.innerHTML = list.map(cardMarkup).join('');
}

/* ---------- boot ---------- */

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.querySelector('[data-grid]');
  if (grid) {
    const limit = parseInt(grid.dataset.limit || '0', 10);
    mountGrid(grid, limit ? CATALOG.slice(0, limit) : CATALOG);
  }

  const search = document.querySelector('[data-search]');
  if (search && grid) {
    search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      const list = q
        ? CATALOG.filter(p => (p.name + ' ' + CATS[p.cat]).toLowerCase().includes(q))
        : CATALOG;
      if (list.length) mountGrid(grid, list);
      else grid.innerHTML = '<p class="empty-state">Nothing matches that search.</p>';
    });
  }

  document.addEventListener('click', e => {
    const add = e.target.closest('[data-add]');
    if (add) {
      Cart.add(add.dataset.add);
      add.classList.add('added');
      add.textContent = 'Added';
      setTimeout(() => {
        add.classList.remove('added');
        add.textContent = 'Add to bag';
      }, 1200);
    }

    const step = e.target.closest('[data-step]');
    if (step) {
      const item = Cart.items().find(i => i.id === step.dataset.id);
      if (item) Cart.set(item.id, item.qty + parseInt(step.dataset.step, 10));
    }

    const drop = e.target.closest('[data-drop]');
    if (drop) Cart.remove(drop.dataset.drop);
  });

  /* drawer */
  const drawer = document.querySelector('[data-drawer]');
  const overlay = document.querySelector('[data-overlay]');
  const openDrawer = () => { drawer.classList.add('open'); overlay.classList.add('open'); };
  const closeDrawer = () => { drawer.classList.remove('open'); overlay.classList.remove('open'); };

  if (drawer && overlay) {
    document.querySelectorAll('[data-cart-open]').forEach(b => b.addEventListener('click', openDrawer));
    document.querySelectorAll('[data-cart-close]').forEach(b => b.addEventListener('click', closeDrawer));
    overlay.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
  }

  /* mobile nav */
  const toggle = document.querySelector('[data-menu]');
  const nav = document.querySelector('.nav');
  if (toggle && nav) toggle.addEventListener('click', () => nav.classList.toggle('open'));

  /* reveal on scroll */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* forms are static demos */
  document.querySelectorAll('form[data-demo]').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const note = form.querySelector('[data-note]');
      if (note) note.textContent = form.dataset.demo;
      if (form.dataset.reset === 'true') form.reset();
    });
  });

  render();
});
