<script type="module">
  // form.js – Gift Lane frontend logic

  const btn = document.getElementById("submit");
  const resultsEl = document.getElementById("results");
  const resultsContent = resultsEl.querySelector(".results-content");

  // API endpoint (works on giftlane.au or any preview)
  const API_URL = "/curate";

  function setLoading(isLoading = true) {
    if (isLoading) {
      resultsContent.classList.remove("results-empty");
      resultsContent.textContent = "Pour yourself a drink… I’m curating options for you.";
    }
  }

  btn.addEventListener("click", async () => {
    const demographic = document.getElementById("recipient").value.trim();
    const occasion = document.getElementById("occasion").value.trim();
    const budget = document.getElementById("budget").value.trim();

    if (!demographic || !occasion || !budget) {
      alert("Tell me who it’s for, the occasion, and your budget first.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demographic, occasion, budget }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      resultsContent.classList.remove("results-empty");
      resultsContent.textContent =
        (data.suggestions || "No ideas right now — try again in a sec!") +
        "\n\n—\nChosen with intention.\n— Jude";
    } catch (err) {
      console.error("Gift curation failed:", err);
      resultsContent.classList.remove("results-empty");
      resultsContent.textContent =
        "Oops — something went wrong on my end. Give me 10 seconds and try again.\n\n— Jude";
    }
  });
</script>
