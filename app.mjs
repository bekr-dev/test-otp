import express, { json } from "express"
//import * as db from "./Configs/db.config.mjs"
import mailRouter from "./Routers/mail.route.mjs"
import cors from "cors"

const app = express()

//db.config()

app.use(cors({
    origin: "*",
    methods: "*"
}))

app.use(json())
//app.use(express.json());

app.use("/v1/mail", mailRouter)









const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY = process.env.OPENROUTER_API_KEY;

// ==========================================
// ÉTAPE 1 — Détection + Traduction
// ==========================================
async function detectAndTranslate(userText, llamaModel) {
    try {
        const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: llamaModel,
                messages: [
                    {
                        role: 'system',
                        content: 'Tu es un assistant spécialisé en détection linguistique et traduction médicale pour l\'Algérie. Réponds UNIQUEMENT en JSON pur, sans markdown.'
                    },
                    {
                        role: 'user',
                        content: `Le patient a écrit : "${userText}"\n\n1. Détecte la langue : "francais" / "arabe" / "darija_arabe" / "darija_latin" / "mixte"\n2. Détecte le script : "arabe" / "latin" / "mixte"\n3. Traduis fidèlement en français médical.\n\nJSON exact :\n{\n  "langue_detectee": "...",\n  "script_utilise": "...",\n  "texte_traduit": "..."\n}`
                    }
                ],
                temperature: 0.1,
                max_tokens: 250
            })
        });

        if (response.ok) {
            const data = await response.json();
            const text = data.choices[0].message.content;
            const match = text.match(/\{[\s\S]*\}/);
            if (match) return JSON.parse(match[0]);
        }
    } catch (e) {
        console.error('Erreur Étape 1:', e.message);
    }
    return { langue_detectee: 'francais', script_utilise: 'latin', texte_traduit: userText };
}

// ==========================================
// ÉTAPE 2 — Analyse Médicale & Diagnostic
// ==========================================
async function analyserMedicalement(symptomesFrancais, deepseekModel) {
    try {
        const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: deepseekModel,
                messages: [
                    {
                        role: 'system',
                        content: `Tu es un système d'intelligence médicale clinique de niveau expert (équivalent interniste/médecin spécialiste). \nTu analyses les symptômes et établis des hypothèses diagnostiques précises basées sur des sources médicales reconnues (UpToDate, Harrison's, BMJ, WHO, PubMed).\n\nRÔLE : Fournir une évaluation diagnostique différentielle rigoureuse. PAS un conseiller de santé généraliste.\n\nRÈGLES ABSOLUES :\n1. Tu NE donnes PAS de conseils vagues ("boire de l'eau", "se reposer", "consulter un médecin").\n2. Tu fournis des DIAGNOSTICS DIFFÉRENTIELS concrets avec probabilités et raisonnement clinique.\n3. Tu utilises la terminologie médicale correcte.\n4. Tu cites les critères cliniques utilisés pour chaque hypothèse.\n5. Tu indiques les examens complémentaires nécessaires pour confirmer chaque hypothèse.\n6. Réponse UNIQUEMENT en JSON valide.\n\nNIVEAUX D'URGENCE :\n- rouge   : urgence vitale immédiate (ex: SCA, AVC, sepsis, embolie pulmonaire)\n- orange  : urgence dans les 6h (ex: appendicite probable, pneumonie sévère)\n- jaune   : consultation dans 24-48h (pathologie aiguë non vitale)\n- vert    : ambulatoire (pathologie chronique stable, bénigne)\n\nSOURCES À RÉFÉRENCER : Harrison's Principles, UpToDate, DSM-5, WHO ICD-11, Oxford Handbook, ESC/AHA Guidelines`
                    },
                    {
                        role: 'user',
                        content: `Symptômes du patient : "${symptomesFrancais}"\n\nEffectue une analyse clinique complète selon ces cas :\n\n═══ CAS 1 : HORS SUJET ═══\nSi le texte n'est pas une description de symptômes :\n{\n  "type": "hors_sujet",\n  "niveau": null,\n  "message_systeme": "Ce système analyse exclusivement les symptômes cliniques. Décrivez vos symptômes (localisation, durée, intensité, symptômes associés).",\n  "urgence_chiffre": 0,\n  "specialite": null,\n  "symptomes_detectes": [],\n  "diagnostic_differentiel": [],\n  "examens_complementaires": [],\n  "sources": []\n}\n\n═══ CAS 2 : INFORMATIONS INSUFFISANTES ═══\nSi les symptômes sont trop vagues pour un diagnostic différentiel fiable :\n{\n  "type": "incomplet",\n  "niveau": null,\n  "message_systeme": "Données cliniques insuffisantes pour établir un diagnostic différentiel fiable.",\n  "informations_manquantes": ["localisation précise", "durée", "intensité (EVA/10)", "facteurs aggravants/soulageants", "antécédents médicaux", "traitements en cours", "signes associés"],\n  "urgence_chiffre": 0,\n  "specialite": null,\n  "symptomes_detectes": ["symptômes partiels identifiés"],\n  "diagnostic_differentiel": [],\n  "examens_complementaires": [],\n  "sources": []\n}\n\n═══ CAS 3 : ANALYSE CLINIQUE COMPLÈTE ═══\n{\n  "type": "analyse",\n  "niveau": "rouge | orange | jaune | vert",\n  "titre_clinique": "Syndrome/présentation clinique en 4-6 mots",\n  "resume_clinique": "Description objective de la présentation : caractère, localisation, durée, signes associés. 3-5 phrases médicales.",\n  "symptomes_detectes": ["symptôme 1", "symptôme 2"],\n  "diagnostic_differentiel": [\n    {\n      "diagnostic": "Nom exact de la pathologie (terminologie médicale)",\n      "icd11_code": "Code ICD-11 si applicable",\n      "probabilite": "élevée | modérée | faible",\n      "probabilite_pourcent": 75,\n      "raisonnement_clinique": "Pourquoi ce diagnostic ? Quels critères cliniques sont présents/absents ? Quels signes/symptômes l'appuient ?",\n      "criteres_pour": ["critère présent 1", "critère présent 2"],\n      "criteres_contre": ["élément qui va contre ce diagnostic"],\n      "source_reference": "Harrison's 21e éd. Ch. XX / UpToDate: Titre de l'article / ESC Guidelines 2023"\n    }\n  ],\n  "signes_alarme": ["signe d'alarme 1 si présent"],\n  "examens_complementaires": [\n    {\n      "examen": "Nom de l'examen",\n      "but": "Pour confirmer/exclure quel diagnostic",\n      "priorite": "urgent | semi-urgent | électif"\n    }\n  ],\n  "classification_clinique": {\n    "systeme_touche": "Cardiovasculaire | Respiratoire | Digestif | Neurologique | etc.",\n    "mecanisme_probable": "Infectieux | Inflammatoire | Mécanique | Vasculaire | Métabolique | etc."\n  },\n  "specialite": "Spécialité médicale la plus appropriée",\n  "urgence_chiffre": 7,\n  "sources": [\n    "Harrison's Principles of Internal Medicine, 21st Ed.",\n    "UpToDate: [titre article pertinent]",\n    "WHO ICD-11"\n  ]\n}`
                    }
                ],
                temperature: 0.1,
                max_tokens: 800
            })
        });

        if (response.ok) {
            const data = await response.json();
            let text = data.choices[0].message.content;

            // إزالة تفكير DeepSeek R1 <think>...</think>
            text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

            const match = text.match(/\{[\s\S]*\}/);
            if (match) return JSON.parse(match[0]);
        }
    } catch (e) {
        console.error('Erreur Étape 2:', e.message);
    }
    return { type: 'vert', titre_clinique: 'Analyse indisponible', resume_clinique: '', urgence_chiffre: 3 };
}

// ==========================================
// ÉTAPE 3 — Réponse patient
// ==========================================
async function genererReponseLocale(langueDetectee, scriptUtilise, texteOriginal, analyseIa, llamaModel) {
    let instructionLangue = '';
    if (langueDetectee === 'darija_arabe') {
        instructionLangue = `Réponds OBLIGATOIREMENT en darija algérienne en lettres ARABES. Exemple: "راك تعاني من..."`;
    } else if (langueDetectee === 'darija_latin') {
        instructionLangue = `Réponds OBLIGATOIREMENT en darija algérienne en lettres LATINES (arabizi). Exemple: "rak t3ani men..."`;
    } else if (langueDetectee === 'arabe') {
        instructionLangue = `Réponds en arabe littéraire (فصحى) professionnel et précis.`;
    } else if (langueDetectee === 'mixte') {
        instructionLangue = `Réponds en mélange français/darija adapté au style du patient.`;
    } else {
        instructionLangue = `Réponds en français professionnel et précis.`;
    }

    let contexte = '';
    let instructionFinale = '';

    if (analyseIa.type === 'hors_sujet') {
        contexte = `Le patient a envoyé un message hors sujet médical.\nMessage système : ${analyseIa.message_systeme}`;
        instructionFinale = `Explique au patient de façon naturelle et amicale que ce système est dédié uniquement à l'analyse des symptômes médicaux, et invite-le à décrire ses symptômes s'il en a. \nINTERDIT : Ne pas copier le message système tel quel. Reformule de façon naturelle dans la langue du patient.`;
    } else if (analyseIa.type === 'incomplet') {
        contexte = `Informations manquantes : ${(analyseIa.informations_manquantes || []).join(', ')}\nSymptômes partiels : ${(analyseIa.symptomes_detectes || []).join(', ')}`;
        instructionFinale = `Explique au patient quelles informations supplémentaires sont nécessaires et pourquoi elles sont importantes pour le diagnostic.`;
    } else if (analyseIa.type === 'analyse') {
        const ddx = (analyseIa.diagnostic_differentiel || [])
            .map(d => `${d.diagnostic} (${d.probabilite} — ${d.probabilite_pourcent || '?'}%) : ${d.raisonnement_clinique}`)
            .join('\n');
        contexte = `\nTitre : ${analyseIa.titre_clinique}\nRésumé : ${analyseIa.resume_clinique}\nNiveau : ${analyseIa.niveau}\nDiagnostics différentiels :\n${ddx}\nSpécialité : ${analyseIa.specialite}\nUrgence : ${analyseIa.urgence_chiffre}/10`;
        instructionFinale = `Explique au patient : 1) Ce que ses symptômes évoquent cliniquement. 2) Les hypothèses diagnostiques les plus probables. 3) Le niveau d'urgence. 4) La spécialité concernée. Sois précis et clinique, pas vague.`;
    }

    try {
        const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: llamaModel,
                messages: [
                    {
                        role: 'system',
                        content: `Tu es le module de communication patient du système MEDI. ${instructionLangue}\n\nRÔLE : Expliquer au patient les hypothèses diagnostiques de façon compréhensible mais précise.\nRÈGLES :\n- NE PAS dire "consultez un médecin" ou "buvez de l'eau" ou donner des conseils généraux.\n- EXPOSER les hypothèses diagnostiques probables en termes compréhensibles.\n- EXPLIQUER le raisonnement clinique simplement.\n- PRÉCISER le niveau d'urgence clinique.\n- INDIQUER quelle spécialité est concernée.\n- Maximum 8 phrases. Texte direct, pas de JSON.`
                    },
                    {
                        role: 'user',
                        content: `Le patient a écrit : "${texteOriginal}"\n\nContexte :\n${contexte}\n\nConsigne : ${instructionFinale}`
                    }
                ],
                temperature: 0.3,
                max_tokens: 800
            })
        });

        if (response.ok) {
            const data = await response.json();
            return data.choices[0].message.content;
        }
    } catch (e) {
        console.error('Erreur Étape 3:', e.message);
    }
    return analyseIa.resume_clinique || analyseIa.message_systeme || '';
}

// ==========================================
// API ROUTE: POST /api/analyze
// ==========================================
app.post('/api/analyze', async (req, res) => {
const { 
    userText, 
    llamaModel = "google/gemini-2.5-flash-lite", // ضع هنا المودل الافتراضي الذي تريده
    deepseekModel = "openrouter/owl-alpha"       // ضع هنا المودل الافتراضي الذي تريده
} = req.body || {};

if (!userText) {
    return res.status(400).json({ error: "Missing required field: userText" });
}

    
    console.log('Début de l\'analyse pour:', userText);

    // Étape 1
    const detection = await detectAndTranslate(userText, llamaModel);
    const langue = detection.langue_detectee || 'francais';
    const script = detection.script_utilise || 'latin';
    const traduit = detection.texte_traduit || userText;

    // Étape 2
    const analyse = await analyserMedicalement(traduit, deepseekModel);

    // Étape 3
    let reponseLocale = '';
    
    /*if (analyse.type === 'hors_sujet' && false) { // المحافظة على منطق الكود الأصلي
        reponseLocale = analyse.message_systeme || 'Ce système analyse uniquement les symptômes médicaux.';
    } else {*/
        reponseLocale = await genererReponseLocale(langue, script, userText, analyse, llamaModel);
   // }

    // إرسال النتيجة النهائية المطلوبة للواجهة الأمامية
    res.json({
        analyse: analyse,
        detection:detection,
        reponseLocale: reponseLocale
    });
});







app.listen(process.env.PORT || 8080, err => {
    if (err) return process.exit(1)
    console.log("Running...")
})

export default app;
