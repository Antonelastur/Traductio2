/**
 * Traductio Glossaries
 * Hardcoded technical vocabularies and guidelines for high-accuracy translation
 */

const TraductioGlossaries = {
    // === DOMENIUL JURIDIC ===
    juridic: {
        "RO-ES": [
            "hotărâre judecătorească = sentencia judicial",
            "certificat de naștere = certificado de nacimiento",
            "procură = poder notarial",
            "rezilierea contractului = rescisión (o resolución) del contrato",
            "partea vătămată = la parte perjudicada",
            "inculpat = acusado / procesado",
            "martor = testigo",
            "prejudiciu = daño / perjuicio",
            "taxă de timbru = tasa judicial",
            "recurs = recurso de casación / apelación",
            "domiciliu ales = domicilio a efectos de notificaciones"
        ],
        "RO-EN": [
            "hotărâre judecătorească = court ruling / judgment",
            "certificat de naștere = birth certificate",
            "procură = power of attorney (PoA)",
            "rezilierea contractului = termination of the contract",
            "partea vătămată = injured party / aggrieved party",
            "inculpat = defendant",
            "martor = witness",
            "prejudiciu = prejudice / damage",
            "taxă de timbru = stamp duty / court fee",
            "recurs = appeal",
            "domiciliu ales = elected domicile / address for service"
        ],
        "ES-EN": [
            "sentencia judicial = court ruling / judgment",
            "certificado de nacimiento = birth certificate",
            "poder notarial = power of attorney",
            "rescisión del contrato = termination of contract",
            "la parte perjudicada = injured party",
            "acusado = defendant",
            "testigo = witness",
            "daño / perjuicio = damage / prejudice",
            "tasa judicial = court fee",
            "recurso de casación = appeal in cassation"
        ]
    },

    // === DOMENIUL MEDICAL ===
    medical: {
        "RO-ES": [
            "fișă de pacient = historial clínico / ficha del paciente",
            "diagnostic = diagnóstico",
            "rețetă medicală = receta médica / prescripción",
            "analize de laborator = análisis de laboratorio",
            "tensiune arterială = presión arterial",
            "ritm cardiac = frecuencia cardíaca",
            "ecografie = ecografía / ultrasonido",
            "efecte adverse = efectos adversos / efectos secundarios",
            "insuficiență renală = insuficiencia renal",
            "accident vascular cerebral (AVC) = accidente cerebrovascular (ACV)",
            "unitate de primiri urgențe (UPU) = servicio de urgencias"
        ],
        "RO-EN": [
            "fișă de pacient = patient record / clinical history",
            "diagnostic = diagnosis",
            "rețetă medicală = medical prescription / recipe",
            "analize de laborator = laboratory tests / blood work",
            "tensiune arterială = blood pressure",
            "ritm cardiac = heart rate",
            "ecografie = ultrasound / sonogram",
            "efecte adverse = adverse effects / side effects",
            "insuficiență renală = kidney failure / renal failure",
            "accident vascular cerebral (AVC) = stroke / cerebrovascular accident (CVA)",
            "unitate de primiri urgențe (UPU) = emergency room (ER)"
        ],
        "ES-EN": [
            "historial clínico = medical record",
            "diagnóstico = diagnosis",
            "receta médica = medical prescription",
            "análisis de laboratorio = laboratory tests",
            "presión arterial = blood pressure",
            "frecuencia cardíaca = heart rate",
            "ecografía = ultrasound",
            "efectos adversos = side effects",
            "insuficiencia renal = kidney failure",
            "accidente cerebrovascular (ACV) = stroke",
            "servicio de urgencias = emergency room (ER)"
        ]
    }
};

/**
 * Helper to get glossary string for injection in the Gemini prompt
 */
function getGlossaryText(domain, sourceLang, targetLang) {
    if (domain === "general") return ""; // General doesn't use hardcoded specialized glossaries

    const pair1 = `${sourceLang}-${targetLang}`;
    const pair2 = `${targetLang}-${sourceLang}`; // reverse lookup fallback

    const domainDict = TraductioGlossaries[domain];
    if (!domainDict) return "";

    let terms = domainDict[pair1];
    if (!terms && domainDict[pair2]) {
        // If we only have the reverse pair, try to reverse the mapping (rudimentary)
        terms = domainDict[pair2].map(t => {
            const parts = t.split(" = ");
            return parts.length === 2 ? `${parts[1]} = ${parts[0]}` : t;
        });
    }

    if (terms && terms.length > 0) {
        return `\n--- GLOSAR TERMINOLOGIC RECOMANDAT ---\n${terms.join("\n")}\n---------------------------------------\n`;
    }

    return "";
}

window.getGlossaryText = getGlossaryText;
