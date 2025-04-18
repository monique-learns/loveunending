const endpoint = 'YOUR_APPS_SCRIPT_URL';

function lookup() {
  const ticket = document.getElementById("ticketInput").value;
  fetch(`${endpoint}?ticket=${ticket}`)
    .then(res => res.json())
    .then(data => {
      if (data.error) return document.getElementById("result").innerText = data.error;
      document.getElementById("result").innerHTML = `
        <p>Name: ${data.name}</p>
        <p>Status: ${data.status}</p>
        <p>Admitted: ${data.admitted}</p>
        <p>
          <button onclick="update('${ticket}', 'pay')">Mark as Paid</button>
          <button onclick="update('${ticket}', 'admit')">Admit</button>
          <button onclick="update('${ticket}', 'cancel')">Cancel</button>
        </p>
      `;
    });
}

function update(ticket, action) {
  fetch(endpoint, {
    method: 'POST',
    body: new URLSearchParams({ ticket, action })
  }).then(() => lookup());
}

function startScanner() {
  alert("Barcode scanner setup is optional — enable QuaggaJS if desired.");
}