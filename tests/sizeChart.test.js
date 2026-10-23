import test from "node:test";
import assert from "node:assert/strict";
import { measurementInCm, parseSizeChart, splitSizeChart } from "../client/src/utils/sizeChart.js";

test("chart references do not swallow product details or care instructions", () => {
  const text = "Sizes: M, L, XL; use the supplied garment size chart\nXXL shoulder: 15.5 inches as shown in the size chart\nCare: Dry clean only\nCountry of origin: India";
  assert.deepEqual(splitSizeChart(text), { features: text, chart: "" });
});

test("standalone chart headings split correctly with CRLF and indentation", () => {
  const chart = "Size chart in inches\r\nEach row: Age | Chest\r\n4–5 Years: 24";
  assert.deepEqual(splitSizeChart(`Fabric: cotton\r\n  ${chart}`), { features: "Fabric: cotton", chart });
  assert.deepEqual(splitSizeChart(chart), { features: "", chart });
});

test("centimetres preserve missing measurements and convert decimal values and ranges", () => {
  assert.equal(measurementInCm("10"), "25.4");
  assert.equal(measurementInCm("15.5"), "39.4");
  assert.equal(measurementInCm("16–20"), "40.6–50.8");
  for (const value of ["—", "Not supplied", "22 approx", ""]) assert.equal(measurementInCm(value), value);
});

test("existing dungaree text retains decimal measurements and readable headings", () => {
  const chart = parseSizeChart("Size chart in inches (age / top length / chest / shorts length / waist):\n0–3 Months: 10 / 16 / 8 / 15.5\n3–6 Months: 10.5 / 17 / 8.5 / 16\nAge ranges are a guide.");
  assert.equal(chart.inches, true);
  assert.deepEqual(chart.sections[0].columns, ["age", "top length", "chest", "shorts length", "waist"]);
  assert.equal(chart.sections[0].rows[1][1], "10.5");
  assert.deepEqual(chart.notes, ["Age ranges are a guide."]);
});

test("different jacket measurements remain in separate style charts", () => {
  const chart = parseSizeChart("Size chart in inches\nEach row: Age | Kurta length | Chest\nWhite – Motif Jacket\n3–4 Years | 18 | 24\nWhite – Border Jacket\n3–4 Years | 19 | 28\nAllow 0.5–1 inch variation.");
  assert.equal(chart.sections.length, 2);
  assert.equal(chart.sections[1].title, "White – Border Jacket");
  assert.deepEqual(chart.sections[1].rows[0], ["3–4 Years", "19", "28"]);
});

test("unknown or incomplete formats fall back to original text without inventing cells", () => {
  assert.equal(parseSizeChart("Size chart: contact seller for sizing"), null);
  assert.equal(parseSizeChart("Size chart in inches (age / chest / waist):\n1–2 Years: 22 / 14 / 18"), null);
});
