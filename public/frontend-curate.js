// Gift Lane – frontend curation logic

const btn = document.getElementById("submit");
const resultsEl = document.getElementById("results");
const resultsContent = resultsEl.querySelector(".results-content");
const savePersonEl = document.getElementById("save-person");
const savePersonThanks = savePersonEl?.querySelector(".save-person-thanks");
const savePersonActions = savePersonEl?.querySelector(".save-person-actions");

const API_URL = "/curate";
const defaultButtonHtml = btn?.innerHTML || "Curate Gifts";

let loadingTimer = null;
let lastDestination = "";

function showResults() {
  resultsEl.classList.add("is-visible");
}

function scrollToResults() {
  window.setTimeout(() => {
    resultsEl.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 80);
}

function loadingMessages(country) {
  return [
    "Looking for thoughtful ideas…",
    `Searching for options in ${country}…`,
    "Comparing gifts within your budget…",
    "Choosing five strong matches…",
  ];
}

function setLoadingMessage(message) {
  const messageEl = resultsContent.querySelector("[data-loading-message]");
  if (messageEl) messageEl.textContent = message;
}

function resetSavePrompt() {
  if (!savePersonEl) return;

  savePersonEl.hidden = true;

  if (savePersonActions) {
    savePersonActions.hidden = false;
  }

  if (savePersonThanks) {
    savePersonThanks.hidden = true;
    savePersonThanks.textContent = "";
  }
}

function setLoading(country) {
  showResults();
  resetSavePrompt();

  resultsEl.classList.add("is-loading");
  resultsContent.classList.remove("results-empty");

  const messages = loadingMessages(country);
  let messageIndex = 0;

  resultsContent.innerHTML = `
    <div class="loading-state">
      <div class="loading-dots" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
      <strong data-loading-message>${messages[0]}</strong>
      <span>Jude is narrowing the search down to five ideas worth showing you.</span>
    </div>
  `;

  window.clearInterval(loadingTimer);
  loadingTimer = window.setInterval(() => {
    messageIndex = (messageIndex + 1) % messages.length;
    setLoadingMessage(messages[messageIndex]);
  }, 2800);

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = "✦ &nbsp; Jude is searching…";
  }

  scrollToResults();
}

function finishLoading() {
  window.clearInterval(loadingTimer);
  loadingTimer = null;

  resultsEl.classList.remove("is-loading");

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = defaultButtonHtml;
  }
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeUrl(value = "") {
  const url = String(value).trim();
  return url.startsWith("https://") ? url : "";
}

function trackSavePersonInterest(response) {
  if (typeof window.gtag === "function") {
    window.gtag("event", "save_person_interest", {
      response,
    });
  }
}

savePersonEl?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-save-person]");
  if (!button) return;

  const response = button.dataset.savePerson;
  trackSavePersonInterest(response);

  if (savePersonActions) {
    savePersonActions.hidden = true;
  }

  if (savePersonThanks) {
    savePersonThanks.hidden = false;
    savePersonThanks.textContent =
      response === "yes"
        ? "Thanks — that helps us understand whether this would be useful."
        : "No worries — thanks for telling us.";
  }
});

btn?.addEventListener("click", async () => {
  const demographic = document.getElementById("recipient")?.value.trim();
  const occasion = document.getElementById("occasion")?.value.trim();
  const budget = document.getElementById("budget")?.value.trim();
  const country = document.getElementById("country")?.value.trim();
  const recipientDetails =
    document.getElementById("recipient-details")?.value.trim() || "";

  if (!demographic || !occasion || !budget || !country) {
    alert("Tell me who you’re buying for, the occasion, your budget, and where they live.");
    return;
  }

  lastDestination = country;
  setLoading(country);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        demographic,
        occasion,
        budget,
        country,
        recipientDetails,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const data = await response.json();

    resultsContent.innerHTML = "";

    if (!data.products || data.products.length === 0) {
      resultsContent.classList.add("results-empty");
      resultsContent.textContent =
        "No solid matches right now — try tweaking the details. — Jude";
      return;
    }

    resultsContent.classList.remove("results-empty");

    const destination = escapeHtml(data.destination || lastDestination);

    data.products.forEach((product) => {
      const card = document.createElement("article");
      card.className = "product-card";

      const title = escapeHtml(product.title);
      const price = escapeHtml(product.price_note);
      const reason = escapeHtml(product.why);

      const linksHtml =
        Array.isArray(product.links) && product.links.length > 0
          ? product.links
              .map((link) => {
                const url = safeUrl(link.url);
                if (!url) return "";

                const label = escapeHtml(link.label || "Shop now");
                return `<a class="product-link" href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
              })
              .filter(Boolean)
              .join(" ")
          : `<span class="muted">No link available</span>`;

      card.innerHTML = `
        <h3>${title}</h3>
        ${destination ? `<p class="destination-note">For delivery in ${destination}</p>` : ""}
        ${price ? `<p class="price">${price}</p>` : ""}
        ${reason ? `<p class="reason">${reason}</p>` : ""}
        <div class="links">${linksHtml}</div>
      `;

      resultsContent.appendChild(card);
    });

    if (savePersonEl) {
      savePersonEl.hidden = false;
    }

    scrollToResults();
  } catch (err) {
    console.error("Gift curation failed:", err);
    resetSavePrompt();
    resultsContent.classList.add("results-empty");
    resultsContent.textContent =
      "Oops — something went wrong on my end. Give it another go in a moment. — Jude";
  } finally {
    finishLoading();
  }
});
