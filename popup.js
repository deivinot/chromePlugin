let scrollVar = 0;

// Obtener el título y conectar al content script para el scroll
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tabId = tabs[0].id;

  chrome.scripting.executeScript(
    {
      target: { tabId },
      func: () => document.title,
    },
    (results) => {
      if (results[0]) {
        document.getElementById("titulo").textContent = results[0].result;
      }
    }
  );

  const port = chrome.tabs.connect(tabId);

  port.onMessage.addListener((msg) => {
    scrollVar = msg.scrollY;
    document.getElementById("scroll").textContent = msg.scrollY;
  });


});
// Recibir datos desde background.js (gaze + estado)
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "gaze-data") {
    const data = message.data;
    //console.log(data);

    document.getElementById("x").textContent = data.x.toFixed(3);
    document.getElementById("y").textContent = data.y.toFixed(3);
    //document.getElementById("timestamp").textContent = new Date(data.timestamp).toISOString().slice(11, 23).replace(".", ":");

    
  } else if (message.type === "status-update") {
    const statusEl = document.getElementById("status");
    statusEl.textContent = message.statusText;
    statusEl.style.color = message.color;
  }
});

// Función para pedir permiso explícito al usuario antes de guardar los datos de la mirada
function pedirConsentimientoUsuario() {
  return new Promise((resolve) => {
    const mensaje =
      "Este software almacenará datos de seguimiento ocular para su posterior visualización.\n" +
      "Los datos no serán usados para otros fines.\n\n¿Acepta?";
    const aceptado = window.confirm(mensaje);
    resolve(aceptado);
  });
}



// Funciones de los botones
document.getElementById("connectGlasses").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "connect-glasses" });
});

document.getElementById("disconnectGlasses").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "disconnect-glasses" });
});

document.getElementById("startStream").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "start-stream" });
});

document.getElementById("stopStream").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "stop-stream" });
});

document.getElementById("openCalibration").addEventListener("click", function () {
  chrome.windows.create({
    url: chrome.runtime.getURL("calibration.html"),
    type: "popup",
    state: "maximized",
  });
});
document.getElementById("startRecording").addEventListener("click", async () => {
  const permiso = await pedirConsentimientoUsuario();
  if (!permiso) {
    alert("Permiso denegado. No se puede iniciar la grabación.");
    return;
  }
  chrome.runtime.sendMessage({ type: "start-recording" });
});


document.getElementById("stopRecording").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "stop-recording" });
});

document.getElementById("exportJson").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "export-json" });
});

document.getElementById("descargarCaptura").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "download-capture" });

});

// Cargar calibrationPoints
let calibrationPoints = {
  "top-left": null,
  "top-right": null,
  "bottom-left": null,
  "bottom-right": null,
};

chrome.storage.local.get(["calibrationPoints"], (result) => {
  if (result.calibrationPoints) {
    calibrationPoints = result.calibrationPoints;
    console.log("Calibration points cargados:", calibrationPoints);
  }
});







