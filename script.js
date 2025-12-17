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

