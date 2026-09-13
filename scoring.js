const LEVELS = {
  high: { label: "Très pertinent", shortLabel: "Priorité forte", rank: 3 },
  medium: { label: "À explorer", shortLabel: "Pertinent", rank: 2 },
  low: { label: "Peu pertinent", shortLabel: "Faible priorité", rank: 1 }
};

const HEATING_LABELS = {
  "electric-old": "Radiateurs électriques anciens",
  "electric-modern": "Radiateurs électriques récents",
  "gas-old": "Chaudière gaz ancienne",
  "gas-modern": "Chaudière gaz récente",
  "heat-pump": "Pompe à chaleur",
  wood: "Chauffage au bois",
  district: "Chauffage collectif",
  other: "Chauffage non précisé"
};

const ENERGY_LABELS = {
  electricity: "Électricité",
  gas: "Gaz",
  other: "Autre énergie"
};

function levelFromScore(score) {
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}

export function getConsumptionLevel(profile) {
  const annual = Number(profile.annualConsumption) || 0;
  const surface = Math.max(Number(profile.surface) || 1, 1);
  const bill = Number(profile.monthlyBill) || 0;

  if (annual > 0) {
    const intensity = annual / surface;
    if (intensity >= 190) return { key: "high", label: "Élevé", source: "consumption" };
    if (intensity >= 100) return { key: "medium", label: "Intermédiaire", source: "consumption" };
    return { key: "low", label: "Modéré", source: "consumption" };
  }

  const billPerSqm = (bill * 12) / surface;
  if (billPerSqm >= 24) return { key: "high", label: "À surveiller", source: "bill" };
  if (billPerSqm >= 14) return { key: "medium", label: "Intermédiaire", source: "bill" };
  return { key: "low", label: "Modéré", source: "bill" };
}

export function evaluateProfile(profile) {
  const consumption = getConsumptionLevel(profile);
  const isHighConsumption = consumption.key === "high";
  const isMediumConsumption = consumption.key === "medium";
  const isOwnerHouse = profile.occupancyStatus === "owner" && profile.housingType === "house";
  const oldHeating = ["electric-old", "gas-old"].includes(profile.heatingType);
  const efficientHeating = ["heat-pump", "wood", "district"].includes(profile.heatingType);

  let energyScore = 42;
  if (isHighConsumption) energyScore += 28;
  else if (isMediumConsumption) energyScore += 15;
  if (profile.provider?.trim()) energyScore += 10;
  if (Number(profile.monthlyBill) >= 180) energyScore += 8;
  energyScore = Math.min(100, energyScore);

  let solarScore = 10;
  if (isOwnerHouse) {
    solarScore = 52;
    if (isHighConsumption) solarScore += 25;
    else if (isMediumConsumption) solarScore += 13;
    if (profile.mainEnergy === "electricity") solarScore += 7;
    if (Number(profile.surface) >= 100) solarScore += 5;
  }
  solarScore = Math.min(100, solarScore);

  let heatingScore = 30;
  if (oldHeating) heatingScore += 32;
  if (isHighConsumption) heatingScore += 30;
  else if (isMediumConsumption) heatingScore += 12;
  if (efficientHeating) heatingScore -= 18;
  if (profile.heatingType === "electric-modern" || profile.heatingType === "gas-modern") heatingScore -= 7;
  heatingScore = Math.max(5, Math.min(100, heatingScore));

  const solarExplanation = !isOwnerHouse
    ? profile.occupancyStatus === "tenant"
      ? "En tant que locataire, un projet photovoltaïque individuel est rarement l’action la plus directe."
      : "En appartement, une étude solaire individuelle est généralement moins adaptée."
    : isHighConsumption
      ? "Votre maison et votre niveau de consommation justifient d’évaluer la faisabilité photovoltaïque."
      : "Votre profil est compatible avec une première étude de potentiel, sous réserve de la toiture."

  const heatingExplanation = oldHeating && isHighConsumption
    ? "Votre consommation et l’ancienneté déclarée du chauffage en font un poste à examiner en priorité."
    : efficientHeating
      ? "Votre système déclaré est déjà plutôt performant  ; l’optimisation des usages peut suffire."
      : isHighConsumption
        ? "Le chauffage peut représenter une part importante de votre consommation et mérite une analyse."
        : "Aucun signal fort ne place le chauffage en tête, mais vos réglages restent à vérifier."

  const energyExplanation = profile.provider?.trim()
    ? `Votre fournisseur actuel (${profile.provider.trim()}) est connu : une comparaison de contrat peut être utile.`
    : isHighConsumption
      ? "Votre niveau de facture ou de consommation justifie de vérifier l’adéquation de votre contrat."
      : "Votre contrat reste analysable, même si aucun signal d’alerte majeur n’apparaît."

  const recommendations = [
    {
      id: "energy",
      icon: "⚡",
      title: "Électricité / Gaz",
      score: energyScore,
      level: levelFromScore(energyScore),
      explanation: energyExplanation,
      action: "Explorer les offres",
      detail: "Comparer les caractéristiques des offres adaptées à votre profil sera testé prochainement."
    },
    {
      id: "solar",
      icon: "☀",
      title: "Solaire",
      score: solarScore,
      level: levelFromScore(solarScore),
      explanation: solarExplanation,
      action: "Évaluer mon potentiel solaire",
      detail: "L’étude de compatibilité de votre toiture sera testée prochainement."
    },
    {
      id: "heating",
      icon: "♨",
      title: "Chauffage",
      score: heatingScore,
      level: levelFromScore(heatingScore),
      explanation: heatingExplanation,
      action: "Analyser mon chauffage",
      detail: "L’analyse détaillée de votre système de chauffage sera testée prochainement."
    }
  ].map((item) => ({ ...item, levelLabel: LEVELS[item.level].label, rank: LEVELS[item.level].rank }));

  recommendations.sort((a, b) => b.score - a.score);

  return {
    consumption,
    recommendations,
    priority: recommendations[0],
    labels: {
      home: `${profile.housingType === "house" ? "Maison" : "Appartement"} de ${Number(profile.surface)} m²`,
      occupancy: profile.occupancyStatus === "owner" ? "Propriétaire" : "Locataire",
      occupants: `${profile.occupants} occupant${Number(profile.occupants) > 1 ? "s" : ""}`,
      heating: HEATING_LABELS[profile.heatingType] || HEATING_LABELS.other,
      energy: ENERGY_LABELS[profile.mainEnergy] || ENERGY_LABELS.other
    }
  };
}

export { LEVELS };
