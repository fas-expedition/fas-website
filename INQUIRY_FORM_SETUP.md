# Inquiry Form Email Configuration

Die Anfrageformular auf der Landing Page versendet E-Mails automatisch an `stefan.klug@fas-expedition.de`.

## Setup für Production

Die Netlify Function benötigt einen E-Mail-Service zum Versenden. Wir verwenden **Formspree** (kostenlos).

### Schritt 1: Formspree Account erstellen

1. Besuche https://formspree.io
2. Registriere dich mit deiner E-Mail
3. Erstelle ein neues Formular in Formspree
4. Du erhältst eine Formspree ID (z.B. `f_xxxxx`)

### Schritt 2: Netlify Function aktualisieren

Öffne `netlify/functions/inquiry.js` und ersetze:

```javascript
const formspreeEndpoint = 'https://formspree.io/f/YOUR_FORMSPREE_ID';
```

mit deiner echten Formspree ID:

```javascript
const formspreeEndpoint = 'https://formspree.io/f/xxxxx';
```

Oder noch besser: Nutze eine Umgebungsvariable in Netlify:

### Schritt 3: Environment Variable in Netlify setzen

1. Gehe zu Netlify Dashboard → Site Settings → Build & Deploy → Environment
2. Füge hinzu:
   - Key: `FORMSPREE_ID`
   - Value: `f_xxxxx`

Dann aktualisiere die Function:

```javascript
const formspreeEndpoint = `https://formspree.io/${process.env.FORMSPREE_ID}`;
```

### Schritt 4: E-Mail Adresse in Formspree konfigurieren

1. In Formspree Dashboard → Your Forms
2. Wähle das Formular
3. Konfiguriere die E-Mail-Adresse: `stefan.klug@fas-expedition.de`
4. Aktiviere E-Mail Benachrichtigungen

### Schritt 5: Deploy

Sobald die Konfiguration komplett ist, deploye die Änderungen zu Netlify. Die Funktion wird dann automatisch bei jedem Formular-Submit aufgerufen.

## Testing lokal

Im Development mit `npm run dev` funktioniert das Formular trotzdem, nur die E-Mail wird nicht versendet (wenn Formspree nicht konfiguriert ist). Das ist OK für lokales Testing.

## Alternative: SendGrid

Falls du SendGrid verwenden möchtest statt Formspree:

1. Erstelle einen SendGrid Account
2. Generiere einen API Key
3. Nutze folgende Function:

```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'stefan.klug@fas-expedition.de',
  from: process.env.SENDGRID_FROM_EMAIL,
  subject: `Neue Anfrage von ${data.name}`,
  text: formatText(data),
  html: formatHtml(data)
};

await sgMail.send(msg);
```

Du müsstest dann `@sendgrid/mail` per npm installieren.

## Fallback: JSON Logging

Falls kein E-Mail-Service konfiguriert ist, werden alle Anfragen in den Netlify Logs gespeichert und können später manuell verarbeitet werden.
