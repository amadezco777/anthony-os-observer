# anthony-os-observer

Automatización diaria que consulta en Jira las tareas asignadas a tu usuario, arma un resumen simple (pendientes, en progreso, bloqueadas y actualizadas recientemente) y lo envía por Telegram mediante un bot.

Pensado para correr manualmente o programado con `cron` en una VPS Linux.

## Requisitos

- Node.js 20 o superior
- Una cuenta de Jira Cloud (`*.atlassian.net`) con un API Token
- Un bot de Telegram y el `chat_id` donde se enviará el resumen

## Instalación

```bash
npm install
cp .env.example .env
```

Completa el archivo `.env` con tus credenciales (ver sección siguiente).

## Configuración

### Jira

1. **JIRA_BASE_URL**: la URL de tu instancia, por ejemplo `https://tuempresa.atlassian.net`.
2. **JIRA_EMAIL**: el email con el que inicias sesión en Jira.
3. **JIRA_API_TOKEN**: genera uno en [id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens) → "Create API token".
4. **JIRA_RECENT_HOURS** (opcional, default `24`): ventana de horas para la sección "actualizadas recientemente".

Las tareas **bloqueadas** se detectan usando la bandera nativa de Jira ("Flag issue"), no un estado del workflow. Esto permite que una tarea esté "En curso" y bloqueada a la vez. El motivo mostrado en el resumen es el último comentario agregado a la tarea.

### Telegram

1. Habla con [@BotFather](https://t.me/BotFather) en Telegram y crea un bot con `/newbot`. Te dará un token: ese es tu **TELEGRAM_BOT_TOKEN**.
2. Para obtener tu **TELEGRAM_CHAT_ID**:
   - Envía cualquier mensaje a tu bot recién creado.
   - Visita `https://api.telegram.org/bot<TU_TOKEN>/getUpdates` en el navegador.
   - Busca el campo `"chat":{"id": ...}` en la respuesta JSON — ese número es tu chat ID.

## Ejecución manual

```bash
npm run build
npm start
```

Para iterar durante desarrollo sin compilar cada vez:

```bash
npm run dev
```

## Ejecución programada con cron (VPS Linux)

1. Compila el proyecto una vez en el servidor:

   ```bash
   cd /ruta/al/proyecto/anthony-os-observer
   npm install
   npm run build
   ```

2. Edita el crontab del usuario:

   ```bash
   crontab -e
   ```

3. Agrega una línea para ejecutarlo, por ejemplo todos los días a las 8:00 AM:

   ```cron
   0 8 * * * cd /ruta/al/proyecto/anthony-os-observer && /usr/bin/node dist/index.js >> logs/cron.log 2>&1
   ```

   Ajusta la ruta al proyecto y la ruta de `node` (`which node`) según tu servidor. El archivo `.env` debe existir en la raíz del proyecto para que se carguen las credenciales.

## Estructura del proyecto

```
src/
├── config/env.ts       # Carga y valida las variables de entorno
├── jira/
│   ├── client.ts        # Llamadas HTTP autenticadas a la REST API de Jira
│   ├── types.ts          # Tipos de datos de Jira
│   └── service.ts        # Arma el JQL y categoriza las tareas
├── telegram/client.ts    # Envío de mensajes a Telegram
├── report/buildReport.ts # Genera el texto del resumen diario
├── adf.ts                 # Extrae texto plano de comentarios (Atlassian Document Format)
├── logger.ts               # Logging simple a consola y a logs/app.log
└── index.ts                 # Punto de entrada: orquesta toda la ejecución
```

## Logs y manejo de errores

- Cada ejecución escribe logs con timestamp en `logs/app.log` (además de la consola).
- Si falla la consulta a Jira, se registra el error y se intenta notificar por Telegram que el resumen no pudo generarse.
- Si falla el envío a Telegram, el error queda registrado en `logs/app.log` y el proceso termina con código de salida `1` (útil para detectar fallos desde `cron`).
- Si faltan variables de entorno requeridas, el proceso falla inmediatamente con un mensaje indicando cuáles faltan.
