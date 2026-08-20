(function () {
  "use strict";

  const PALETTE = [
    "var(--palette-1)",
    "var(--palette-2)",
    "var(--palette-3)",
    "var(--palette-4)",
    "var(--palette-5)",
    "var(--palette-6)",
  ];

  const tablesEl = document.getElementById("tables");
  const statsEl = document.getElementById("stats");
  const searchEl = document.getElementById("search");
  const searchResultEl = document.getElementById("search-result");
  const emptyStateEl = document.getElementById("empty-state");

  function tableLabel(entry) {
    if (entry.table === "R0") return "Head Table";
    if (entry.table.startsWith("R")) return "Reserved Table";
    return "Table " + entry.table;
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  function highlight(name, query) {
    if (!query) return escapeHtml(name);
    const idx = name.toLowerCase().indexOf(query);
    if (idx === -1) return escapeHtml(name);
    const before = escapeHtml(name.slice(0, idx));
    const match = escapeHtml(name.slice(idx, idx + query.length));
    const after = escapeHtml(name.slice(idx + query.length));
    return `${before}<mark>${match}</mark>${after}`;
  }

  function render() {
    const totalGuests = SEATING_DATA.reduce((sum, t) => sum + t.guests.length, 0);
    const totalTables = SEATING_DATA.length;
    statsEl.innerHTML = `<strong>${totalGuests}</strong> guests &middot; <strong>${totalTables}</strong> tables`;

    const frag = document.createDocumentFragment();

    SEATING_DATA.forEach((entry, i) => {
      const card = document.createElement("article");
      card.className = "table-card";
      card.style.setProperty("--card-color", PALETTE[i % PALETTE.length]);
      card.dataset.table = entry.table;

      const guestNames = entry.guests.map((g) => g.toLowerCase());
      card.dataset.guests = guestNames.join("|");

      const noteHtml = entry.note
        ? `<span class="table-note">${escapeHtml(entry.note)}</span>`
        : "";

      const guestItems = entry.guests
        .map((g) => `<li data-name="${escapeHtml(g.toLowerCase())}">${escapeHtml(g)}</li>`)
        .join("");

      card.innerHTML = `
        <div class="table-head">
          <span class="table-label">${escapeHtml(tableLabel(entry))}</span>
          ${noteHtml}
        </div>
        <div class="table-rule"></div>
        <ul class="guest-list">${guestItems}</ul>
      `;

      frag.appendChild(card);
    });

    tablesEl.appendChild(frag);
  }

  function applySearch(rawQuery) {
    const query = rawQuery.trim().toLowerCase();
    const cards = tablesEl.querySelectorAll(".table-card");
    let matchCount = 0;
    let firstMatchLabel = null;

    cards.forEach((card) => {
      const items = card.querySelectorAll(".guest-list li");
      let cardHasMatch = false;

      items.forEach((li) => {
        const name = li.dataset.name;
        const isMatch = query.length > 0 && name.includes(query);
        li.classList.toggle("is-guest-match", isMatch);
        li.innerHTML = query.length > 0
          ? highlight(li.textContent, query)
          : escapeHtml(li.textContent);
        if (isMatch) cardHasMatch = true;
      });

      if (query.length === 0) {
        card.classList.remove("is-hidden", "is-match");
      } else {
        card.classList.toggle("is-hidden", !cardHasMatch);
        card.classList.toggle("is-match", cardHasMatch);
        if (cardHasMatch) {
          matchCount++;
          if (!firstMatchLabel) {
            firstMatchLabel = card.querySelector(".table-label").textContent;
          }
        }
      }
    });

    if (query.length === 0) {
      searchResultEl.innerHTML = "";
      emptyStateEl.hidden = true;
    } else if (matchCount === 0) {
      searchResultEl.innerHTML = "";
      emptyStateEl.hidden = false;
    } else {
      emptyStateEl.hidden = true;
      const suffix = matchCount === 1
        ? `Found at <span class="hit-table">${escapeHtml(firstMatchLabel)}</span>`
        : `Matches in ${matchCount} tables`;
      searchResultEl.innerHTML = suffix;
    }
  }

  searchEl.addEventListener("input", (e) => applySearch(e.target.value));

  render();

  // ---------- QR modal ----------
  const showQrBtn = document.getElementById("show-qr");
  const closeQrBtn = document.getElementById("close-qr");
  const qrModal = document.getElementById("qr-modal");
  const qrCanvas = document.getElementById("qr-canvas");
  const qrUrlEl = document.getElementById("qr-url");

  let qrBuilt = false;

  function buildQr() {
    if (qrBuilt) return;
    qrBuilt = true;
    const url = window.location.href.split("#")[0];
    qrUrlEl.textContent = url;
    try {
      const qr = qrcode(0, "M");
      qr.addData(url);
      qr.make();
      qrCanvas.innerHTML = qr.createSvgTag({ scalable: true, margin: 2 });
      const svg = qrCanvas.querySelector("svg");
      if (svg) {
        svg.style.width = "220px";
        svg.style.height = "220px";
      }
    } catch (err) {
      qrCanvas.textContent = "Could not generate QR code.";
    }
  }

  showQrBtn.addEventListener("click", () => {
    buildQr();
    qrModal.hidden = false;
  });

  closeQrBtn.addEventListener("click", () => {
    qrModal.hidden = true;
  });

  qrModal.addEventListener("click", (e) => {
    if (e.target === qrModal) qrModal.hidden = true;
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !qrModal.hidden) qrModal.hidden = true;
  });
})();
