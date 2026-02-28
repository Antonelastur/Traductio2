/**
 * MAIN CONTROLLER
 * Handles UI interactions, Gemini API, and PDF text extraction
 */

document.addEventListener('DOMContentLoaded', () => {

    // === PDF.js Worker Configuration ===
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

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
                document.body.classList.remove('theme-general', 'theme-juridic', 'theme-medical');
                document.body.classList.add(`theme-${newDomain}`);
            });
        });
    }

    // === Settings Modal Logic ===
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            // Reîncărcăm vizual cheia de fiecare dată când se deschide modalul
            // deoarece browserele au tendința să golească câmpurile type="password" la scurt timp după page load
            if (apiKeyInput) apiKeyInput.value = localStorage.getItem('traductio_api_key') || apiKey;
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
                copyBtn.innerHTML = `✅`;
                setTimeout(() => {
                    copyBtn.innerHTML = `📋`;
                }, 2000);
            } catch (err) {
                console.error('Failed to copy text', err);
            }
        });
    }


    // === PDF Extraction ===
    if (pdfUpload) {
        pdfUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (file.type !== 'application/pdf') {
                alert('Te rugăm să selectezi un fișier PDF valid.');
                return;
            }

            showLoading("Extragere text din PDF...");

            try {
                const arrayBuffer = await file.arrayBuffer();
                const typedarray = new Uint8Array(arrayBuffer);
                const loadingTask = pdfjsLib.getDocument({ data: typedarray });
                const pdf = await loadingTask.promise;

                let extractedText = "";
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
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
                    sourceText.dispatchEvent(new Event('input'));
                }
            } catch (error) {
                console.error("Eroare PDF:", error);
                alert(`Nu s-a putut extrage textul din PDF.\nEroare: ${error.message}`);
            } finally {
                hideLoading();
                e.target.value = '';
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
        // Redownload the key from localStorage dynamically as a fail-safe
        const currentKey = localStorage.getItem('traductio_api_key') || apiKey;

        if (!currentKey) {
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

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${currentKey}`, {
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
