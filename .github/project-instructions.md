# One-Click Recap - Instrucciones

## Estructura del Proyecto

- **Frontend Framework**: React 18 con Vite
- **Estilos**: Tailwind CSS
- **Iconografía**: Lucide React
- **API Principal**: Web Speech API (navegador)
- **Almacenamiento**: localStorage

## Arquitectura

### App.jsx
- Componente raíz que gestiona todo el estado
- Inicializa Web Speech API
- Maneja grabación, transcripción y procesamiento
- Integra localStorage para persistencia

### Componentes
1. **RecordingButton**: Botón circular con animación de pulse
2. **TranscriptDisplay**: Muestra texto en tiempo real
3. **ResultsDisplay**: Tarjetas elegantes con resultados
4. **MeetingHistory**: Lista de reuniones guardadas
5. **Sidebar**: Navegación lateral con historial

### MeetingProcessor.js
Clase estática para procesamiento de texto:
- Extrae tareas, acuerdos y próxima reunión
- Usa palabras clave para identificación
- Formatea datos para almacenamiento

## Características Implementadas

✅ Grabación continua con Web Speech API
✅ Transcripción fluida en tiempo real
✅ Procesamiento automático de contenido
✅ Tarjetas elegantes con animaciones
✅ Persistencia con localStorage
✅ Dark mode con acentos neón
✅ Animaciones suaves
✅ Iconografía moderna
✅ Diseño responsive
✅ Historial de reuniones

## Cómo Ejecutar

```bash
npm install
npm run dev
```

Abre http://localhost:5173

## Estructura de Carpetas

```
src/
├── components/
│   ├── RecordingButton.jsx
│   ├── TranscriptDisplay.jsx
│   ├── ResultsDisplay.jsx
│   ├── MeetingHistory.jsx
│   └── Sidebar.jsx
├── App.jsx
├── MeetingProcessor.js
├── main.jsx
└── index.css
```

## Directrices de Desarrollo

1. **Componentes**: Usar props para comunicación (no props drilling excesivo)
2. **Estado**: Mantener en App.jsx, pasar mediante props
3. **Estilos**: Usar únicamente Tailwind (no CSS modules o styled-components)
4. **Iconografía**: Solo Lucide React
5. **localStorage**: Serializar con JSON

## Palabras Clave Identificadas

### Tareas
- hacer, tarea, acción, debo, necesito, hay que, tengo que, todo, revisar, completar

### Acuerdos  
- acordamos, acuerdo, decidimos, se acordó, estamos de acuerdo, consenso, planteamos, propusimos, definimos

### Próxima Reunión
- próxima reunión, siguiente reunión, próximo, next meeting, reunión, junta, mitin

## Notas Técnicas

- Web Speech API requiere idioma especificado (españolño: 'es-ES')
- LocalStorage limita a ~5-10MB de datos
- Pulse wave animation en CSS puro
- Responsive design con breakpoints de Tailwind

## Próximas Mejoras Sugeridas

- Exportación a PDF
- Integración con APIs externas
- Soporte multiidioma mejorado
- Análisis de sentimientos
- Gravación de audio
