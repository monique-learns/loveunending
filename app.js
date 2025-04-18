const endpoint =
  "https://script.google.com/macros/s/AKfycbwWDNkCOdAE7rLsuCKFa901Dgnc_0SVkL18hMatTaHnEBnPe-nmkepDERr_t_pJTaaTiw/exec";
let scannerActive = false;
let html5QrCode;

function lookup() {
  const ticket = document.getElementById("ticketInput").value;
  document.getElementById("scanStatus").innerText = "Looking up ticket...";
  fetch(`${endpoint}?ticket=${ticket}`)
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        document.getElementById("result").innerText = data.error;
        document.getElementById("scanStatus").innerText = "Ticket not found.";
        return;
      }
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
      document.getElementById("scanStatus").innerText = "Ticket info loaded.";
    });
}

function update(ticket, action) {
  fetch(endpoint, {
    method: "POST",
    body: new URLSearchParams({ ticket, action }),
  }).then(() => lookup());
}

function toggleScanner() {
  const scanButton = document.getElementById("scanButton");
  const scannerContainer = document.getElementById("scanner");

  if (scannerActive) {
    html5QrCode.stop().then(() => {
      scannerContainer.innerHTML = "";
      scannerActive = false;
      scanButton.textContent = "Scan Barcode";
      document.getElementById("scanStatus").innerText = "Scanner stopped.";
    });
    return;
  }

  html5QrCode = new Html5Qrcode("scanner");

  Html5Qrcode.getCameras().then((cameras) => {
    if (cameras && cameras.length) {
      html5QrCode
        .start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 100 },
          },
          (code) => {
            document.getElementById("ticketInput").value = code;
            lookup();
            toggleScanner();
          },
          (errorMessage) => {
            document.getElementById("scanStatus").innerText = "Scanning...";
          }
        )
        .then(() => {
          scannerActive = true;
          scanButton.textContent = "Stop Scanning";
          document.getElementById("scanStatus").innerText = "Scanner active...";
        })
        .catch((err) => {
          document.getElementById("scanStatus").innerText = "Camera error.";
        });
    }
  });
}

// Register functions globally for HTML inline onclick
window.toggleScanner = toggleScanner;
window.lookup = lookup;
