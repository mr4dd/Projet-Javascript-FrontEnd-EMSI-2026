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

function renderAll() {
  aPortfolio.innerHTML = portfolios.map(p => `<option value="${p.id}">${p.name}</option>`).join("");

  assetTable.innerHTML = "";
  assets.forEach(a => {
    const p = portfolios.find(p => p.id === a.portfolio);
    assetTable.innerHTML += `
    <tr>
      <td>${a.name}</td>
      <td>${a.qty}</td>
      <td>$${a.price}</td>
      <td>$${(a.qty * a.price).toFixed(2)}</td>
      <td><span class="badge">${p ? p.name : "-"}</span></td>
      <td>  <button class="edit" onclick="editAsset(${a.id})">Edit</button> </td>
      <td><button class="danger" onclick="deleteAsset(${a.id})">X</button></td>
    </tr>`;
  });

  portfolioTable.innerHTML = "";
  portfolios.forEach(p => {
    const pa = assets.filter(a => a.portfolio === p.id);
    const value = pa.reduce((s, a) => s + a.qty * a.price, 0);
    portfolioTable.innerHTML += `
    <tr>
      <td>${p.name}</td>
      <td>${pa.length}</td>
      <td>$${value.toFixed(2)}</td>
      <td><button class="danger" onclick="deletePortfolio(${p.id})">X</button></td>
    </tr>`;
  });

  updateDashboard();
}

async function loadBTC() {
  const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
  btcPrice.textContent = "$" + (await r.json()).bitcoin.usd;
}

function initChart() {
  const ctx = document.getElementById("chart");
  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: [],
      datasets: [{
        label: "%",
        data: [],
        backgroundColor: [
          "#22c55e", "#38bdf8", "#a855f7",
          "#f59e0b", "#ef4444", "#14b8a6"
        ]
      }]
    }
  });
}

function initAssetChart() {
  const ctx = document.getElementById("assetChart");
  assetChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [],
      datasets: [{
        label: "Asset Value ($)",
        data: [],
        backgroundColor: "#38bdf8"
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function updateDashboard() {
  kpiAssets.textContent = assets.length;
  kpiPortfolios.textContent = portfolios.length;
  
  const totalValue = assets.reduce((s, a) => s + a.qty * a.price, 0);
  kpiValue.textContent = "$" + totalValue.toFixed(2);

  const grouped = {};
  assets.forEach(a => {
    const p = portfolios.find(p => p.id === a.portfolio);
    if (!p) return;
    grouped[p.name] = (grouped[p.name] || 0) + (a.qty * a.price);
  });

  chart.data.labels = Object.keys(grouped);
  chart.data.datasets[0].data = Object.values(grouped).map(value => {
    return totalValue > 0 ? ((value / totalValue) * 100).toFixed(2) : 0;
  });
  chart.update();

  const byAsset = {};
  assets.forEach(a => {
    byAsset[a.name] = (byAsset[a.name] || 0) + (a.qty * a.price);
  });

  assetChart.data.labels = Object.keys(byAsset);
  assetChart.data.datasets[0].data = Object.values(byAsset);
  assetChart.update();
}

function search(e) {
  e.preventDefault();
  const searchVal = document.querySelector("#aSearch").value.toLowerCase();
  if (searchVal != "") {
    const folioIndex = portfolios.findIndex(a => a.name.toLowerCase() === searchVal);
    const folioId = folioIndex !== -1 ? portfolios[folioIndex].id : null;
    assetTable.innerHTML = "";
    assets.forEach(v => {
      if (v.name.toLowerCase() == searchVal || v.portfolio == folioId) {
        const p = portfolios[portfolios.findIndex(a => a.id == v.portfolio)].name;
        assetTable.innerHTML += `
          <tr>
            <td>${v.name}</td>
            <td>${v.qty}</td>
            <td>$${v.price}</td>
            <td>$${(v.qty * v.price).toFixed(2)}</td>
            <td><span class="badge">${p ? p : "-"}</span></td>
            <td>  <button class="edit" onclick="editAsset(${v.id})">Edit</button> </td>
            <td><button class="danger" onclick="deleteAsset(${v.id})">X</button></td>
          </tr>`;
      }
    });
  } else {
    renderAll();
  }
}

initChart();
initAssetChart();
renderAll();
loadBTC();
