import test from "node:test";
import assert from "node:assert/strict";
import { evaluateProfile, getConsumptionLevel } from "./scoring.js";

const baseProfile = {
  postalCode: "69003",
  housingType: "house",
  occupancyStatus: "owner",
  surface: "100",
  occupants: "3",
  mainEnergy: "electricity",
  heatingType: "electric-modern",
  monthlyBill: "130",
  annualConsumption: "12000",
  provider: ""
};

test("une maison occupée par son propriétaire rend le solaire explorable", () => {
  const result = evaluateProfile(baseProfile);
  const solar = result.recommendations.find((item) => item.id === "solar");
  assert.ok(solar.score >= 45);
  assert.notEqual(solar.level, "low");
});

test("un locataire en appartement a une pertinence solaire faible", () => {
  const result = evaluateProfile({ ...baseProfile, housingType: "apartment", occupancyStatus: "tenant" });
  const solar = result.recommendations.find((item) => item.id === "solar");
  assert.equal(solar.level, "low");
  assert.match(solar.explanation, /locataire/i);
});

test("une forte consommation avec chauffage ancien priorise le chauffage", () => {
  const result = evaluateProfile({ ...baseProfile, heatingType: "electric-old", annualConsumption: "26000", provider: "" });
  const heating = result.recommendations.find((item) => item.id === "heating");
  assert.equal(heating.level, "high");
  assert.equal(result.priority.id, "heating");
});

test("un chauffage performant réduit son score", () => {
  const efficient = evaluateProfile({ ...baseProfile, heatingType: "heat-pump" });
  const old = evaluateProfile({ ...baseProfile, heatingType: "electric-old" });
  assert.ok(efficient.recommendations.find((item) => item.id === "heating").score < old.recommendations.find((item) => item.id === "heating").score);
});

test("la consommation annuelle est rapportée à la surface", () => {
  assert.equal(getConsumptionLevel({ annualConsumption: 20000, surface: 80, monthlyBill: 10 }).key, "high");
  assert.equal(getConsumptionLevel({ annualConsumption: 7000, surface: 100, monthlyBill: 500 }).key, "low");
});

test("le fournisseur connu renforce la piste de comparaison", () => {
  const unknown = evaluateProfile(baseProfile);
  const known = evaluateProfile({ ...baseProfile, provider: "EDF" });
  assert.ok(known.recommendations.find((item) => item.id === "energy").score > unknown.recommendations.find((item) => item.id === "energy").score);
});
