const endpoint =
  "https://script.google.com/macros/s/AKfycbwWDNkCOdAE7rLsuCKFa901Dgnc_0SVkL18hMatTaHnEBnPe-nmkepDERr_t_pJTaaTiw/exec";
let scannerActive = false;
let html5QrCode;

function setScanStatus(message) {
  document.getElementById("scanStatus").innerText = message;

  if (message != "Ticket info loaded.") {
    document.getElementById("result").innerHTML = "";
  }

  // Show spinner only when looking up ticket
  if (message === "Looking up ticket...") {
    spinnerEl.style.display = "inline-block";
  } else {
    spinnerEl.style.display = "none";
  }
}

function loadCameras() {
  const select = document.getElementById("cameraSelect");
  Html5Qrcode.getCameras()
    .then((devices) => {
      select.innerHTML = "";
      devices.forEach((cam) => {
        const option = document.createElement("option");
        option.value = cam.id;
        option.text = cam.label || `Camera ${select.length + 1}`;
        select.appendChild(option);
      });
      document.getElementById("consoling").innerText = "Cameras loaded";
    })
    .catch((err) => {
      setScanStatus("Camera access error.");
      console.error("Camera error:", err);
      document.getElementById("consoling").innerText = "Cameras erroer";
    });
}

function lookup() {
  const ticket = document.getElementById("ticketInput").value;
  setScanStatus("Looking up ticket...");
  fetch(`${endpoint}?ticket=${ticket}`)
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        document.getElementById("result").innerText = data.error;
        setScanStatus("Ticket not found.");
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
      setScanStatus("Ticket info loaded.");
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
  const scannerContainer = document.getElementById("reader");
  const selectedCameraId = document.getElementById("cameraSelect").value;
  document.getElementById("consoling").innerText = "Camera selected";

  if (scannerActive) {
    html5QrCode.stop().then(() => {
      html5QrCode.clear();
      scannerActive = false;
      scanButton.textContent = "Scan Barcode";
      setScanStatus("Scanner stopped.");
    });
    return;
  }

  html5QrCode = new Html5Qrcode("reader");

  document.getElementById("consoling").innerText = "Reader created";

  html5QrCode
    .start(
      selectedCameraId,
      {
        fps: 10,
        qrbox: { width: 250, height: 100 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.ITF,
        ],
      },
      (decodedText) => {
        document.getElementById("consoling").innerText = "got value";
        document.getElementById("ticketInput").value = decodedText;
        lookup();
        toggleScanner(); // Automatically stop after success
      },
      (errorMessage) => {
        document.getElementById("consoling").innerText =
          "start errored" + errorMessage;
        setScanStatus("Scanning...");
      }
    )
    .then(() => {
      scannerActive = true;
      scanButton.textContent = "Stop Scanning";
      setScanStatus("Scanner active...");

      // ✅ Apply 2x zoom if available
      const videoElem = document.querySelector("#reader video");

      document.getElementById("consoling").innerText = "Tryign to zoom";
      if (videoElem && videoElem.srcObject) {
        const track = videoElem.srcObject.getVideoTracks()[0];
        const caps = track.getCapabilities?.();
        if (caps?.zoom) {
          track
            .applyConstraints({ advanced: [{ zoom: 2 }] })
            .then(() => {
              document.getElementById("consoling").innerText = "Zoomed";
              document.getElementById("scanStatus").innerText += " (Zoom: 2x)";
            })
            .catch((err) => {
              document.getElementById("consoling").innerText = "Cannot zoom";
              console.warn("Zoom not supported or failed:", err);
            });
        }
      }
    })
    .catch((err) => {
      setScanStatus("Camera error.");
      console.error("Start failed:", err);

      document.getElementById("consoling").innerText = "Strat failed agina";
    });
}

window.onload = loadCameras;
// Allow HTML to call functions
window.toggleScanner = toggleScanner;
window.lookup = lookup;
