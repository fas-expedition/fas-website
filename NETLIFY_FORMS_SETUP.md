# Netlify Forms Setup für Inquiry Form

## ✅ Was wurde konfiguriert?

Die Inquiry Form wird **ausschließlich** über **Netlify Forms** verarbeitet (keine SendGrid-Function
mehr im Submit-Pfad):
- ✅ Form-Submissions werden automatisch erfasst
- ✅ E-Mail-Benachrichtigungen möglich
- ✅ Native Netlify Dashboard Integration
- ✅ Spam-Schutz (Honeypot + client-seitiger Timing-Check)
- ✅ Das clientseitig generierte PDF wird als Datei-Anhang der Submission übermittelt
- ✅ Alle Checkbox-/Auswahl-Details werden als individuelle Felder übermittelt (native Formularfelder)

---

## 🚀 E-Mail-Benachrichtigungen einrichten

### 1. Im Netlify Dashboard:

1. Geh zu dein **Projekt** → **Forms** Tab
2. Du solltest die Form **"inquiry"** sehen
3. Klick drauf und geh zu **Settings**
4. Under **Notifications** → klick **Add notification**
5. Wähle **Email notification**
6. Trag deine E-Mail-Adresse ein (z.B. `inquiry@fas-expedition.de`)
7. **Save**

### 2. Alternativ: Im Netlify Dashboard Directly

Falls "Add notification" nicht sichtbar ist:
1. **Site settings** → **Build & deploy** → **Environment**
2. Füge diese Variable hinzu:
   ```
   INQUIRY_EMAIL=inquiry@fas-expedition.de
   ```

---

## 📊 Submissions einsehen

1. **Netlify Dashboard** → **Forms**
2. Klick auf **"inquiry"** Form
3. Alle eingegangenen Anfragen werden hier angezeigt mit:
   - ✅ Name, E-Mail, Telefon
   - ✅ Nachricht & Details
   - ✅ Zeitstempel
   - ✅ Download als CSV möglich

---

## 🔔 Optional: Slack Benachrichtigungen

1. In **Netlify Dashboard** → **Forms** → **"inquiry"** → **Settings**
2. Klick **Add notification** → **Slack**
3. Autorisiere und wähle Slack Channel
4. Fortan gibt's Benachrichtigungen im Slack Channel

---

## 📋 Form-Felder die erfasst werden

- Name ✓
- Street (Straße)
- Postal (PLZ/Ort)
- Country (Land)
- Email ✓
- Phone ✓
- Message ✓
- Locale (Sprache)
- Selected Details (ausgewählte Features, zusammengefasst als Textfeld)
- Alle einzelnen Checkbox-Felder (z.B. `details_basisfahrzeug_seilwinde`) – jedes als eigene Spalte
- Special Wishes (Spezialwünsche)
- Base Vehicle Model
- Base Vehicle Custom
- **PDF-Anhang** (`pdf_attachment`) – das clientseitig generierte Anfrage-PDF
- Dokumente (`documents`) – optional vom Kunden hochgeladenes erstes Dokument (Netlify erlaubt nur 1 Datei/Feld)

---

## 📎 PDF-Erstellung & -Übermittlung

- Das PDF wird weiterhin im Browser mit `window.generateInquiryPDF()` (`src/assets/js/inquiry-pdf.js`)
  erzeugt – unverändert gegenüber der bisherigen SendGrid-Lösung.
- Beim Absenden wird das PDF (Base64 → `Blob`) in das versteckte Datei-Feld `pdf_attachment` der
  Netlify-Form gesetzt (`FormData.set(...)`) und zusammen mit allen übrigen Feldern an `/` gePOSTet.
- Netlify speichert die Submission inkl. PDF-Datei; der Download-Link erscheint im Dashboard unter
  **Forms → inquiry → [Submission]**.
- Formulargröße ist bei Netlify auf 8 MB begrenzt – für das generierte PDF (üblicherweise wenige
  hundert KB) ist das ausreichend.

---

## 🧾 SevDesk-Integration (optional, per Outgoing Webhook)

Die frühere SevDesk-Anbindung (automatische Kontakt- + Angebotserstellung) läuft jetzt **nicht mehr**
inline in der Submit-Function, sondern als eigenständige Netlify Function
`netlify/functions/sevdesk-webhook.js`, die von einem Netlify-Forms-**Outgoing-Webhook** ausgelöst wird:

1. **Netlify Dashboard** → dein Projekt → **Forms** → **"inquiry"** → **Settings** → **Notifications**
2. **Add notification** → **Outgoing webhook**
3. **Form**: `inquiry`
4. **URL**: `https://<deine-domain>/.netlify/functions/sevdesk-webhook?secret=<SEVDESK_WEBHOOK_SECRET>`
5. **Save**

Benötigte Umgebungsvariablen (Netlify Dashboard → Site settings → Environment):

```
SEVDESK_API_TOKEN      = <dein SevDesk API Token>   # ohne diesen Wert tut die Function nichts
SEVDESK_WEBHOOK_SECRET = <ein selbst gewähltes Secret, muss mit der Webhook-URL übereinstimmen>
```

Die Zuordnung Checkbox → SevDesk-Artikel erfolgt weiterhin über `netlify/sevdesk-mapping.json`.

Ist `SEVDESK_API_TOKEN` nicht gesetzt, antwortet die Function mit `200 { skipped: true }` und tut
sonst nichts – die Netlify-Forms-Submission selbst ist davon nie betroffen.

---

## 🧪 Test

1. Geh zu http://localhost:8080/de/ oder /en/
2. Öffne das **Inquiry Form**
3. Füll aus (inkl. ein paar Checkboxen) und sende
4. Sollte sofort im Netlify Dashboard unter **Forms** → **inquiry** erscheinen, inkl. PDF-Anhang zum
   Download

---

## ⚙️ GTM Event Tracking

Der Form-Submit trackt automatisch Events in Google Tag Manager:
- `form_submit` - Form wurde gesendet
- `conversion_inquiry_submitted` - Conversion Event

Diese sind im **GTM Preview Mode** sichtbar!

---

## 📧 Keine Benachrichtigungen?

Falls keine E-Mails ankommen:
1. Check in **Netlify Dashboard** → **Forms** → **"inquiry"** → ist es dort?
2. Hat du Notifications konfiguriert?
3. Check Spam-Ordner
4. Geh zu **Site settings** → **Notifications** und überprüf den Setup

Wenn immer noch Probleme: gib mir Bescheid, ich help weiter! 🚀
