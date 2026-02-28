/**
 * MAIN CONTROLLER
 * Handles UI interactions, Gemini API, and PDF text extraction
 */

document.addEventListener('DOMContentLoaded', () => {
    // === Global Error Catcher for Debugging ===
    window.onerror = function (msg, url, line, col, error) {
        const text = document.getElementById('sourceText');
        if (text) text.value = `[Eroare Globală]\nMesaj: ${msg}\nLinie: ${line}\nColoană: ${col}\nEroare: ${error}`;
        return false;
    };
    window.addEventListener("unhandledrejection", function (event) {
        const text = document.getElementById('sourceText');
        if (text) text.value = `[Eroare Promisiune Nefinalizată]\nMotiv: ${event.reason}`;
    });

    // === UI Elements ===
    const domainBtns = document.querySelectorAll('.domain-btn');
    const sourceLangSelect = document.getElementById('sourceLang');
    const targetLangSelect = document.getElementById('targetLang');

    const sourceText = document.getElementById('sourceText');
    const targetText = document.getElementById('targetText');
    const charCountNum = document.getElementById('charCountNum');

    const translateBtn = document.getElementById('translateBtn');
    const copyBtn = document.getElementById('copyBtn');
    const pdfUpload = document.getElementById('pdfUpload');

    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');

    const tmInsights = document.getElementById('tmInsights');
    const tmMatchList = document.getElementById('tmMatchList');

    // Settings Modal
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const tmEntriesCount = document.getElementById('tmEntriesCount');
    const clearTmBtn = document.getElementById('clearTmBtn');

    // State
    let currentDomain = 'general';
    let apiKey = localStorage.getItem('traductio_api_key') || '';

    // === Initialization ===
    if (apiKeyInput) apiKeyInput.value = apiKey;
    updateTmStats();

    // Event listener for global TM updates (from translation-memory.js)
    window.addEventListener('tm-updated', (e) => {
        if (tmEntriesCount) tmEntriesCount.textContent = `${e.detail.count} intrări salvate`;
    });

    function updateTmStats() {
        if (window.TMDB && tmEntriesCount) {
            tmEntriesCount.textContent = `${window.TMDB.getCount()} intrări salvate`;
        }
    }

    // === Domain Switching ===
    if (domainBtns) {
        domainBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                domainBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const newDomain = btn.dataset.domain;
                currentDomain = newDomain;

                // Switch body theme class
                document.body.className = `theme-${newDomain}`;
            });
        });
    }

    // === Settings Modal Logic ===
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            if (settingsModal) settingsModal.classList.remove('hidden');
            updateTmStats();
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            if (settingsModal) settingsModal.classList.add('hidden');
        });
    }

    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
            const key = apiKeyInput ? apiKeyInput.value.trim() : '';
            if (key) {
                localStorage.setItem('traductio_api_key', key);
                apiKey = key;
                if (settingsModal) settingsModal.classList.add('hidden');
            } else {
                alert('Vă rugăm să introduceți un API Key valid.');
            }
        });
    }

    if (clearTmBtn) {
        clearTmBtn.addEventListener('click', () => {
            if (confirm('Ești sigur că vrei să ștergi TOATĂ memoria de traducere?')) {
                window.TMDB.clearDatabase();
                updateTmStats();
            }
        });
    }

    // === Textarea Character Count ===
    if (sourceText && charCountNum) {
        sourceText.addEventListener('input', () => {
            charCountNum.textContent = sourceText.value.length;
        });
    }

    // === Copy Translated Text ===
    if (copyBtn && targetText) {
        copyBtn.addEventListener('click', async () => {
            const textToCopy = targetText.innerText;
            if (!textToCopy) return;

            try {
                await navigator.clipboard.writeText(textToCopy);
                copyBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="text-green-500"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
                setTimeout(() => {
                    copyBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
                }, 2000);
            } catch (err) {
                console.error('Failed to copy text', err);
            }
        });
    }

    // === PDF Extraction ===
    if (pdfUpload) {
        pdfUpload.addEventListener('change', async (e) => {
            try {
                if (sourceText) sourceText.value = "[Event Change] S-a selectat un fișier...";
                const file = e.target.files[0];

                if (!file) {
                    if (sourceText) sourceText.value += "\nEroare: Niciun fișier nu a fost selectat (file este undefined).";
                    return;
                }

                if (sourceText) sourceText.value += `\nNume fișier: ${file.name} | Tip: ${file.type} | Dimensiune: ${file.size} bytes`;

                if (file.type !== 'application/pdf') {
                    if (sourceText) sourceText.value += "\nEroare: Tipul fișierului nu este application/pdf.";
                    return;
                }

                showLoading("Extragere text din PDF...");
                if (sourceText) sourceText.value += "\nCitirea ca ArrayBuffer...";

                const arrayBuffer = await file.arrayBuffer();
                const typedarray = new Uint8Array(arrayBuffer);

                if (sourceText) sourceText.value += `\nArrayBuffer citit cu succes. Mărime: ${typedarray.length} bytes.\nTrimitere către pdf.js...`;

                // Folosim un typed array pentru a asigura compatibilitatea universală cu getDocument
                const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;

                if (sourceText) sourceText.value += `\npdf.js a încărcat documentul. Pagini: ${pdf.numPages}\nÎncepe extragerea...`;

                let extractedText = "";
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();

                    // Varianta mai robustă de extragere a textului pentru a păstra formatarea de linii
                    let lastY = -1;
                    let pageText = "";

                    for (let item of textContent.items) {
                        if (lastY !== item.transform[5] && lastY !== -1) {
                            pageText += "\n";
                        }
                        pageText += item.str + " ";
                        lastY = item.transform[5];
                    }
                    extractedText += pageText + "\n\n";
                }

                if (sourceText) {
                    sourceText.value = extractedText.trim();
                    // Declanșăm evenimentul input manual pentru a actualiza numărul de caractere
                    sourceText.dispatchEvent(new Event('input'));
                }

                hideLoading();
            } catch (error) {
                console.error("Eroare la extragerea PDF-ului:", error);
                if (sourceText) {
                    sourceText.value = "A apărut o eroare la extragerea textului din PDF:\n" + (error.message || error);
                }
                hideLoading();
            } finally {
                e.target.value = ''; // Reset file input
            }
        });
    }

    // === Translation Logic ===
    function showLoading(msg) {
        if (loadingText) loadingText.textContent = msg;
        if (loadingOverlay) loadingOverlay.classList.remove('hidden');
    }

    function hideLoading() {
        if (loadingOverlay) loadingOverlay.classList.add('hidden');
    }

    function buildSystemInstruction(domain) {
        if (domain === 'juridic') {
            return `Ești un traducător juridic profesionist cu experiență în drept român, spaniol și internațional. Traduce textul respectând STRICT: terminologia juridică oficială a țării țintă, echivalențele legale exacte, formulele consacrate din acte notariale/contracte. Păstrează EXACT numerele de articole, datele, sumele de bani. NU parafrazezi, NU simplifici. Dacă un termen nu are echivalent direct, adaugă [termen fără echivalent direct – păstrat în original].`;
        } else if (domain === 'medical') {
            return `Ești un traducător medical profesionist cu experiență în terminologie medicală internațională (ICD-10, nomenclatură anatomică, farmacologie). Traduce textul respectând STRICT: denumirile științifice/latine, denumirile comerciale (NESCHIMBATE), unitățile de măsură (NESCHIMBATE), abrevierile medicale standard. Stil neutru și precis. Dacă o abreviere nu are echivalent, notează: [termen menținut în original – fără echivalent standardizat].`;
        } else {
            return `Ești un traducător profesionist. Traduce textul cu acuratețe maximă, păstrând stilul și formatarea.`;
        }
    }

    async function callGemini(text, domain, sourceLang, targetLang, tmContext, glossaryContext) {
        if (!apiKey) {
            throw new Error("API_KEY_MISSING");
        }

        const systemInstruction = buildSystemInstruction(domain);

        let promptText = `Cerință: Traduce din ${sourceLang} în ${targetLang}.\n\n`;
        if (glossaryContext) {
            promptText += glossaryContext + "\n\n";
        }
        if (tmContext && tmContext !== "Niciun segment TM relevant.") {
            promptText += `CONȚINUT TM RELEVANT (Folosiți-l opțional dacă se potrivește contextual):\n${tmContext}\n\n`;
        }
        promptText += `TEXT SURSĂ:\n${text}`;

        const requestBody = {
            contents: [{
                parts: [{ text: promptText }]
            }],
            systemInstruction: {
                role: "user",
                parts: [{ text: systemInstruction }]
            },
            generationConfig: {
                temperature: 0.1, // Scădem temperatura pentru acuratețe tehnică
                topK: 32,
                topP: 1
            }
        };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Gemini Error Response:", data);
            throw new Error(data.error?.message || "Eroare la comunicarea cu API-ul Gemini");
        }

        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error("Răspuns invalid de la Gemini API");
        }
    }

    if (translateBtn) {
        translateBtn.addEventListener('click', async () => {
            if (!sourceText || !targetText || !sourceLangSelect || !targetLangSelect) return;
            const textToTranslate = sourceText.value.trim();
            if (!textToTranslate) return;

            const sl = sourceLangSelect.value;
            const tl = targetLangSelect.value;

            if (sl === tl) {
                alert("Limbile selectate sunt identice.");
                return;
            }

            // 1. Căutare în memoria de traducere (TM)
            const tmMatches = window.TMDB ? window.TMDB.findMatches(textToTranslate, currentDomain, sl, tl) : [];

            // Afișăm matches în UI (Dacă există)
            if (tmMatchList) tmMatchList.innerHTML = '';
            if (tmMatches.length > 0 && tmInsights && tmMatchList) {
                tmInsights.classList.remove('hidden');
                tmMatches.forEach(m => {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>Sursă:</strong> ${m.source_text} <br> <strong>Traducere:</strong> ${m.translated_text} <br> <span style="font-size:0.8rem; color:var(--theme-accent)">(${m.score}% potrivire)</span>`;
                    tmMatchList.appendChild(li);
                });
            } else if (tmInsights) {
                tmInsights.classList.add('hidden');
            }

            const tmPromptContext = window.TMDB ? window.TMDB.formatMatchesForPrompt(tmMatches) : "";

            // 2. Extragere Glosar
            let glossaryContext = "";
            if (window.getGlossaryText) {
                glossaryContext = window.getGlossaryText(currentDomain, sl, tl);
            }

            // 3. Traducere via API
            try {
                showLoading("Traducere în curs...");

                // Formatare newline-uri HTML în caz că răspunsul le pierde
                targetText.innerHTML = "<em>Procesare...</em>";

                const translatedResult = await callGemini(
                    textToTranslate,
                    currentDomain,
                    sl,
                    tl,
                    tmPromptContext,
                    glossaryContext
                );

                // Înlocuim newline cu <br>
                const formattedResult = translatedResult.replace(/\n/g, '<br>');
                targetText.innerHTML = formattedResult;

                // 4. Salvare în TM pentru viitor
                if (window.TMDB) window.TMDB.addTranslation(sl, tl, currentDomain, textToTranslate, translatedResult);

            } catch (error) {
                console.error(error);
                if (error.message === "API_KEY_MISSING") {
                    targetText.innerHTML = `<span style="color: #ef4444;">Eroare: Nu aveți setat un API Key pentru Gemini.</span>`;
                    if (settingsModal) settingsModal.classList.remove('hidden'); // Opertim modulul de setări
                } else {
                    targetText.innerHTML = `<span style="color: #ef4444;">Eroare: ${error.message}</span>`;
                }
            } finally {
                hideLoading();
            }
        });
    }

});
