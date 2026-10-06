// Gift Lane – frontend curation logic

const btn = document.getElementById("submit");
const resultsEl = document.getElementById("results");
const resultsContent = resultsEl.querySelector(".results-content");

const API_URL = "/curate";
const defaultButtonHtml = btn?.innerHTML || "Curate Gifts";

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

function setLoading() {
  showResults();
  resultsEl.classList.add("is-loading");
  resultsContent.classList.remove("results-empty");

  resultsContent.innerHTML = `
    <div class="loading-state">
      <div class="loading-dots" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
      <strong>Jude is searching for the good stuff…</strong>
      <span>I’m checking real stores and narrowing it down to five ideas worth showing you.</span>
    </div>
  `;

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = "✦ &nbsp; Jude is searching…";
  }

  scrollToResults();
}

function finishLoading() {
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

btn?.addEventListener("click", async () => {
  const demographic = document.getElementById("recipient")?.value.trim();
  const occasion = document.getElementById("occasion")?.value.trim();
  const budget = document.getElementById("budget")?.value.trim();
  const country = document.getElementById("country")?.value.trim();

  if (!demographic || !occasion || !budget || !country) {
    alert("Tell me who it’s for, the occasion, your budget, and where the gift is going.");
    return;
  }

  setLoading();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ demographic, occasion, budget, country }),
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
        ${price ? `<p class="price">${price}</p>` : ""}
        ${reason ? `<p class="reason">${reason}</p>` : ""}
        <div class="links">${linksHtml}</div>
      `;

      resultsContent.appendChild(card);
    });

    scrollToResults();
  } catch (err) {
    console.error("Gift curation failed:", err);
    resultsContent.classList.add("results-empty");
    resultsContent.textContent =
      "Oops — something went wrong on my end. Give it another go in a moment. — Jude";
  } finally {
    finishLoading();
  }
});
