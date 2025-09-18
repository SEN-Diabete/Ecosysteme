// backend.js

// ---------------- CONFIG ----------------
const APP_CONFIG = {
    mode: 'production',   // 'dev' ou 'production'
    api_dev: "https://script.google.com/macros/s/DEV_SCRIPT_ID/exec",
    api_prod: "https://script.google.com/macros/s/AKfycbw6GyEJFHLId76bLzfnvRG-C7I8S1zoDNLjL50QkZioyrQ3936x2inXFuoiYDbsUO-3/exec",
    spreadsheet_id: "1R2NbAbpItbsfR2CXVrNiFu2aZl5Tf6ptLk1gKwtCi4g"
};

// Choisir l'URL selon le mode
const API_URL = APP_CONFIG.mode === 'dev' ? APP_CONFIG.api_dev : APP_CONFIG.api_prod;

// ---------------- CORE FUNCTION ----------------
async function callBackend(sheet, action = 'get', params = {}) {
    const url = new URL(API_URL);
    url.searchParams.append("sheet", sheet);
    url.searchParams.append("action", action);

    Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
            url.searchParams.append(key, params[key]);
        }
    });

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erreur API: " + response.status);
        return await response.json();
    } catch (err) {
        console.error("Erreur communication backend:", err);
        return {error: "Erreur de connexion au serveur"};
    }
}

// ---------------- AUTHENTIFICATION ----------------
async function loginUser(phone, password) {
    return await callBackend('Utilisateurs', 'auth', {phone, password});
}

async function logoutUser() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    return {status: "success", message: "Déconnexion réussie"};
}

// ---------------- PATIENTS ----------------
async function getPatients(limit = 100) {
    return await callBackend('SuiviMED', 'getAll', {limit});
}

async function getPatientByPhone(phone) {
    return await callBackend('SuiviMED', 'getByPhone', {phone});
}

async function addGlycemie(data) {
    return await callBackend('SuiviMED', 'add', data);
}

async function checkGlycemieAlert(glycemieValue) {
    return await callBackend('SuiviMED', 'checkAlert', {'Valeur glycémie': glycemieValue});
}

// ---------------- PHARMACIES ----------------
async function getPharmaciePatients() {
    return await callBackend('Point Conseil Diabete', 'getAll');
}

async function addPharmaciePatient(data) {
    return await callBackend('Point Conseil Diabete', 'add', data);
}

// ---------------- TABLEAU DE BORD ----------------
async function getTableauBordData() {
    return await callBackend('Dashboard SENDiabete', 'getAll');
}

async function getStatsMensuelles(mois) {
    return await callBackend('Dashboard SENDiabete', 'getStats', {mois});
}

// ---------------- ORDONNANCES ----------------
async function getOrdonnances(patientId = null) {
    if (patientId) {
        return await callBackend('Ordonnances', 'getByPatient', {patientId});
    }
    return await callBackend('Ordonnances', 'getAll');
}

async function addOrdonnance(data) {
    return await callBackend('Ordonnances', 'add', data);
}

// ---------------- WOYOFAL SANTÉ ----------------
async function getWoyofalVisites() {
    return await callBackend('Woyofal Sante', 'getAll');
}

async function addWoyofalVisite(data) {
    return await callBackend('Woyofal Sante', 'add', data);
}

async function getWoyofalPaiements() {
    return await callBackend('Woyofal Sante', 'getPaiements');
}

// ---------------- PLATEFORME DE TRIAGE ----------------
async function getAlertes() {
    return await callBackend('PlateformeTriage', 'getAll');
}

async function getAlertesUrgentes() {
    return await callBackend('PlateformeTriage', 'getUrgentes');
}

async function updateAlerteStatut(alerteId, statut) {
    return await callBackend('PlateformeTriage', 'updateStatut', {id: alerteId, statut});
}

// ---------------- STRUCTURES DE SANTÉ ----------------
async function getStructuresSante() {
    return await callBackend('Structures_Urgence', 'getAll');
}

async function getStructuresByRegion(region) {
    return await callBackend('Structures_Urgence', 'getByRegion', {region});
}

// ---------------- MESSAGES PRÉDÉFINIS ----------------
async function getMessagesPredefinis(type = null) {
    if (type) {
        return await callBackend('MessagesPredefinis', 'getByType', {type});
    }
    return await callBackend('MessagesPredefinis', 'getAll');
}

// ---------------- UTILITAIRES ----------------
function isUserLoggedIn() {
    const authToken = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    return !!(authToken && userData);
}

function getCurrentUser() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
}

function getUserRole() {
    const user = getCurrentUser();
    return user ? user.role : null;
}

// Gestion des erreurs glycémiques
function evaluateGlycemie(glycemie) {
    const value = parseFloat(glycemie);
    if (isNaN(value)) return {status: 'error', message: 'Valeur invalide'};

    if (value < 0.5) {
        return {status: 'urgence', type: 'hypoglycémie', severity: 'sévère', message: 'URGENCE: Hypoglycémie sévère'};
    } else if (value < 0.7) {
        return {status: 'alerte', type: 'hypoglycémie', severity: 'modérée', message: 'Alerte: Hypoglycémie'};
    } else if (value > 1.8) {
        return {status: 'urgence', type: 'hyperglycémie', severity: 'sévère', message: 'URGENCE: Hyperglycémie sévère'};
    } else if (value > 1.4) {
        return {status: 'alerte', type: 'hyperglycémie', severity: 'modérée', message: 'Alerte: Hyperglycémie'};
    } else {
        return {status: 'normal', message: 'Glycémie dans les normes'};
    }
}

// Formatage des dates
function formatDate(date) {
    return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatDateTime(date) {
    return new Date(date).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Export des fonctions pour utilisation globale
window.SenDiabeteAPI = {
    // Configuration
    APP_CONFIG,
    
    // Authentification
    loginUser,
    logoutUser,
    isUserLoggedIn,
    getCurrentUser,
    getUserRole,
    
    // Patients
    getPatients,
    getPatientByPhone,
    addGlycemie,
    checkGlycemieAlert,
    
    // Pharmacies
    getPharmaciePatients,
    addPharmaciePatient,
    
    // Tableau de bord
    getTableauBordData,
    getStatsMensuelles,
    
    // Ordonnances
    getOrdonnances,
    addOrdonnance,
    
    // Woyofal Santé
    getWoyofalVisites,
    addWoyofalVisite,
    getWoyofalPaiements,
    
    // Plateforme de triage
    getAlertes,
    getAlertesUrgentes,
    updateAlerteStatut,
    
    // Structures de santé
    getStructuresSante,
    getStructuresByRegion,
    
    // Messages prédéfinis
    getMessagesPredefinis,
    
    // Utilitaires
    evaluateGlycemie,
    formatDate,
    formatDateTime
};
