"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const prices = require("./prices.js");

function product(price, size, unit, packs = "1") {
  return { price, size, unit, packs };
}

test("normalizes grams and kilograms and ranks cheaper products first", () => {
  const ranked = prices.rank([product("74,90", "750", "g"), product("92,50", "1", "kg")]);
  assert.equal(ranked[0].perUnit, 92.5);
  assert.equal(ranked[0].name, "Ürün 2");
  assert.equal(ranked[1].perUnit, 74.9 / 0.75);
});

test("normalizes multipacks and liquid volume", () => {
  const [best, second] = prices.rank([product("99", "330", "ml", "6"), product("60", "1", "l")]);
  assert.equal(best.amount, 1.98);
  assert.equal(best.perUnit, 50);
  assert.equal(second.perUnit, 60);
  assert.equal(second.premium, 0.2);
});

test("retains ties and handles a zero price without dividing by zero", () => {
  const tied = prices.rank([product("10", "5", "piece"), product("2", "1", "piece")]);
  assert.ok(tied.every((item) => item.best));
  const free = prices.rank([product("0", "1", "l"), product("1", "1", "l")]);
  assert.equal(free[0].perUnit, 0);
  assert.equal(free[1].premium, null);
});

test("rejects incompatible dimensions, zero quantity and fractional pack counts", () => {
  const baseline = product("10", "100", "g");
  assert.throws(() => prices.rank([baseline, product("5", "100", "ml")]), /ölçü birimlerini/);
  assert.throws(() => prices.rank([baseline, product("5", "0", "g")]), /miktar/);
  assert.throws(() => prices.rank([baseline, product("5", "2", "g", "1.5")]), /paket sayısı/);
});

test("accepts decimal comma and point and rejects mixed separators or signs", () => {
  assert.equal(prices.decimal(",5"), 0.5);
  assert.equal(prices.decimal("9.75"), 9.75);
  assert.ok(Number.isNaN(prices.decimal("1.000,5")));
  assert.ok(Number.isNaN(prices.decimal("-2")));
});
