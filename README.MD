# Extensión de Chrome: Visualizador Tobii Pro Glasses 3
Esta extensión de Chrome ha sido desarrollada como parte del Trabajo de Fin de Grado 'Seguimiento ocular en páginas web
mediante Tobii Glasses 3' . Permite conectarse a un backend que controla las gafas y hacerle peticiones. Con los datos obtenidos de las gafas esta puede generar mapas de calor capturando la imagen de página web.

## 📚 Librerías utilizadas

| Librería / API            | Uso principal                                                                 |
|---------------------------|------------------------------------------------------------------------------|
| [`heatmap.js`](https://www.patrick-wied.at/static/heatmapjs/)         | Generación de mapas de calor basados en los puntos de mirada del usuario. |
| [`perspective-transform`](https://www.npmjs.com/package/perspective-transform) | Aplicación de transformaciones de perspectiva para mapear los puntos de mirada correctamente sobre capturas o elementos. |
| [`html2canvas`](https://html2canvas.hertzen.com/)                     | Captura del contenido visual de la página web como imagen, para superponer los datos de gaze. |