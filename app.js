import { evaluateProfile } from "./scoring.js";

const views = [...document.querySelectorAll(".view")];
const form = document.querySelector("#energy-form");
const steps = [...document.querySelectorAll(".form-step")];
const nextButton = document.querySelector("#next-step");
const previousButton = document.querySelector("#previous-step");
const errorMessage = document.querySelector("#form-error");
const dialog = document.querySelector("#coming-soon");
let currentStep = 1;

const stepMeta = [
  { label: "Étape 1 sur 3", title: "Votre logement", percent: 33 },
  { label: "Étape 2 sur 3", title: "Vos usages", percent: 66 },
  { label: "Étape 3 sur 3", title: "Votre facture", percent: 100 }
];

function showView(id) {
  views.forEach((view) => view.classList.toggle("is-active", view.id === id));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateStep() {
  steps.forEach((step) => step.classList.toggle("is-active", Number(step.dataset.step) === currentStep));
  const meta = stepMeta[currentStep - 1];
  document.querySelector("#progress-label").textContent = meta.label;
  document.querySelector("#progress-title").textContent = meta.title;
  document.querySelector("#progress-percent").textContent = `${meta.percent}%`;
  document.querySelector("#progress-bar").style.width = `${meta.percent}%`;
  previousButton.classList.toggle("is-hidden", currentStep === 1);
  nextButton.innerHTML = currentStep === steps.length ? "Voir mon diagnostic <span>→</span>" : "Continuer <span>→</span>";
  errorMessage.textContent = "";
}

function validateCurrentStep() {
  const controls = [...steps[currentStep - 1].querySelectorAll("input, select")];
  const firstInvalid = controls.find((control) => !control.checkValidity());
  if (firstInvalid) {
    errorMessage.textContent = "Complétez les champs indiqués pour continuer.";
    firstInvalid.reportValidity();
    return false;
  }
  return true;
}

function getProfile() {
  return Object.fromEntries(new FormData(form).entries());
}

function renderResults(result) {
  document.querySelector("#summary-home").textContent = result.labels.home;
  document.querySelector("#summary-details").textContent = `${result.labels.occupancy} · ${result.labels.occupants} · ${result.labels.heating}`;
  document.querySelector("#summary-consumption").textContent = result.consumption.label;
  document.querySelector("#summary-consumption-note").textContent = result.consumption.source === "consumption" ? "Selon la consommation déclarée" : "Estimation selon la facture déclarée";
  document.querySelector("#summary-energy").textContent = result.labels.energy;
  document.querySelector("#priority-title").textContent = `${result.priority.title} ressort en premier`;
  document.querySelector("#priority-copy").textContent = result.priority.explanation;

  const grid = document.querySelector("#recommendation-grid");
  grid.innerHTML = result.recommendations.map((item, index) => `
    <article class="recommendation-card ${item.id} ${index === 0 ? "is-priority" : ""}">
      ${index === 0 ? '<span class="priority-badge">Priorité n°1</span>' : ""}
      <div class="recommendation-top">
        <span class="recommendation-icon">${item.icon}</span>
        <span class="level level-${item.level}"><i></i>${item.levelLabel}</span>
      </div>
      <h3>${item.title}</h3>
      <div class="score-line"><span>PERTINENCE POUR VOTRE PROFIL</span><b>${item.score}<small>/100</small></b></div>
      <div class="score-bar"><i style="width:${item.score}%"></i></div>
      <p>${item.explanation}</p>
      <button class="button card-action" type="button" data-action="${item.id}" data-title="${item.action}" data-detail="${item.detail}" data-icon="${item.icon}">${item.action}<span>→</span></button>
    </article>
  `).join("");

  grid.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelector("#dialog-icon").textContent = button.dataset.icon;
      document.querySelector("#dialog-title").textContent = button.dataset.title;
      document.querySelector("#dialog-copy").textContent = button.dataset.detail;
      dialog.showModal();
    });
  });
}

async function runAnalysis() {
  showView("analysis");
  const status = document.querySelector("#analysis-status");
  const messages = ["Lecture de votre profil énergétique…", "Évaluation des trois axes…", "Classement de vos priorités…"];
  for (const message of messages) {
    status.textContent = message;
    await new Promise((resolve) => setTimeout(resolve, 520));
  }
  const result = evaluateProfile(getProfile());
  renderResults(result);
  showView("results");
}

document.querySelectorAll("[data-start]").forEach((button) => button.addEventListener("click", () => showView("diagnostic")));
document.querySelector("[data-back-home]").addEventListener("click", () => showView("landing"));
document.querySelectorAll("[data-restart]").forEach((button) => button.addEventListener("click", () => {
  form.reset();
  currentStep = 1;
  updateStep();
  showView("diagnostic");
}));

nextButton.addEventListener("click", () => {
  if (!validateCurrentStep()) return;
  if (currentStep < steps.length) {
    currentStep += 1;
    updateStep();
    document.querySelector(".diagnostic-shell").scrollIntoView({ behavior: "smooth" });
  } else {
    runAnalysis();
  }
});

previousButton.addEventListener("click", () => {
  currentStep -= 1;
  updateStep();
});

form.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target.tagName !== "BUTTON") {
    event.preventDefault();
    nextButton.click();
  }
});

dialog.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
dialog.querySelector("[data-dialog-close]").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

updateStep();
