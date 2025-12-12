// Gift Lane – frontend curation logic

const btn = document.getElementById("submit");
const resultsEl = document.getElementById("results");
const resultsContent = resultsEl.querySelector(".results-content");

// API endpoint (works on giftlane.au)
const API_URL = "/curate";

function setLoading() {
  resultsContent.classList.remove("results-empty");
  resultsContent.textContent = "Pour yourself a drink… I’m curating options for you.";
}

btn?.addEventListener("click", async () => {
  const demographic = document.getElementById("recipient")?.value.trim();
  const occasion = document.getElementById("occasion")?.value.trim();
  const budget = document.getElementById("budget")?.value.trim();

  if (!demographic || !occasion || !budget) {
    alert("Tell me who it’s for, the occasion, and your budget first.");
    return;
  }

  setLoading();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ demographic, occasion, budget }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();

    resultsContent.classList.remove("results-empty");
    resultsContent.innerHTML = "";

    if (!data.products || data.products.length === 0) {
      resultsContent.textContent =
        "No solid matches right now — try tweaking the details.\n\n— Jude";
      return;
    }

    data.products.forEach((product) => {
      const card = document.createElement("div");
      card.className = "product-card";

      const title = product.title || "Gift idea";
      const why = product.why || "";
      const price = product.price_note || "";
      const links = Array.isArray(product.links) ? product.links : [];

      const linksHtml =
        links.length > 0
          ? links
              .map(
                (l) =>
                  `<a class="product-link" href="${l.url}" target="_blank" rel="noopener">${l.label || "Search"}</a>`
              )
              .join(" ")
          : `<span class="muted">No links provided</span>`;

      card.innerHTML = `
        <h3>${title}</h3>
        ${price ? `<p class="price">${price}</p>` : ""}
        ${why ? `<p class="reason">${why}</p>` : ""}
        <div class="links">${linksHtml}</div>
      `;

      resultsContent.appendChild(card);
    });
  } catch (err) {
    console.error("Gift curation failed:", err);
    resultsContent.classList.remove("results-empty");
    resultsContent.textContent =
      "Oops — something went wrong on my end. Give me 10 seconds and try again.\n\n— Jude";
  }
});
