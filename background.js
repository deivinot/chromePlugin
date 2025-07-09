let socket = null;
let isRecording = false;
let scrollY = 0;
let heatmapData =[]

// Función para mandar el estado a la interfaz
function sendStatus(statusText, color = "black") {
  chrome.runtime.sendMessage({
    type: "status-update",
    statusText,
    color,
  });
}

// Función para exportar el mapa de calor como imagen
function exportHeatmapData() {
  chrome.storage.local.get(["calibrationPoints"], (result) => {
    const calibrationPoints = result.calibrationPoints || {};
    const exportData = {
      config: { calibrationPoints },
      data: heatmapData,
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const reader = new FileReader();

    reader.onload = function () {
      const base64Data = reader.result;
      chrome.downloads.download({
        url: base64Data,
        filename: "heatmap_data.json",
        saveAs: true,
      });
    };

    reader.readAsDataURL(blob);

  });
}


// Función para obtener los puntos de calibración y formatearlos junto los datos de la mirada
function getData() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["calibrationPoints"], (result) => {
      const calibrationPoints = result.calibrationPoints || {};
      resolve({
        config: { calibrationPoints },
        data: heatmapData,
      });
    });
  });
}


// Manejador de eventos
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "connect-glasses":
      fetch("http://localhost:5000/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      })
        .then(res => res.json())
        .then(() => sendStatus("Gafas conectadas", "green"))
        .catch(err => {
          console.error("Error al conectar con las gafas:", err);
          sendStatus("Error al conectar", "red");
        });
      break;

    case "disconnect-glasses":
      fetch("http://localhost:5000/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      })
        .then(res => res.json())
        .then(() => {
          sendStatus("Gafas desconectadas", "gray");
          if (socket) {
            socket.close();
            socket = null;
          }
        })
        .catch(err => {
          console.error("Error al desconectar las gafas:", err);
          sendStatus("Error al desconectar", "red");
        });
      break;

    case "start-stream":
      fetch("http://localhost:5000/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      })
        .then(res => res.json())
        .then(() => {
          sendStatus("Stream iniciado", "green");

          socket = new WebSocket("ws://localhost:8765");

          socket.onopen = () => {
            console.log("WebSocket conectado para escuchar datos de gaze");
          };

          socket.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              const gazePoint = {
                x: data.x,
                y: data.y,
                timestamp: Date.now(),
                scroll: parseFloat(scrollY),
              };

              chrome.runtime.sendMessage({ type: "gaze-data", data: gazePoint });

              if (isRecording) {
                heatmapData.push(gazePoint);
              }
            } catch (err) {
              console.error("Error al parsear mensaje de gaze:", err);
            }
          };

          socket.onerror = (error) => {
            console.error("Error en el WebSocket:", error);
          };

          socket.onclose = () => {
            console.warn("WebSocket cerrado");
          };
        })
        .catch(err => {
          console.error("Error al iniciar stream:", err);
          sendStatus("Error al iniciar stream", "red");
        });
      break;

    case "stop-stream":
      fetch("http://localhost:5000/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      })
        .then(res => res.json())
        .then(() => {
          sendStatus("Stream detenido", "orange");
        })
        .catch(err => {
          console.error("Error al detener stream:", err);
          sendStatus("Error al detener stream", "red");
        });
      break;

    case "start-recording":
      isRecording = true;
      heatmapData = [];
      console.log("Grabación iniciada");
      break;

    case "stop-recording":
      isRecording = false;
      console.log("Grabación detenida");
      break;

    case 'toggle':
      isRecording = false;
      console.log("Grabación detenida");
      break;

    case "update-scroll":
      scrollY = message.scrollY;
      break;

    case "export-json":
      exportHeatmapData();
      break;

    


    case "download-capture":
      getData().then(outputData => {
        console.log("[background.js] outputData:", outputData);

        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: "realizar-captura",
            jsonData: outputData
          });
        });
      });
      break;

      

    case 'captura-final':
      chrome.downloads.download({
        url: message.dataUrl,
        filename: 'heatmap_capture.png',
      });
      break;
    
    
    
    default:
      console.warn("Mensaje desconocido:", message);
  }
});


