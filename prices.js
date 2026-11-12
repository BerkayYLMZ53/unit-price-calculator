"use strict";

const UnitPrices = (() => {
  const units = Object.freeze({
    g: { base: "kg", factor: 0.001 },
    kg: { base: "kg", factor: 1 },
    ml: { base: "L", factor: 0.001 },
    l: { base: "L", factor: 1 },
    piece: { base: "adet", factor: 1 },
  });

  function decimal(input) {
    const text = String(input ?? "").trim();
    if (!/^(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(text)) return NaN;
    return Number(text.replace(",", "."));
  }

  function normalize(product, index) {
    const number = index + 1;
    const name = String(product.name ?? "").trim() || "Ürün " + number;
    const price = decimal(product.price);
    const size = decimal(product.size);
    const packText = String(product.packs ?? "").trim() || "1";
    const packs = /^\d+$/.test(packText) ? Number(packText) : NaN;
    const unit = Object.hasOwn(units, product.unit) ? units[product.unit] : null;
    if (!Number.isFinite(price) || price < 0) throw new RangeError(name + " için geçerli bir toplam fiyat gir.");
    if (!Number.isFinite(size) || size <= 0 || !unit) throw new RangeError(name + " için sıfırdan büyük bir miktar gir.");
    if (!Number.isSafeInteger(packs) || packs <= 0) throw new RangeError(name + " için paket sayısı pozitif tam sayı olmalı.");
    const amount = size * unit.factor * packs;
    const perUnit = price / amount;
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(perUnit)) {
      throw new RangeError(name + " için fiyat veya miktar hesaplanabilir aralığın dışında.");
    }
    return { name, amount, base: unit.base, perUnit, index };
  }

  function rank(products) {
    if (products.length < 2) throw new RangeError("En az iki ürün gir.");
    const ranked = products.map(normalize);
    const base = ranked[0].base;
    if (ranked.some((product) => product.base !== base)) {
      throw new RangeError("Aynı tür ölçü birimlerini seç. Gram ve kilogram kendi arasında, litre ve mililitre kendi arasında karşılaştırılır.");
    }
    ranked.sort((a, b) => a.perUnit - b.perUnit || a.index - b.index);
    const lowest = ranked[0].perUnit;
    return ranked.map((product) => {
      const delta = product.perUnit - lowest;
      const best = delta <= 1e-10 * Math.max(product.perUnit, lowest);
      const premium = lowest > 0 ? delta / lowest : null;
      return { ...product, best, premium: Number.isFinite(premium) ? premium : null };
    });
  }

  return { decimal, rank };
})();

if (typeof module !== "undefined") module.exports = UnitPrices;
