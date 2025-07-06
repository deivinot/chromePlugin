let port;
let socket;
let capturaPrevia = null;
let anchoPantalla = null;
let altoPantalla = null;

// Gestionar scroll
window.addEventListener("scroll", () => {
  if (port) {
    port.postMessage({ scrollY: window.scrollY });
  }
  chrome.runtime.sendMessage({ type: "update-scroll", scrollY: window.scrollY });
});

// Comunicación con script
chrome.runtime.onConnect.addListener((p) => {
  port = p;
  port.postMessage({ scrollY: window.scrollY });

  port.onDisconnect.addListener(() => {
    port = null;
  });
});

// Hacemos la captura tras cargar (tras 1 segundo)
window.addEventListener('load', () => {

  setTimeout(() => {
    html2canvas(document.body, {
      useCORS: true,
      windowWidth: document.body.scrollWidth,
      windowHeight: document.body.scrollHeight,
      scale: 1    // Para que no cambie la escala al hacer screenshot
    }).then(canvas => {
      capturaPrevia = canvas.toDataURL('image/png');
      anchoPantalla = window.innerWidth;
      altoPantalla = window.innerHeight;
      console.log("[content.js] Captura inicial realizada y almacenada.");
      console.log(window.innerHeight,window.innerWidth);
    }).catch(err => {
      console.error("Error al realizar la captura inicial:", err);
    });
  }, 5000);
});

// Revisar que la q es activada
document.addEventListener("keydown", (event) => {
  if (event.key === "q" && !event.ctrlKey && !event.altKey && !event.metaKey) {
    console.log("pulsa Q")
    chrome.runtime.sendMessage({ type: "toggle" });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'realizar-captura') {
    const points = message.jsonData.data;
    const calibrationPoints = message.jsonData.config.calibrationPoints;

    if (!capturaPrevia) {
      console.error("La captura inicial aún no está disponible.");
      return;
    }

    // Calculamos la matriz de transformación perspectiva
    const srcCorners = [
      calibrationPoints["top-left"].x, calibrationPoints["top-left"].y,
      calibrationPoints["top-right"].x, calibrationPoints["top-right"].y,
      calibrationPoints["bottom-right"].x, calibrationPoints["bottom-right"].y,
      calibrationPoints["bottom-left"].x, calibrationPoints["bottom-left"].y
    ];

    const dstCorners = [
      0, 0,
      anchoPantalla, 0,
      anchoPantalla, altoPantalla,
      0, altoPantalla
    ];

    const perspT = new PerspT(srcCorners, dstCorners);
    const image = new Image();
    image.src = capturaPrevia;
    console.log(image.width);
    image.onload = () => {
      const finalCanvas = document.createElement('canvas');
     

      console.log(image.width, image.height);
      finalCanvas.width = image.width;
      finalCanvas.height = image.height;
      console.log(finalCanvas.width,finalCanvas.height);
      const ctx = finalCanvas.getContext('2d');

      ctx.drawImage(image, 0, 0);

      const heatmap = h337.create({
        container: document.body,
        radius: 20,
        maxOpacity: 0.6,
        minOpacity: 0,
        blur: 0.9,
        gradient: {
          '.5': 'blue',
          '.8': 'orange',
          '.95': 'red'
        }
      });

      // Aplicamos la transformación a cada punto
      const heatmapPoints = points.map(p => {
        const [realX, realY] = perspT.transform(p.x, p.y);
        return {
          x: Math.floor(realX),
          y: Math.floor(realY + p.scroll), // Aplicamos scroll
          value: 1
        };
      });

      heatmap.setData({ max: 5, data: heatmapPoints });

      ctx.drawImage(heatmap._renderer.canvas, 0, 0);

      const finalImage = finalCanvas.toDataURL('image/png');

      // Enviamos la imagen final al background para descargar
      chrome.runtime.sendMessage({ type: 'captura-final', dataUrl: finalImage });

      // Limpiamos heatmap
      heatmap._renderer.canvas.width = 0;
      heatmap._renderer.canvas.height = 0;
      ctx.clearRect(0, 0, finalCanvas.width, finalCanvas.height);
    };
  }
});
