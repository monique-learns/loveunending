const endpoint =
  "https://script.google.com/macros/s/AKfycbwWDNkCOdAE7rLsuCKFa901Dgnc_0SVkL18hMatTaHnEBnPe-nmkepDERr_t_pJTaaTiw/exec";
let scannerActive = false;
let html5QrCode;

function setScanStatus(message) {
  document.getElementById("scanStatus").innerText = message;

  if (clearStates != "Ticket info loaded.") {
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
    })
    .catch((err) => {
      document.getElementById("scanStatus").innerText = "Camera access error.";
      console.error("Camera error:", err);
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
  const selectedCameraId = document.getElementById("cameraSelect").value;

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
        document.getElementById("ticketInput").value = decodedText;
        lookup();
        toggleScanner(); // Auto-stop after scan
      },
      () => setScanStatus("Scanning...")
    )
    .then(() => {
      scannerActive = true;
      scanButton.textContent = "Stop Scanning";
      setScanStatus("Scanner active...");

      // Zoom in if supported
      const videoElem = document.querySelector("#reader video");
      if (videoElem && videoElem.srcObject) {
        const track = videoElem.srcObject.getVideoTracks()[0];
        const caps = track.getCapabilities?.();
        if (caps?.zoom) {
          track
            .applyConstraints({ advanced: [{ zoom: 2 }] })
            .then(() => {
              setScanStatus("Scanner active... (Zoom: 2x)");
            })
            .catch((err) => {
              console.warn("Zoom failed:", err);
            });
        }
      }
    })
    .catch((err) => {
      setScanStatus("Camera error.");
      console.error("Start failed:", err);
    });
}

// Allow HTML to call functions
window.toggleScanner = toggleScanner;
window.lookup = lookup;
