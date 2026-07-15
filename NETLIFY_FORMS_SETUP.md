# Netlify Forms Setup für Inquiry Form

## ✅ Was wurde konfiguriert?

Die Inquiry Form ist jetzt direkt mit **Netlify Forms** integriert:
- ✅ Form-Submissions werden automatisch erfasst
- ✅ E-Mail-Benachrichtigungen möglich
- ✅ Native Netlify Dashboard Integration
- ✅ Spam-Schutz (Honeypot)

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
- Selected Details (ausgewählte Features)
- Special Wishes (Spezialwünsche)
- Base Vehicle Model
- Base Vehicle Custom

---

## 🧪 Test

1. Geh zu http://localhost:8080/de/ oder /en/
2. Öffne das **Inquiry Form**
3. Füll aus und sende
4. Sollte sofort im Netlify Dashboard unter **Forms** → **inquiry** erscheinen

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
