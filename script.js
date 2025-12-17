const btcPrice = document.querySelector("#btcPrice");
const assetName = document.querySelector("#aName");
const assetPrice = document.querySelector("#aPrice");

const COIN_BY_SYMBOL = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  BNB: "binancecoin",
  SOL: "solana"
};

let editingAssetId = null;

let assets = JSON.parse(localStorage.getItem("assets") || "[]");
let portfolios = JSON.parse(localStorage.getItem("portfolios") || "[]");

function addPortfolio(e) {
  e.preventDefault();
  portfolios.push({ id: Date.now(), name: pName.value });
  localStorage.setItem("portfolios", JSON.stringify(portfolios));
  e.target.reset();
  renderAll();
}
function deletePortfolio(id) {
  assets = assets.map(a => a.portfolio === id ? { ...a, portfolio: null } : a);
  portfolios = portfolios.filter(p => p.id !== id);
  localStorage.setItem("portfolios", JSON.stringify(portfolios));
  localStorage.setItem("assets", JSON.stringify(assets));
  renderAll();
}

function addAsset(e) {
  e.preventDefault();

  if (editingAssetId) {
    const asset = assets.find(a => a.id === editingAssetId);
    asset.name = aName.value;
    asset.qty = +aQty.value;
    asset.price = +aPrice.value;
    asset.portfolio = +aPortfolio.value;
    editingAssetId = null;
  } else {
    assets.push({
      id: Date.now(),
      name: aName.value,
      qty: +aQty.value,
      price: +aPrice.value,
      portfolio: +aPortfolio.value
    });
  }

  localStorage.setItem("assets", JSON.stringify(assets));
  e.target.reset();
  renderAll();
}
function deleteAsset(id) {
  assets = assets.filter(a => a.id !== id);
  localStorage.setItem("assets", JSON.stringify(assets));
  renderAll();
}
function editAsset(id) {
  const asset = assets.find(a => a.id === id);
  if (!asset) return;

  editingAssetId = id;

  aName.value = asset.name;
  aQty.value = asset.qty;
  aPrice.value = asset.price;
  aPortfolio.value = asset.portfolio;
}

function show(id) {
  document.querySelectorAll("section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  [...document.querySelectorAll("nav button")].find(b => b.textContent.toLowerCase().includes(id)).classList.add("active");
}

function getCoinName(symbol) {
  return COIN_BY_SYMBOL[symbol.toUpperCase()] || symbol;
}
async function checkAndPopulate() {
  if (assetName.value.length >= 3) {
    const asset = getCoinName(assetName.value);
    const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${asset}&vs_currencies=usd`);
    assetPrice.textContent = (await r.json())[asset].usd;
    assetPrice.value = assetPrice.textContent;
  }
}

assetName.addEventListener("input", async () => { await checkAndPopulate() });

