const endpoint =
  "https://script.google.com/macros/s/AKfycbwWDNkCOdAE7rLsuCKFa901Dgnc_0SVkL18hMatTaHnEBnPe-nmkepDERr_t_pJTaaTiw/exec";

function lookup() {
  const ticket = document.getElementById("ticketInput").value;
  fetch(`${endpoint}?ticket=${ticket}`)
    .then((res) => res.json())
    .then((data) => {
      if (data.error)
        return (document.getElementById("result").innerText = data.error);
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
    method: "POST",
    body: new URLSearchParams({ ticket, action }),
  }).then(() => lookup());
}

function startScanner() {
  const scannerContainer = document.getElementById("scanner");
  scannerContainer.innerHTML = ""; // Clear previous scan

  Quagga.init(
    {
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: scannerContainer,
        constraints: {
          facingMode: "environment", // Use back camera on phone
        },
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
        return;
      }
      Quagga.start();
    }
  );

  Quagga.onDetected((result) => {
    const code = result.codeResult.code;
    document.getElementById("ticketInput").value = code;
    lookup();
    Quagga.stop();
    scannerContainer.innerHTML = ""; // Hide scanner preview
  });
}
