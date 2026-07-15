# E-Mail Notifications Setup Guide

## SendGrid Integration für Inquiry Form

Die Netlify Function ist jetzt mit SendGrid konfiguriert. Hier sind die notwendigen Schritte:

## 1️⃣ SendGrid Account erstellen

1. Geh zu [sendgrid.com](https://sendgrid.com)
2. Registriere dich (kostenlosen Plan wählen)
3. Verifiziere deine E-Mail-Adresse
4. Verifiziere deine Domain oder nutze `sendgrid.net` Subdomain

## 2️⃣ API Key generieren

1. Im SendGrid Dashboard: **Settings** → **API Keys**
2. Klick auf **Create API Key**
3. Gib einen Namen ein (z.B. "FAS Expedition")
4. Wähle **Restricted Access** (besser für Sicherheit)
5. Unter **Mail Send** → setze auf **Full Access**
6. Kopiere den API Key (⚠️ wird nur 1x angezeigt!)

## 3️⃣ Netlify Environment Variables setzen

1. Geh zu dein Netlify Dashboard
2. **Site settings** → **Build & deploy** → **Environment**
3. Klick **Add a variable**
4. Erstelle diese Variables:

```
Name: SENDGRID_API_KEY
Value: sk_live_xxxx... (dein API Key von oben)

Name: INQUIRY_EMAIL
Value: inquiry@fas-expedition.de (oder deine Anfrage-E-Mail)
```

## 4️⃣ Deploy & Test

1. Drück **Deploy** in Netlify (oder push zu main)
2. Geh zur Website
3. Öffne Inquiry Form
4. Füll aus und sende

## ✅ Was passiert dann?

- ✉️ E-Mail an `inquiry@fas-expedition.de` mit allen Daten
- 📬 Bestätigungs-E-Mail an den Kunden
- 📊 GTM Events werden getrackt
- 📋 Logs verfügbar in Netlify Functions → Logs

## 🔍 Debug

Falls E-Mails nicht ankommen:
1. Check **Netlify Dashboard** → **Functions** → **Logs**
2. Look for SendGrid API Errors
3. Prüf API Key und Umgebungsvariablen

## 📧 Sender-Adresse

Aktuell: `noreply@fas-expedition.de`

Falls diese Domain nicht verifiziert ist bei SendGrid:
- SendGrid wird automatisch einen "On Behalf Of" Banner hinzufügen
- Oder nutze eine verifizierte E-Mail-Adresse (z.B. `info@fas-expedition.de`)

## 🚀 Weitere Konfiguration

Die Function sendet automatisch:
- ✅ Deutsche oder englische E-Mails (basierend auf `locale`)
- ✅ Alle Formulardaten
- ✅ Reply-To: Kunde's E-Mail

Keine weitere Konfiguration nötig!
