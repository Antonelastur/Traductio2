/**
 * Translation Memory System
 * Stores and retrieves previous translations to improve consistency and speed.
 */
class TranslationMemory {
    constructor() {
        this.storageKey = 'traductio_tm_db';
        this.entries = this.loadEntries();
    }

    /**
     * Încarcă baza de date din LocalStorage
     */
    loadEntries() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Failed to load TM from localStorage", e);
            return [];
        }
    }

    /**
     * Salvează TM în LocalStorage
     */
    saveDatabase() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.entries));
            // Trigger a custom event to update UI stats
            window.dispatchEvent(new CustomEvent('tm-updated', { detail: { count: this.entries.length } }));
        } catch (e) {
            console.error("Failed to save TM to localStorage", e);
        }
    }

    /**
     * Adaugă o nouă traducere în memorie (sau o actualizează)
     */
    addTranslation(sourceLang, targetLang, domain, sourceText, translatedText) {
        if (!sourceText || !translatedText || sourceText.trim() === '') return;

        const normalizedSource = sourceText.trim();
        const normalizedTarget = translatedText.trim();

        // Căutăm dacă există deja exact același text sursă în același domeniu/limbi
        const existingIndex = this.entries.findIndex(entry => 
            entry.source_lang === sourceLang &&
            entry.target_lang === targetLang &&
            entry.domain === domain &&
            entry.source_text.toLowerCase() === normalizedSource.toLowerCase()
        );

        if (existingIndex !== -1) {
            // Actualizăm intrarea existentă
            this.entries[existingIndex].used_count += 1;
            // Dacă traducerea diferă, o putem suprascrie pt actualizare
            this.entries[existingIndex].translated_text = normalizedTarget;
            this.entries[existingIndex].updated_at = new Date().toISOString();
        } else {
            // Generare UUID simplu
            const uuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
            
            const newEntry = {
                id: uuid,
                source_lang: sourceLang,
                target_lang: targetLang,
                domain: domain,
                source_text: normalizedSource,
                translated_text: normalizedTarget,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                used_count: 1,
                confirmed: true
            };
            this.entries.push(newEntry);
        }

        this.saveDatabase();
    }

    /**
     * Caută potriviri (exacte sau fragmentare) în TM
     * Pentru simplitate (fără NLP avansat local), vom folosi un scor de similaritate simplu
     * sau căutare exactă / incluziune
     */
    findMatches(text, domain, sourceLang, targetLang) {
        if (!text || text.trim() === '') return [];
        
        const queryText = text.toLowerCase().trim();
        const matches = [];

        // Filtram intrarile dupa domeniu si limbi
        const candidates = this.entries.filter(entry => 
            entry.domain === domain &&
            entry.source_lang === sourceLang &&
            entry.target_lang === targetLang
        );

        for (const entry of candidates) {
            const tmText = entry.source_text.toLowerCase();
            
            // Exact match
            if (tmText === queryText) {
                matches.push({ ...entry, match_type: 'exact', score: 100 });
                continue;
            }

            // Inclusivitate (TM conține o parte din query sau Query conține o parte din TM - relevanță ridicată)
            // Limităm la segmente care au sens (peste 15 caractere)
            if (tmText.length > 15 && queryText.includes(tmText)) {
                matches.push({ ...entry, match_type: 'partial_source_in_query', score: 85 });
            } else if (queryText.length > 15 && tmText.includes(queryText)) {
                matches.push({ ...entry, match_type: 'partial_query_in_source', score: 75 });
            }
        }

        // Returnăm top 3 rezultate sortate după scor descendendent, apoi dupa used_count
        return matches.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return b.used_count - a.used_count;
        }).slice(0, 3);
    }

    /**
     * Formatează matches-urile pentru promptul lui Gemini
     */
    formatMatchesForPrompt(matches) {
        if (!matches || matches.length === 0) return "Niciun segment TM relevant.";

        let formatted = "--- SEGMENTE DIN MEMORIA DE TRADUCERE ---\n";
        matches.forEach(m => {
            formatted += `SURSĂ: "${m.source_text}"\n`;
            formatted += `TRADUCERE: "${m.translated_text}"\n`;
            formatted += `(Potrivire: ${m.score}%, Folosit de: ${m.used_count} ori)\n\n`;
        });
        return formatted;
    }

    clearDatabase() {
        this.entries = [];
        this.saveDatabase();
    }

    getCount() {
        return this.entries.length;
    }
}

// Instatem motorul TM pe Window pentru acces global
window.TMDB = new TranslationMemory();
