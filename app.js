const endpoint =
  "https://script.google.com/macros/s/AKfycbwWDNkCOdAE7rLsuCKFa901Dgnc_0SVkL18hMatTaHnEBnPe-nmkepDERr_t_pJTaaTiw/exec";

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

function startScanner() {
  const scannerContainer = document.getElementById("scanner");
  scannerContainer.innerHTML = "";
  document.getElementById("scanStatus").innerText = "Starting scanner...";

  Quagga.init(
    {
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: scannerContainer,
        constraints: {
          facingMode: "environment",
          width: { min: 320, ideal: 640, max: 1280 },
          height: { min: 240, ideal: 480, max: 720 },
        },
      },
      locator: {
        patchSize: "medium",
        halfSample: true,
      },
      decoder: {
        readers: [
          "code_128_reader",
          "ean_reader",
          "ean_8_reader",
          "code_39_reader",
        ],
      },
      locate: true,
    },
    function (err) {
      if (err) {
        console.error(err);
        alert("Camera error: " + err.message);
        return;
      }
      Quagga.start();

      // 🛠 Fix camera video size overflow
      setTimeout(() => {
        const video = document.querySelector("#scanner video");
        if (video) {
          video.style.width = "100%";
          video.style.height = "100%";
          video.style.objectFit = "cover";
        }
      }, 500);

      scannerContainer.scrollIntoView({ behavior: "smooth" });
      document.getElementById("scanStatus").innerText = "Scanner active...";
    }
  );

  Quagga.onDetected((result) => {
    const code = result.codeResult.code;
    document.getElementById("ticketInput").value = code;
    lookup();
    Quagga.stop();
    scannerContainer.innerHTML = "";
    document.getElementById("scanStatus").innerText = "Scan complete.";
  });
}
