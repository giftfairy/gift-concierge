// Gift Lane – frontend curation logic

const btn = document.getElementById("submit");
const resultsEl = document.getElementById("results");
const resultsContent = resultsEl.querySelector(".results-content");

const API_URL = "/curate";

function setLoading() {
  resultsContent.classList.remove("results-empty");
  resultsContent.textContent =
    "Pour yourself a drink… I’m curating options for you.";
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
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const data = await response.json();

    resultsContent.innerHTML = "";

    if (!data.products || data.products.length === 0) {
      resultsContent.textContent =
        "No solid matches right now — try tweaking the details.\n\n— Jude";
      return;
    }

    data.products.forEach((product) => {
      const card = document.createElement("div");
      card.className = "product-card";

      const linksHtml =
        product.links.length > 0
          ? product.links
              .map(
                (l) =>
                  `<a class="product-link" href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`
              )
              .join(" ")
          : `<span class="muted">No links provided</span>`;

      card.innerHTML = `
        <h3>${product.title}</h3>
        ${
          product.price_note
            ? `<p class="price">${product.price_note}</p>`
            : ""
        }
        ${
          product.why ? `<p class="reason">${product.why}</p>` : ""
        }
        <div class="links">${linksHtml}</div>
      `;

      resultsContent.appendChild(card);
    });
  } catch (err) {
    console.error("Gift curation failed:", err);
    resultsContent.textContent =
      "Oops — something went wrong on my end. Give me 10 seconds and try again.\n\n— Jude";
  }
});
