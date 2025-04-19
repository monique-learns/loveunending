const endpoint =
  "https://script.google.com/macros/s/AKfycbwWDNkCOdAE7rLsuCKFa901Dgnc_0SVkL18hMatTaHnEBnPe-nmkepDERr_t_pJTaaTiw/exec";

function setLookupStatus(message) {
  const spinnerEl = document.getElementById("loadingSpinner");

  if (message === "Looking up ticket...") {
    document.getElementById("result").innerHTML = "";
    spinnerEl.style.display = "inline-block";
  } else {
    spinnerEl.style.display = "none";
  }
}

function lookup() {
  const ticket = document.getElementById("ticketInput").value.trim();
  if (!ticket) {
    alert("Please enter a ticket number.");
    return;
  }

  setLookupStatus("Looking up ticket...");

  fetch(`${endpoint}?ticket=${ticket}`)
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        document.getElementById("result").innerText = data.error;
      } else {
        document.getElementById("result").innerHTML = `
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Status:</strong> ${data.status}</p>
          <p><strong>Admitted:</strong> ${data.admitted}</p>
          <div style="margin-top: 1rem;">
            <button onclick="update('${ticket}', 'pay')">Mark as Paid</button>
            <button onclick="update('${ticket}', 'admit')">Admit</button>
            <button onclick="update('${ticket}', 'cancel')">Cancel</button>
          </div>
        `;
      }

      setLookupStatus("done");
    })
    .catch((err) => {
      console.error(err);
      document.getElementById("result").innerText = "Error looking up ticket.";
      setLookupStatus("done");
    });
}

function update(ticket, action) {
  fetch(endpoint, {
    method: "POST",
    body: new URLSearchParams({ ticket, action }),
  }).then(() => lookup());
}
