// form.js – front-end logic for the Gift Lane form

const btn = document.getElementById("submit");
const resultsEl = document.getElementById("results");
const resultsContent = resultsEl.querySelector(".results-content");

// Hit your backend at the same origin (gift-lane.onrender.com or giftlane.au)
const API_URL = `${window.location.origin.replace("gift-lane.onrender.com", "giftlane.au")}/curate`;

function setLoading(isLoading) {
  if (isLoading) {
    resultsContent.classList.remove("results-empty");
    resultsContent.textContent =
      "Pour yourself a drink… I’m curating options for you.";
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

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    const text =
      data.suggestions ||
      "I couldn’t fetch any ideas just now. Please try again in a moment.";

    resultsContent.classList.remove("results-empty");
    resultsContent.textContent =
      text + "\n\n—\nChosen with intention.\n— Jude";
  } catch (err) {
    console.error(err);
    resultsContent.classList.remove("results-empty");
    resultsContent.textContent =
      "Something went wrong on my side. Try again shortly and I’ll behave.\n\n—\nChosen with intention.\n— Jude";
  }
});
