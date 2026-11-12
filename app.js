"use strict";

const form = document.querySelector("#comparison");
const products = document.querySelector("#products");
const template = document.querySelector("#product-template");
const resultMessage = document.querySelector("#result-message");
const ranking = document.querySelector("#ranking");
const error = document.querySelector("#form-error");
const currency = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 4 });
const precise = new Intl.NumberFormat("tr-TR", { maximumSignificantDigits: 3 });
const percent = new Intl.NumberFormat("tr-TR", { style: "percent", maximumFractionDigits: 1 });

function relabel() {
  Array.from(products.children).forEach((row, index) => {
    row.querySelector("legend").textContent = "Ürün " + (index + 1);
    const remove = row.querySelector(".remove");
    remove.disabled = products.children.length <= 2;
    remove.setAttribute("aria-label", "Ürün " + (index + 1) + " satırını çıkar");
  });
}

function clearResult() {
  error.textContent = "";
  ranking.replaceChildren();
  resultMessage.textContent = "Fiyatları görmek için Karşılaştır düğmesine bas.";
}

function addProduct(values = {}, focus = false) {
  const row = template.content.firstElementChild.cloneNode(true);
  for (const [field, value] of Object.entries(values)) row.querySelector('[name="' + field + '"]').value = value;
  row.querySelector(".remove").addEventListener("click", () => {
    const nextRow = row.nextElementSibling || row.previousElementSibling;
    row.remove();
    relabel();
    clearResult();
    nextRow.querySelector('[name="name"]').focus();
  });
  products.append(row);
  relabel();
  if (focus) row.querySelector('[name="name"]').focus();
}

function showResults(event) {
  event.preventDefault();
  error.textContent = "";
  ranking.replaceChildren();
  try {
    const entries = Array.from(products.children, (row) => Object.fromEntries(
      Array.from(row.querySelectorAll("[name]"), (input) => [input.name, input.value]),
    ));
    const ordered = UnitPrices.rank(entries);
    const best = ordered.filter((product) => product.best);
    resultMessage.textContent = best.length > 1
      ? best.length + " ürün aynı en düşük birim fiyata sahip."
      : best[0].name + " en düşük birim fiyata sahip.";
    for (const product of ordered) {
      const row = document.createElement("li");
      const line = document.createElement("div");
      const name = document.createElement("strong");
      const price = document.createElement("span");
      const comparison = document.createElement("small");
      name.textContent = product.name;
      const formatted = product.perUnit > 0 && product.perUnit < 0.0001
        ? precise.format(product.perUnit) + " ₺"
        : currency.format(product.perUnit);
      price.textContent = formatted + " / " + product.base;
      comparison.textContent = product.best
        ? "En düşük birim fiyat"
        : product.premium === null ? "Daha yüksek birim fiyat" : percent.format(product.premium) + " daha pahalı";
      if (product.best) row.classList.add("best");
      line.append(name, price);
      row.append(line, comparison);
      ranking.append(row);
    }
  } catch (problem) {
    if (!(problem instanceof RangeError)) throw problem;
    resultMessage.textContent = "Geçerli ürün bilgilerini girip tekrar dene.";
    error.textContent = problem.message;
  }
}

form.addEventListener("submit", showResults);
form.addEventListener("input", clearResult);
document.querySelector("#add").addEventListener("click", () => {
  addProduct({}, true);
  clearResult();
});
document.querySelector("#example").addEventListener("click", () => {
  const hasInput = Array.from(products.querySelectorAll("[name]"))
    .some((field) => field.value !== (field.name === "unit" ? "g" : field.defaultValue));
  if (hasInput && !window.confirm("Girilen ürünler örnek ürünlerle değiştirilsin mi?")) return;
  products.replaceChildren();
  addProduct({ name: "750 g yulaf", price: "74,90", size: "750", unit: "g", packs: "1" });
  addProduct({ name: "1 kg yulaf", price: "92,50", size: "1", unit: "kg", packs: "1" });
  form.requestSubmit();
});
addProduct();
addProduct();
