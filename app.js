const endpoint =
  "https://script.google.com/macros/s/AKfycbx0BC7Ngr7tBknjnbAG3m5kj_PqCSi02IPjBxsCHVKvS2U0xxl_eYtMTcC2YcrD_LR8gA/exec";

function setLookupStatus(message) {
  const statusContainer = document.getElementById("statusContainer");
  const statusEl = document.getElementById("lookupStatus");
  const spinnerEl = document.getElementById("loadingSpinner");

  if (message === "Looking for Ticket...") {
    statusContainer.style.display = "block";
    spinnerEl.style.display = "inline-block";
    statusEl.innerText = message;
  } else {
    statusContainer.style.display = "none";
    spinnerEl.style.display = "none";
    statusEl.innerText = "";
  }
}

function lookup() {
  const ticket = document.getElementById("ticketInput").value.trim();
  const resultContainer = document.getElementById("resultContainer");
  const resultEl = document.getElementById("result");

  if (!ticket) {
    alert("Please enter a ticket number.");
    return;
  }

  setLookupStatus("Looking for Ticket...");
  resultContainer.style.display = "none";

  fetch(`${endpoint}?ticket=${ticket}`)
    .then((res) => res.json())
    .then((data) => {
      resultContainer.style.display = "block";
      setLookupStatus("");

      if (data.error) {
        resultEl.innerText = data.error;
        return;
      }

      const {
        name: responsible,
        type,
        cost,
        status,
        admitted,
        ticketNumber,
      } = data;

      const admittedFlag = admitted === "true" || admitted === true;
      const statusUpper = status.toUpperCase();

      const warningMessage = admittedFlag
        ? `<p style="color: red; font-weight: bold;">This ticket has already been admitted.</p>`
        : "";

      let buttonsHtml = "";

      if (admittedFlag) {
        buttonsHtml = ""; // No buttons if already admitted
      } else if (statusUpper === "PAID") {
        buttonsHtml = `
          <button 
            onclick="update('${ticketNumber}', 'admit')" 
            style="background-color: #5cb85c; color: white;"
          >
            Admit
          </button>
        `;
      } else {
        const isBlocked =
          statusUpper === "RETURNED" || statusUpper === "AVAILABLE";
        const needsPayment =
          statusUpper === "NOT PAID" ||
          statusUpper === "RESERVED - ASK FOR PAYMENT";

        buttonsHtml = `
          <button onclick="update('${ticketNumber}', 'pay')"
            ${
              isBlocked
                ? "disabled style='opacity: 0.6; cursor: not-allowed;'"
                : ""
            }
            style="${
              needsPayment ? "background-color: #d9534f; color: white;" : ""
            }"
          >
            Mark as Paid
          </button>

          <button onclick="update('${ticketNumber}', 'admit')"
            ${
              needsPayment || isBlocked
                ? "disabled style='opacity: 0.6; cursor: not-allowed;'"
                : "style='background-color: #5cb85c; color: white;'"
            }
          >
            Admit
          </button>

          <button onclick="update('${ticketNumber}', 'return')">
            Return Ticket
          </button>
        `;
      }

      resultEl.innerHTML = `
        <p><strong>Ticket Number:</strong> ${ticketNumber}</p>
        <p><strong>Responsible:</strong> ${responsible}</p>
        <p><strong>Type:</strong> ${type}</p>
        <p><strong>Cost:</strong> ${cost}</p>
        <p><strong>Status:</strong> ${status}</p>
        <p><strong>Admitted:</strong> ${admittedFlag ? "Yes" : "No"}</p>
        ${warningMessage}
        <div style="margin-top: 1rem;">
          ${buttonsHtml}
        </div>
      `;
    })
    .catch((err) => {
      console.error(err);
      resultEl.innerText = "Error looking up ticket.";
      resultContainer.style.display = "block";
      setLookupStatus("");
    });
}

function update(ticket, action) {
  const resultContainer = document.getElementById("resultContainer");
  const resultEl = document.getElementById("result");

  setLookupStatus("Looking for Ticket...");
  resultContainer.style.display = "none";

  fetch(endpoint, {
    method: "POST",
    body: new URLSearchParams({ ticket, action }),
  })
    .then((res) => res.text())
    .then((responseText) => {
      if (responseText.includes("Cannot admit ticket")) {
        alert(responseText);
        lookup(); // still show the current result again
      } else {
        if (action === "admit" || action === "return") {
          resultEl.innerHTML = "";
          resultContainer.style.display = "none";
        } else {
          lookup(); // For 'pay', re-fetch the result
        }
      }
      setLookupStatus("");
    })
    .catch((err) => {
      console.error(err);
      resultEl.innerText = "Error updating ticket.";
      resultContainer.style.display = "block";
      setLookupStatus("");
    });
}
