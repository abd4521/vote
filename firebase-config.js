// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyByQD-i0c9SDUjt8Zs41cWWiGbaSZyoSZw",
    authDomain: "voting-8b3bf.firebaseapp.com",
    projectId: "voting-8b3bf",
    storageBucket: "voting-8b3bf.firebasestorage.app",
    messagingSenderId: "198624350168",
    appId: "1:198624350168:web:77bdb47a9c2b42a74fecad",
    measurementId: "G-BB7C17SD41"
};

console.log('Firebase config loaded:', firebaseConfig);

// Check if Firebase SDK is loaded
if (typeof firebase === 'undefined') {
    console.error('Firebase SDK not loaded!');
    document.addEventListener('DOMContentLoaded', function() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div style="text-align: center; color: white;">
                    <h3>Firebase SDK Not Loaded</h3>
                    <p>Please check your internet connection and refresh the page.</p>
                    <p>Make sure Firebase SDK scripts are loading properly.</p>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: white; color: #667eea; border: none; border-radius: 5px; cursor: pointer;">
                        Reload Page
                    </button>
                </div>
            `;
        }
    });
} else {
    console.log('Firebase SDK detected:', firebase);
}

// Initialize Firebase with error handling
let auth, db;

try {
    console.log('Initializing Firebase...');
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    
    // Initialize Firebase services
    auth = firebase.auth();
    db = firebase.firestore();
    
    console.log('Firebase initialized successfully');
    console.log('Auth service:', auth);
    console.log('Firestore service:', db);
} catch (error) {
    console.error('Error initializing Firebase:', error);
    // Show error message to user
    document.addEventListener('DOMContentLoaded', function() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div style="text-align: center; color: white;">
                    <h3>Firebase Configuration Error</h3>
                    <p>Please check your Firebase configuration in firebase-config.js</p>
                    <p>Error: ${error.message}</p>
                </div>
            `;
        }
    });
}

// Admin emails (you can modify this list)
const ADMIN_EMAILS = [
    'iamabd873@gmail.com',
    'admin2@votingsystem.com'
];

console.log('Admin emails configured:', ADMIN_EMAILS);

// Encryption key (in production, this should be stored securely)
const ENCRYPTION_KEY = 'your-secret-encryption-key-2024';

// Check if user is admin
function isAdmin(email) {
    console.log('Checking if email is admin:', email);
    console.log('Admin emails list:', ADMIN_EMAILS);
    const result = ADMIN_EMAILS.includes(email);
    console.log('Is admin result:', result);
    return result;
}

// Encrypt vote data
function encryptVote(voteData) {
    try {
        const voteString = JSON.stringify(voteData);
        return CryptoJS.AES.encrypt(voteString, ENCRYPTION_KEY).toString();
    } catch (error) {
        console.error('Error encrypting vote:', error);
        return null;
    }
}

// Decrypt vote data
function decryptVote(encryptedVote) {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedVote, ENCRYPTION_KEY);
        return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (error) {
        console.error('Error decrypting vote:', error);
        return null;
    }
} 