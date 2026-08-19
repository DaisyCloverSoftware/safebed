import {
  availabilityLabel,
  nextAction,
  searchSyntheticServices,
  syntheticServices,
  visibleDestination,
} from "./model.js";

const state = {
  route: null,
  offline: false,
  need: null,
};

const views = [...document.querySelectorAll(".view")];
const startView = document.querySelector("#start-view");
const searchView = document.querySelector("#search-view");
const resultsView = document.querySelector("#results-view");
const providerView = document.querySelector("#provider-view");
const searchForm = document.querySelector("#search-form");
const resultsList = document.querySelector("#results-list");
const resultsSummary = document.querySelector("#results-summary");
const resultsContext = document.querySelector("#results-context");
const roleContext = document.querySelector("#role-context");
const noPlacement = document.querySelector("#no-placement");
const mapElement = document.querySelector("#synthetic-map");
const offlineToggle = document.querySelector("#offline-toggle");
const offlineBanner = document.querySelector("#offline-banner");
const announcement = document.querySelector("#announcement");
const dialog = document.querySelector("#action-dialog");
const dialogTitle = document.querySelector("#dialog-title");
const dialogContent = document.querySelector("#dialog-content");
const dialogActions = document.querySelector("#dialog-actions");

const routeLabels = {
  PERSON: "Searching for yourself",
  SUPPORTER: "Helping someone else",
  PROFESSIONAL: "Verified professional demonstration",
};

function announce(message) {
  announcement.textContent = "";
  window.setTimeout(() => { announcement.textContent = message; }, 10);
}

function showView(target) {
  for (const view of views) view.hidden = view !== target;
  target.focus?.();
  window.scrollTo({ top: 0, behavior: "instant" });
}

function policyRole() {
  if (state.route === "PROFESSIONAL") return "VERIFIED_PROFESSIONAL";
  return "PUBLIC";
}

function actionNote(service) {
  const mode = service.capabilities.integrationMode;
  if (mode === "READ_ONLY_FEED") return "Live feed only — referral stays with the provider's existing route.";
  if (mode === "SAFEBED_PORTAL") return "Provider participates through a SafeBed portal workflow.";
  if (mode === "MANUAL_CONFIRMATION") return "A reported number is not enough; staff confirmation is required.";
  if (mode === "RESTRICTED_SPECIALIST") return "Protected specialist pathway — exact location is not public.";
  return "Transactional synthetic integration supports referral and a time-limited hold.";
}

function statusClass(service) {
  if (state.offline) return "status-unavailable";
  if (service.availability.state === "MANUAL_CONFIRMATION_REQUIRED") return "status-manual";
  if (["AVAILABLE", "LIMITED"].includes(service.availability.state)) return "status-confirmed";
  return "status-unavailable";
}

function renderResults() {
  const matches = searchSyntheticServices(state.need);
  const suitable = matches.filter(({ match }) => match.state === "SUITABLE");
  const confirmed = suitable.filter(({ service }) => ["AVAILABLE", "LIMITED"].includes(service.availability.state));

  resultsContext.textContent = `${routeLabels[state.route]} · ${state.need.location}`;
  resultsSummary.textContent = state.offline
    ? "Service information is visible, but live capacity is deliberately treated as unconfirmed while offline."
    : `${confirmed.length} synthetic option${confirmed.length === 1 ? "" : "s"} currently has confirmed capacity and matches the information entered.`;

  resultsList.replaceChildren();

  for (const { service, match } of matches) {
    const card = document.createElement("article");
    card.className = "result-card";

    const distance = service.distanceMiles == null ? "Location protected" : `${service.distanceMiles.toFixed(1)} miles away`;
    const statusText = state.offline ? "Availability cannot be confirmed while offline" : availabilityLabel(service);
    const action = nextAction(service, policyRole());
    const matched = match.state === "SUITABLE";
    const actionDisabled = state.offline || !matched;

    card.innerHTML = `
      <p class="eyebrow">${service.disclosure === "RESTRICTED" ? "Protected service" : "Synthetic accommodation"}</p>
      <h2>${service.name}</h2>
      <div class="result-meta">
        <span>${service.area}</span>
        <span>${distance}</span>
        <span>Check-in: ${service.checkIn}</span>
      </div>
      <p class="status-line ${statusClass(service)}">${statusText}</p>
      ${matched ? "" : `<div class="match-warning"><strong>This does not currently match.</strong><ul>${match.reasons.map((reason) => `<li>${reason}</li>`).join("")}</ul></div>`}
      <p class="capability-note">${actionNote(service)}</p>
      <div class="result-footer">
        ${matched ? `<button class="result-action" type="button" data-service="${service.id}" data-action="${action.code}" ${actionDisabled ? "disabled" : ""}>${state.offline ? "Live action unavailable" : action.label}</button>` : ""}
      </div>
    `;
    resultsList.append(card);
  }

  noPlacement.hidden = confirmed.length > 0 && !state.offline;
  renderMap(matches);
}

function renderMap(matches) {
  mapElement.replaceChildren();
  for (const { service, match } of matches) {
    if (match.state !== "SUITABLE") continue;

    const marker = document.createElement("span");
    marker.style.setProperty("--x", service.map.x);
    marker.style.setProperty("--y", service.map.y);
    if (service.map.kind === "region") {
      marker.className = "map-region";
      marker.style.setProperty("--radius", service.map.radius ?? 10);
    } else {
      marker.className = "map-point";
    }
    mapElement.append(marker);

    const label = document.createElement("span");
    label.className = "map-label";
    label.style.setProperty("--x", service.map.x);
    label.style.setProperty("--y", service.map.y);
    label.textContent = service.map.kind === "region" ? "Protected area" : service.name.replace("Synthetic ", "");
    mapElement.append(label);
  }
}

function setResultTab(tab) {
  const listTab = document.querySelector("#list-tab");
  const mapTab = document.querySelector("#map-tab");
  const listPanel = document.querySelector("#list-panel");
  const mapPanel = document.querySelector("#map-panel");
  const listSelected = tab === "list";
  listTab.setAttribute("aria-selected", String(listSelected));
  mapTab.setAttribute("aria-selected", String(!listSelected));
  listPanel.hidden = !listSelected;
  mapPanel.hidden = listSelected;
}

function makeDialogButton(label, handler, className = "primary") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", handler);
  return button;
}

function openInformationalDialog(title, html) {
  dialogTitle.textContent = title;
  dialogContent.innerHTML = html;
  dialogActions.replaceChildren(makeDialogButton("Close", () => dialog.close(), "secondary"));
  dialog.showModal();
}

function openReferralFlow(service, specialist = false) {
  let step = 0;

  function renderStep() {
    dialogActions.replaceChildren();
    if (step === 0) {
      dialogTitle.textContent = specialist ? "Specialist referral submitted" : "Referral submitted";
      dialogContent.innerHTML = `
        <p>The synthetic referral is awaiting provider review.</p>
        <p><strong>No place is confirmed yet.</strong> SafeBed must distinguish submission from acceptance.</p>
      `;
      dialogActions.append(makeDialogButton("Simulate provider acceptance", () => { step = 1; renderStep(); }));
    } else if (step === 1) {
      dialogTitle.textContent = service.capabilities.holdSupported ? "Referral accepted — place held" : "Referral accepted";
      dialogContent.innerHTML = service.capabilities.holdSupported
        ? `<p>The provider accepted the synthetic referral and granted a time-limited hold.</p><p><strong>This is still not the same as arrival.</strong></p>`
        : `<p>The provider accepted the synthetic referral. This profile does not support an electronic hold.</p>`;
      dialogActions.append(makeDialogButton("Confirm synthetic placement", () => { step = 2; renderStep(); }));
    } else {
      const destination = visibleDestination(service, policyRole(), "CONFIRMED");
      dialogTitle.textContent = "Place confirmed";
      dialogContent.innerHTML = destination
        ? `<p>The provider confirmed the synthetic placement.</p><p><strong>Destination:</strong> ${destination.label}</p><p>In a real service, authorised travel directions could now be handed off to navigation.</p>`
        : `<p>The provider confirmed the synthetic placement, but this role still does not receive the protected destination.</p><p>A specialist authorised hand-off would be required before exact travel information is disclosed.</p>`;
      dialogActions.append(makeDialogButton("Close", () => dialog.close(), "secondary"));
    }
  }

  renderStep();
  dialog.showModal();
}

function handleResultAction(serviceId, actionCode) {
  const service = syntheticServices.find((candidate) => candidate.id === serviceId);
  if (!service) return;

  if (actionCode === "CALL_TO_CONFIRM") {
    openInformationalDialog("Confirmation required", `<p>This provider's nominal capacity is not safe to treat as live. Use the provider's normal confirmation route before anyone travels.</p>`);
    return;
  }
  if (actionCode === "CONTACT_PROVIDER") {
    openInformationalDialog("Use the provider's existing route", `<p>SafeBed can display this synthetic provider's current feed, but it cannot refer, hold or reserve through the integration.</p><p><strong>Live availability does not imply bookability.</strong></p>`);
    return;
  }
  if (actionCode === "GET_PROFESSIONAL_HELP") {
    openInformationalDialog("Professional referral required", `<p>This specialist service can be discoverable without exposing its location. A real implementation would route the person to an authorised referral pathway.</p>`);
    return;
  }
  if (actionCode === "START_SPECIALIST_REFERRAL") {
    openReferralFlow(service, true);
    return;
  }
  if (actionCode === "START_REFERRAL") {
    openReferralFlow(service, false);
  }
}

function renderProviderDashboard() {
  let capacity = Number(document.querySelector("#capacity-output").value || 3);
  document.querySelector("#capacity-minus").onclick = () => {
    capacity = Math.max(0, capacity - 1);
    document.querySelector("#capacity-output").value = String(capacity);
    announce(`${capacity} synthetic spaces available.`);
  };
  document.querySelector("#capacity-plus").onclick = () => {
    capacity = Math.min(20, capacity + 1);
    document.querySelector("#capacity-output").value = String(capacity);
    announce(`${capacity} synthetic spaces available.`);
  };
  document.querySelector("#confirm-capacity").onclick = () => {
    document.querySelector("#capacity-freshness").textContent = "Confirmed just now";
    announce("Synthetic capacity confirmed just now.");
  };
  document.querySelector("#accept-referral").onclick = () => {
    document.querySelector("#provider-referral-status").textContent = "Synthetic referral accepted. A hold may now be granted under provider policy.";
    announce("Synthetic referral accepted.");
  };
  document.querySelector("#decline-referral").onclick = () => {
    document.querySelector("#provider-referral-status").textContent = "Synthetic referral declined. A real workflow would require an appropriate structured reason.";
    announce("Synthetic referral declined.");
  };
}

for (const button of document.querySelectorAll("[data-role]")) {
  button.addEventListener("click", () => {
    state.route = button.dataset.role;
    state.offline = false;
    if (state.route === "PROVIDER") {
      renderProviderDashboard();
      showView(providerView);
      return;
    }
    roleContext.textContent = routeLabels[state.route];
    showView(searchView);
  });
}

for (const button of document.querySelectorAll("[data-back]")) {
  button.addEventListener("click", () => {
    state.route = null;
    state.need = null;
    state.offline = false;
    showView(startView);
  });
}

for (const button of document.querySelectorAll("[data-back-to-search]")) {
  button.addEventListener("click", () => showView(searchView));
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(searchForm);
  state.need = {
    location: String(data.get("location") || "Exampletown"),
    wheelchairAccessRequired: data.has("wheelchair"),
    hasPet: data.has("pet"),
    professionalReferralAvailable: state.route === "PROFESSIONAL",
  };
  state.offline = false;
  offlineToggle.textContent = "Simulate connection lost";
  offlineBanner.hidden = true;
  renderResults();
  setResultTab("list");
  showView(resultsView);
});

resultsList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-service][data-action]");
  if (!button) return;
  handleResultAction(button.dataset.service, button.dataset.action);
});

document.querySelector("#list-tab").addEventListener("click", () => setResultTab("list"));
document.querySelector("#map-tab").addEventListener("click", () => setResultTab("map"));

offlineToggle.addEventListener("click", () => {
  state.offline = !state.offline;
  offlineBanner.hidden = !state.offline;
  offlineToggle.textContent = state.offline ? "Restore connection" : "Simulate connection lost";
  renderResults();
  announce(state.offline ? "Connection lost. Live actions disabled." : "Connection restored. Live synthetic availability visible again.");
});
