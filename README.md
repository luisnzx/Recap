# 🎙️ One-Click Recap

Una aplicación moderna y elegante para convertir tus reuniones en acciones ejecutables. Graba, transcribe y procesa automáticamente tus conversaciones en tareas, acuerdos y próximas reuniones.

## ✨ Características

- **🎤 Grabación en Tiempo Real**: Captura audio continuo usando Web Speech API
- **📝 Transcripción Automática**: Convierte el audio a texto mientras hablas
- **🤖 Procesamiento Inteligente**: Divide automáticamente el texto en:
  - 📝 Tareas (To-Dos)
  - 🤝 Acuerdos
  - 🗓️ Próxima Reunión
- **💾 Persistencia**: Guarda todas tus reuniones en localStorage
- **🎨 Dark Mode**: Interfaz elegante con tema oscuro y acentos neón
- **✨ Animaciones Fluidas**: Transiciones suaves para una mejor experiencia
- **📱 Responsive**: Diseño adaptable para móvil, tablet y desktop

## 🛠️ Tecnologías

- **React 18**: Framework frontend
- **Vite**: Build tool rápido y moderno
- **Tailwind CSS**: Utilidades de estilo
- **Lucide React**: Iconografía moderna
- **Web Speech API**: Reconocimiento de voz

## 📦 Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd APP_REUNIONES

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Previsualizar build
npm run preview
```

## 🚀 Uso

1. **Abre la aplicación** en tu navegador (recomendado: Chrome, Edge o Safari)
2. **Presiona el botón circular azul** para comenzar a grabar
3. **Habla naturalmente** sobre tu reunión
4. **Presiona el botón rojo** para detener la grabación
5. **Revisa los resultados** organizados en tarjetas elegantes
6. **Consulta el historial** de reuniones en la barra lateral

## 🏗️ Estructura del Proyecto

```
APP_REUNIONES/
├── src/
│   ├── components/
│   │   ├── RecordingButton.jsx      # Botón de grabación con animaciones
│   │   ├── TranscriptDisplay.jsx    # Mostrador de transcripción
│   │   ├── ResultsDisplay.jsx       # Tarjetas de resultados
│   │   ├── MeetingHistory.jsx       # Historial de reuniones
│   │   └── Sidebar.jsx              # Barra lateral con historial
│   ├── App.jsx                      # Componente principal
│   ├── MeetingProcessor.js          # Lógica de procesamiento
│   ├── index.css                    # Estilos globales
│   └── main.jsx                     # Punto de entrada
├── index.html                       # HTML principal
├── vite.config.js                   # Configuración de Vite
├── tailwind.config.js               # Configuración de Tailwind
├── postcss.config.js                # Configuración de PostCSS
└── package.json                     # Dependencias y scripts
```

## 🎯 Componentes Principales

### App.jsx
Orquesta la lógica principal:
- Manejo del estado de grabación
- Inicialización de Web Speech API
- Gestión del localStorage
- Enrutamiento entre vistas

### MeetingProcessor.js
Procesa el texto capturado:
- **extractTasks()**: Identifica tareas usando palabras clave
- **extractAgreements()**: Identifica acuerdos
- **extractNextMeeting()**: Extrae información de próximas reuniones
- **processText()**: Orquesta el procesamiento completo
- **formatForStorage()**: Prepara datos para guardar

### RecordingButton.jsx
Botón circular con animación de onda (pulse wave):
- Estados: grabando y en espera
- Indicador visual de escucha activa
- Iconos dinámicos (Mic y Square)

### ResultsDisplay.jsx
Muestra resultados en tarjetas elegantes:
- Grid responsive (1 columna en móvil, 2 en desktop)
- Animaciones de entrada escalonadas
- Scroll en transcripción completa

## 🎨 Personalización

### Temas de Color
Edita `tailwind.config.js` para cambiar los colores:
```javascript
colors: {
  neon: {
    purple: '#d946ef',
    blue: '#06b6d4',
  },
}
```

### Idioma
Cambiar el idioma en `App.jsx`:
```javascript
recognition.lang = 'es-ES'; // Cambia a 'en-US', 'fr-FR', etc.
```

### Palabras Clave
Personaliza las palabras clave en `MeetingProcessor.js`:
```javascript
const taskKeywords = ['hacer', 'tarea', 'acción', ...];
```

## ⚙️ Configuración

### localStorage
- **Key**: `meetings`
- **Value**: Array de objetos con estructura:
```javascript
{
  id: timestamp,
  title: string,
  timestamp: ISO string,
  tasks: string[],
  agreements: string[],
  nextMeeting: {text, date} || null,
  rawText: string
}
```

## 🔧 Desarrollo

### Scripts Disponibles

```bash
npm run dev      # Inicia servidor de desarrollo (puerto 5173)
npm run build    # Compila para producción
npm run preview  # Previsualiza el build de producción
```

### Debugging
- Abre DevTools (F12)
- Los datos de reuniones se guardan en localStorage
- Limpia con: `localStorage.clear()`

## 📱 Compatibilidad

| Navegador | Compatible |
|-----------|-----------|
| Chrome    | ✅ Completo |
| Edge      | ✅ Completo |
| Safari    | ✅ Completo |
| Firefox   | ⚠️ Limitado |
| Safari iOS| ⚠️ Limitado |

## 🐛 Problemas Comunes

### "Tu navegador no soporta Web Speech API"
- Usa Chrome, Edge o Safari
- Firefox tiene soporte limitado

### La transcripción no aparece
- Verifica que hayas dado permisos de micrófono
- Intenta recargando la página (F5)
- Asegúrate de estar en HTTPS (en producción)

### Los datos no se guardan
- Verifica que localStorage esté habilitado
- Comprueba el almacenamiento disponible del navegador
- Limpia el cache si hay problemas

## 📝 Licencia

MIT - Libre para usar, modificar y distribuir

## 💡 Ideas Futuras

- Exportar reuniones a PDF
- Integración con calendario (Google Calendar, Outlook)
- Soporte para múltiples idiomas
- Exportación a Notion o Asana
- Análisis de sentimientos
- Grabación de audio
- Sincronización en la nube
- Colaboración en equipo

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/mejora`)
3. Commit tus cambios (`git commit -am 'Agrega mejora'`)
4. Push a la rama (`git push origin feature/mejora`)
5. Abre un Pull Request

## 📞 Soporte

Para reportar bugs o sugerencias, abre una issue en el repositorio.

---

Hecho con ❤️ para mejorar la productividad en reuniones.
