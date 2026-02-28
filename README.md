# ⚖️ Traductio - Instrument Avansat de Traducere

Traductio este o aplicație web completă dedicată traducerilor ultra-specializate în domeniile **JURIDIC** și **MEDICAL**. Funcționează folosind inteligența artificială generativă de la Google (Gemini 2.5) ca motor de analiză lingvistică.

Aplicația suportă trei perechi de limbi:

* Română ↔ Spaniolă
* Română ↔ Engleză
* Spaniolă ↔ Engleză

## 🌟 Funcționalități Principale

1. **Selector de Domeniu Activ**: Adaptează automat interfața, vocabularul (glosarele), și instrucțiunile interne (promptul trimis către Gemini) în funcție de documentele alese (Juridic vs Medical vs General).
2. **Translation Memory (TM)**: Sistem local care stochează traducerile trecute. Recunoaște segmentele repetate și ajută la consistența de-a lungul timpului. Reduce costul și asigură uniformitate.
3. **Preluare de PDF-uri**: Permite încărcarea fișierelor PDF pentru extragerea directă a textului pe plan local.
4. **Interfață Premium**: Design personalizat fără framework-uri de CSS (fără Tailwind), creat "from scratch" folosind proprietăți CSS moderne (variabile, glassmorphism, micro-interacțiuni, adaptare la domeniu).
5. **Glosare Specializate Hardcodate**: Dicționare interne care forțează respectarea traducerilor exacte (ex: *hotărâre judecătorească = sentencia judicial*, nu altceva).

## 🛠️ Tehnologii Utilizate

* **HTML5 & CSS3** - Structură curată, design premium și variabile CSS dinamice.
* **Vanilla JavaScript** (`script.js`, `translation-memory.js`, `glossaries.js`) - Arhitectură modulară, gestionarea stărilor și manipularea DOM.
* **PDF.js (Mozilla)** - Pentru parsarea complet locală a documentelor de tip PDF din browser (fără server de procesare fișiere).
* **Google Gemini API** (`generativelanguage.googleapis.com`) - Motorul de analiză semantică responsabil de traducerile specializate.

## 🚀 Cum să rulați aplicația

Deoarece aplicația folosește tehnologii client-side moderne și module (sau Workers în cazul `pdf.js`), din considerente de securitate ale browsere-lor (CORS policy), este recomandată rularea aplicației printr-un server HTTP local, nu doar dublu-click pe `index.html`.

### Opțiunea 1: Folosind extensia Live Server (VS Code)

1. Deschideți folderul proiectului în **Visual Studio Code**.
2. Asigurați-vă că aveți instalată extensia [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer).
3. Dați click dreapta pe `index.html` și selectați **"Open with Live Server"**.

### Opțiunea 2: Folosind Python (dacă e instalat pe sistem)

1. Deschideți terminalul/CMD în folderul `Traductio`.
2. Rulați comanda: `python -m http.server 8000`
3. Accesați în browser: `http://localhost:8000`

### Setați cheia API

La prima pornire a aplicației, va trebui să introduceți o cheie **Google Gemini API** dând click pe **butonul de rotiță (Setări)** din colțul dreapta-sus al aplicației. Această cheie este salvată securizat doar în browserul dvs. local (`localStorage`).

## 📁 Structura Fişierelor

* `index.html` - Interfața grafică principală.
* `style.css` - Framework-ul vizual creat pentru aplicație.
* `glossaries.js` - Stocarea structurilor de dicționare.
* `translation-memory.js` - Logica pentru sistemul TM și baza sa de date pseudo-locală.
* `script.js` - Controlerul principal (event listeneri, logică PDF, request-uri API).
* `README.md` - Această documentație.

## 📝 Reguli de Traducere Integrate

* **JURIDIC**: Folosește terminologia oficială din spațiul limbii țintă; păstrează numere/articole/date fără a parafraza. Adaugă note de traducător (între paranteze) acolo unde nu există echivalențe.
* **MEDICAL**: Nu modifică denumirile comerciale (DCI), valorile numerice sau unitățile de măsură. Adaptează abrevierile sau le marchează corespunzător.

*© 2026 Traductio Project*
