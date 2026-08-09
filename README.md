# Instagram Desktop para Linux (Ubuntu)

Aplicación nativa de escritorio para Instagram en Ubuntu/Linux construida sobre Electron.

## ✨ Características

- 🖥️ **Segundo plano (Close to Tray)**: Al cerrar la ventana, la aplicación permanece activa minimizada en el área de notificación.
- 🔔 **Notificaciones y Contador de Mensajes**: Indicador dinámico de mensajes sin leer en la bandeja de sistema.
- 🔄 **Actualizador Automático**: Comprueba automáticamente en GitHub si existen nuevas versiones disponibles.
- 🛡️ **Persistencia de Sesión**: Inicio de sesión seguro y local.
- ⌨️ **Atajos de Teclado**: Recarga (`F5`/`Ctrl+R`), DevTools (`F12`), Zoom (`Ctrl+`/`Ctrl-`).
- 🔗 **Navegación Externa**: Abre enlaces fuera de Instagram en el navegador predeterminado del sistema.

## 🚀 Instalación Rápida

```bash
git clone https://github.com/ClaudioCeppi83/instagram-desktop.git
cd instagram-desktop
npm install
npm start
```

## 📦 Distribución y Publicación de Versiones

Para publicar una nueva versión y que las aplicaciones instaladas la detecten automáticamente:

1. Modifica la versión en `package.json` (ej: `1.0.1`).
2. Crea un Tag y un Release en GitHub (`v1.0.1`).
3. La app mostrará una notificación automática al usuario ofreciendo descargar la actualización.
