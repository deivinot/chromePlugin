const calibrationPoints = {
  'top-left': null,
  'top-right': null,
  'bottom-left': null,
  'bottom-right': null,
};

let currentGazePosition = { x: 0, y: 0 };
let socket;

window.addEventListener('DOMContentLoaded', () => {

  // Imagen superior de calibración
  const img = document.createElement("img");
  img.src = "utils/calibracion.png";
  img.alt = "Imagen calibración";
  img.style.width = "15.7vw";
  document.body.appendChild(img);

  // Contenedor para el botón y el estado
  const calibrationContainer = document.createElement('div');
  calibrationContainer.style.marginTop = '20px';
  document.body.appendChild(calibrationContainer);

  // Botón de calibración
  const calibrateButton = document.createElement('button');
  calibrateButton.textContent = "Iniciar calibración de gafas";
  calibrateButton.id = "calibrateGlasses";
  calibrateButton.classList.add('calibrate-start-button');
  calibrationContainer.appendChild(calibrateButton);

  // Texto de estado debajo del botón
  const calibrationStatus = document.createElement('p');
  calibrationStatus.textContent = "Clickar para calibrar";
  calibrationStatus.id = "calibrationStatus";
  calibrationStatus.style.marginTop = '10px';
  calibrationStatus.style.fontSize = '18px';  // Tamaño de texto más grande
  calibrationStatus.style.color = '#FFFFFF';  // Texto en blanco
  calibrationContainer.appendChild(calibrationStatus);

  calibrateButton.addEventListener("click", () => {
    calibrationStatus.textContent = "Calibrando...";

    fetch("http://localhost:5000/calibrate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    })
    .then(response => response.json())
    .then(data => {
      console.log("Calibración terminada:", data.status);
      calibrationStatus.textContent = `${data.status}`;
    })
    .catch(err => {
      console.error("Error al conectar con las gafas:", err);
      calibrationStatus.textContent = "Error al calibrar";
    });
  });

  // WebSocket para recibir la posición de la mirada en tiempo real
  socket = new WebSocket("ws://localhost:8765");

  socket.onopen = () => {
    console.log("WebSocket conectado desde calibration.js");
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      currentGazePosition = { x: data.x, y: data.y };
      console.log(data.x, data.y);
    } catch (e) {
      console.error("Error parseando datos de WebSocket:", e);
    }
  };

  socket.onerror = (error) => {
    console.error("Error en WebSocket calibration:", error);
  };

  socket.onclose = () => {
    console.warn("WebSocket cerrado desde calibration.js");
  };

  // Crear botones para guardar los puntos de calibración
  const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
  corners.forEach(corner => {
    const point = document.createElement('div');
    point.classList.add('corner-point', `corner-${corner}`);

    // Si es una esquina superior, le aplicamos un margen top extra
    if (corner === 'top-left' || corner === 'top-right') {
      point.style.top = '58px'; 
    }

    document.body.appendChild(point);

    const button = document.createElement('button');
    button.textContent = `Marcar ${corner}`;
    button.classList.add('calibrate-button', `btn-${corner}`);
    button.addEventListener('click', () => {
      calibrationPoints[corner] = { ...currentGazePosition };
      console.log(`Posición guardada para ${corner}:`, calibrationPoints[corner]);

      chrome.storage.local.set({ calibrationPoints }, () => {
        console.log("Puntos de calibración guardados en chrome.storage.local", calibrationPoints);  //comprobar
      });
    });
    document.body.appendChild(button);
  });
});
