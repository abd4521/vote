// Global variables
let currentUser = null;
let currentUserData = null;
let pollsListener = null;
let resultsChart = null;

console.log('App.js loaded - checking DOM elements...');

// DOM elements
const loadingScreen = document.getElementById('loadingScreen');
const authContainer = document.getElementById('authContainer');
const voterDashboard = document.getElementById('voterDashboard');
const adminDashboard = document.getElementById('adminDashboard');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const authMessage = document.getElementById('authMessage');
const pollsContainer = document.getElementById('pollsContainer');
const adminPollsContainer = document.getElementById('adminPollsContainer');
const createPollModal = document.getElementById('createPollModal');
const createPollForm = document.getElementById('createPollForm');
const resultsModal = document.getElementById('resultsModal');

console.log('DOM elements loaded:', {
    loadingScreen: !!loadingScreen,
    authContainer: !!authContainer,
    voterDashboard: !!voterDashboard,
    adminDashboard: !!adminDashboard
});

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - initializing app...');
    initializeApp();
});

// Initialize the application
function initializeApp() {
    console.log('Initializing app...');
    console.log('Auth object:', auth);
    console.log('DB object:', db);
    
    // Check if Firebase is properly initialized
    if (!auth || !db) {
        console.error('Firebase not initialized properly');
        showFirebaseError();
        
        // Fallback: hide loading screen after 3 seconds even if Firebase fails
        setTimeout(() => {
            console.log('Fallback: hiding loading screen and showing auth screen');
            showAuthScreen();
        }, 3000);
        return;
    }

    console.log('Firebase initialized successfully, setting up auth listener...');

    // Check authentication state
    auth.onAuthStateChanged(function(user) {
        console.log('Auth state changed:', user);
        if (user) {
            currentUser = user;
            loadUserData(user.uid);
        } else {
            showAuthScreen();
        }
    });

    // Setup form event listeners
    setupEventListeners();
    console.log('App initialization complete');
}

// Setup event listeners
function setupEventListeners() {
    // Login form
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        loginUser(email, password);
    });

    // Signup form
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        signupUser(name, email, password);
    });

    // Create poll form
    createPollForm.addEventListener('submit', function(e) {
        e.preventDefault();
        createNewPoll();
    });
}

// Authentication functions
async function loginUser(email, password) {
    try {
        console.log('Attempting login for:', email);
        showMessage('Logging in...', 'info');
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('Login successful:', userCredential.user);
        showMessage('Login successful!', 'success');
        
        // Immediately load user data after successful login
        currentUser = userCredential.user;
        console.log('Setting currentUser and loading user data immediately');
        await loadUserData(userCredential.user.uid);
        
    } catch (error) {
        console.error('Login error:', error);
        showMessage(getErrorMessage(error.code), 'error');
    }
}

async function signupUser(name, email, password) {
    try {
        console.log('Attempting signup for:', email);
        showMessage('Creating account...', 'info');
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        console.log('Signup successful:', userCredential.user);
        
        // Save user data to Firestore
        await db.collection('users').doc(userCredential.user.uid).set({
            name: name,
            email: email,
            isAdmin: isAdmin(email),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showMessage('Account created successfully!', 'success');
        
        // Immediately load user data after successful signup
        currentUser = userCredential.user;
        console.log('Setting currentUser and loading user data immediately');
        await loadUserData(userCredential.user.uid);
        
    } catch (error) {
        console.error('Signup error:', error);
        showMessage(getErrorMessage(error.code), 'error');
    }
}

async function loadUserData(userId) {
    try {
        console.log('Loading user data for ID:', userId);
        console.log('Current user object:', currentUser);
        
        const userDoc = await db.collection('users').doc(userId).get();
        console.log('User document exists:', userDoc.exists);
        console.log('User document data:', userDoc.data());
        
        if (userDoc.exists) {
            currentUserData = userDoc.data();
            console.log('User data loaded:', currentUserData);
            console.log('User isAdmin:', currentUserData.isAdmin);
            
            // Check if admin status needs to be updated
            const shouldBeAdmin = isAdmin(currentUser.email);
            console.log('Should be admin:', shouldBeAdmin);
            
            if (currentUserData.isAdmin !== shouldBeAdmin) {
                console.log('Updating admin status from', currentUserData.isAdmin, 'to', shouldBeAdmin);
                await db.collection('users').doc(userId).update({
                    isAdmin: shouldBeAdmin
                });
                currentUserData.isAdmin = shouldBeAdmin;
            }
            
            if (currentUserData.isAdmin) {
                console.log('User is admin, showing admin dashboard');
                showAdminDashboard();
            } else {
                console.log('User is voter, showing voter dashboard');
                showVoterDashboard();
            }
        } else {
            console.log('User document does not exist, creating new user document');
            console.log('Current user email:', currentUser.email);
            console.log('Is admin check for email:', isAdmin(currentUser.email));
            
            // User document doesn't exist, create it
            const newUserData = {
                name: currentUser.displayName || 'User',
                email: currentUser.email,
                isAdmin: isAdmin(currentUser.email),
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            console.log('Creating new user data:', newUserData);
            await db.collection('users').doc(userId).set(newUserData);
            currentUserData = newUserData;
            console.log('New user data created:', currentUserData);
            
            if (currentUserData.isAdmin) {
                console.log('New user is admin, showing admin dashboard');
                showAdminDashboard();
            } else {
                console.log('New user is voter, showing voter dashboard');
                showVoterDashboard();
            }
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        console.error('Error details:', error.message, error.code);
        showMessage('Error loading user data: ' + error.message, 'error');
    }
}

function logout() {
    auth.signOut().then(() => {
        currentUser = null;
        currentUserData = null;
        if (pollsListener) {
            pollsListener();
        }
        showAuthScreen();
    }).catch((error) => {
        console.error('Error signing out:', error);
    });
}

// UI Functions
function showAuthScreen() {
    console.log('Showing auth screen');
    hideAllScreens();
    authContainer.style.display = 'flex';
    loadingScreen.style.display = 'none';
}

function showVoterDashboard() {
    console.log('Showing voter dashboard');
    hideAllScreens();
    voterDashboard.style.display = 'block';
    const userNameElement = document.getElementById('userName');
    if (userNameElement && currentUserData) {
        userNameElement.textContent = currentUserData.name;
    }
    loadPollsForVoter();
}

function showAdminDashboard() {
    console.log('Showing admin dashboard');
    hideAllScreens();
    adminDashboard.style.display = 'block';
    const adminNameElement = document.getElementById('adminName');
    if (adminNameElement && currentUserData) {
        adminNameElement.textContent = currentUserData.name;
    }
    loadAdminStats();
    loadPollsForAdmin();
}

function hideAllScreens() {
    console.log('Hiding all screens');
    authContainer.style.display = 'none';
    voterDashboard.style.display = 'none';
    adminDashboard.style.display = 'none';
}

function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const tabs = document.querySelectorAll('.tab-btn');
    
    tabs.forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    if (tab === 'login') {
        loginForm.style.display = 'flex';
        signupForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        signupForm.style.display = 'flex';
    }
}

// Global notification system
function showGlobalMessage(message, type) {
    // Remove existing notification
    const existingNotification = document.querySelector('.global-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `global-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Update the existing showMessage function to use global notification
function showMessage(message, type) {
    showGlobalMessage(message, type);
}

// Poll Management Functions
async function loadPollsForVoter() {
    try {
        // Listen for real-time updates
        pollsListener = db.collection('polls')
            .where('status', '==', 'active')
            .onSnapshot((snapshot) => {
                pollsContainer.innerHTML = '';
                snapshot.forEach((doc) => {
                    const poll = { id: doc.id, ...doc.data() };
                    displayPollForVoter(poll);
                });
            });
    } catch (error) {
        console.error('Error loading polls:', error);
        showMessage('Error loading polls', 'error');
    }
}

async function loadPollsForAdmin() {
    try {
        // Listen for real-time updates
        pollsListener = db.collection('polls')
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                adminPollsContainer.innerHTML = '';
                snapshot.forEach((doc) => {
                    const poll = { id: doc.id, ...doc.data() };
                    displayPollForAdmin(poll);
                });
            });
    } catch (error) {
        console.error('Error loading polls:', error);
        showMessage('Error loading polls', 'error');
    }
}

function displayPollForVoter(poll) {
    const pollCard = document.createElement('div');
    pollCard.className = 'poll-card';
    // Check if user has already voted
    const hasVoted = poll.votes && poll.votes[currentUser.uid] !== undefined;
    
    pollCard.innerHTML = `
        <div class="poll-header">
            <h3 class="poll-title">${poll.title}</h3>
            <p class="poll-description">${poll.description}</p>
            <span class="poll-status ${poll.status}">${poll.status}</span>
        </div>
        <div class="poll-body">
            <div class="poll-options">
                ${poll.options.map((option, index) => `
                    <div class="option-item ${hasVoted && poll.votes[currentUser.uid] === index ? 'selected permanent' : ''}" 
                         onclick="${!hasVoted && poll.status === 'active' ? `vote('${poll.id}', ${index})` : ''}">
                        <input type="radio" name="poll_${poll.id}" value="${index}" 
                               ${hasVoted && poll.votes[currentUser.uid] === index ? 'checked' : ''} disabled>
                        <span class="option-text">${option}</span>
                        ${hasVoted && poll.votes[currentUser.uid] === index ? '<i class="fas fa-check-circle selected-icon"></i>' : ''}
                    </div>
                `).join('')}
            </div>
            <div class="poll-actions">
                ${hasVoted ? 
                    `<button onclick="viewResults('${poll.id}')" class="btn-primary">
                        <i class="fas fa-chart-bar"></i> View Results
                    </button>` :
                    `<button onclick="viewResults('${poll.id}')" class="btn-secondary">
                        <i class="fas fa-chart-bar"></i> View Results
                    </button>`
                }
            </div>
        </div>
        <div class="poll-stats">
            <span>Total Votes: ${poll.totalVotes || 0}</span>
            <span>Created: ${poll.createdAt && poll.createdAt.toDate ? new Date(poll.createdAt.toDate()).toLocaleDateString() : ''}</span>
        </div>
    `;
    pollsContainer.appendChild(pollCard);
}

function displayPollForAdmin(poll) {
    const pollCard = document.createElement('div');
    pollCard.className = 'poll-card';
    pollCard.innerHTML = `
        <div class="poll-header">
            <h3 class="poll-title">${poll.title}</h3>
            <p class="poll-description">${poll.description}</p>
            <span class="poll-status ${poll.status}">${poll.status}</span>
        </div>
        <div class="poll-body">
            <div class="poll-options">
                ${poll.options.map((option, index) => `
                    <div class="option-item">
                        <span class="option-text">${option}</span>
                        <span class="result-votes">${poll.voteCounts?.[index] || 0} votes</span>
                    </div>
                `).join('')}
            </div>
            <div class="poll-actions">
                <button onclick="viewResults('${poll.id}')" class="btn-secondary">
                    <i class="fas fa-chart-bar"></i> View Results
                </button>
                <button onclick="togglePollStatus('${poll.id}', '${poll.status}')" class="btn-primary">
                    <i class="fas fa-${poll.status === 'active' ? 'pause' : 'play'}"></i>
                    ${poll.status === 'active' ? 'Close Poll' : 'Open Poll'}
                </button>
                <button onclick="deletePoll('${poll.id}')" class="btn-secondary" style="background: #dc3545; color: white;">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
        <div class="poll-stats">
            <span>Total Votes: ${poll.totalVotes || 0}</span>
            <span>Created: ${poll.createdAt && poll.createdAt.toDate ? new Date(poll.createdAt.toDate()).toLocaleDateString() : ''}</span>
        </div>
    `;
    adminPollsContainer.appendChild(pollCard);
}

// Voting function
async function vote(pollId, optionIndex) {
    try {
        // Check if user has already voted
        const pollRef = db.collection('polls').doc(pollId);
        const pollDoc = await pollRef.get();
        if (!pollDoc.exists) {
            showMessage('Poll not found', 'error');
            return;
        }
        const poll = pollDoc.data();
        if (poll.votes && poll.votes[currentUser.uid] !== undefined) {
            showMessage('You have already voted in this poll', 'error');
            return;
        }
        if (poll.status !== 'active') {
            showMessage('This poll is not active', 'error');
            return;
        }
        
        // Encrypt the vote
        const voteData = {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            optionIndex: optionIndex,
            timestamp: new Date().toISOString()
        };
        const encryptedVote = encryptVote(voteData);
        
        // Update poll with vote
        await pollRef.update({
            [`votes.${currentUser.uid}`]: optionIndex, // Store only index for privacy
            [`voteCounts.${optionIndex}`]: firebase.firestore.FieldValue.increment(1),
            totalVotes: firebase.firestore.FieldValue.increment(1),
            [`encryptedVotes.${currentUser.uid}`]: encryptedVote
        });
        
        showMessage('Vote recorded successfully!', 'success');
        
        // Immediately update the poll display to show the permanent selection
        setTimeout(() => {
            loadPollsForVoter();
        }, 500);
        
    } catch (error) {
        console.error('Error voting:', error);
        showMessage('Error recording vote', 'error');
    }
}

// Admin Functions
async function createNewPoll() {
    try {
        const title = document.getElementById('pollTitle').value;
        const description = document.getElementById('pollDescription').value;
        const optionInputs = document.querySelectorAll('#optionsContainer .option-text');
        const options = Array.from(optionInputs).map(input => input.value.trim()).filter(option => option);
        
        if (options.length < 2) {
            showMessage('Please add at least 2 options', 'error');
            return;
        }
        
        const pollData = {
            title: title,
            description: description,
            options: options,
            status: 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: currentUser.uid,
            totalVotes: 0,
            votes: {},
            voteCounts: {},
            encryptedVotes: {}
        };
        
        await db.collection('polls').add(pollData);
        closeCreatePollModal();
        showMessage('Poll created successfully!', 'success');
    } catch (error) {
        console.error('Error creating poll:', error);
        showMessage('Error creating poll', 'error');
    }
}

async function togglePollStatus(pollId, currentStatus) {
    try {
        const newStatus = currentStatus === 'active' ? 'closed' : 'active';
        await db.collection('polls').doc(pollId).update({
            status: newStatus
        });
        showMessage(`Poll ${newStatus} successfully`, 'success');
    } catch (error) {
        console.error('Error toggling poll status:', error);
        showMessage('Error updating poll status', 'error');
    }
}

async function deletePoll(pollId) {
    if (confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
        try {
            await db.collection('polls').doc(pollId).delete();
            showMessage('Poll deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting poll:', error);
            showMessage('Error deleting poll', 'error');
        }
    }
}

async function loadAdminStats() {
    try {
        const pollsSnapshot = await db.collection('polls').get();
        const usersSnapshot = await db.collection('users').get();
        
        let totalVotes = 0;
        pollsSnapshot.forEach(doc => {
            const poll = doc.data();
            totalVotes += poll.totalVotes || 0;
        });
        
        document.getElementById('totalPolls').textContent = pollsSnapshot.size;
        document.getElementById('totalVoters').textContent = usersSnapshot.size;
        document.getElementById('totalVotes').textContent = totalVotes;
    } catch (error) {
        console.error('Error loading admin stats:', error);
    }
}

// Results Functions
async function viewResults(pollId) {
    try {
        const pollDoc = await db.collection('polls').doc(pollId).get();
        if (!pollDoc.exists) {
            showMessage('Poll not found', 'error');
            return;
        }
        
        const poll = pollDoc.data();
        document.getElementById('resultsTitle').textContent = poll.title;
        
        // Calculate percentages and find winner
        const totalVotes = poll.totalVotes || 0;
        const voteData = poll.options.map((option, index) => {
            const votes = poll.voteCounts?.[index] || 0;
            const percentage = totalVotes > 0 ? (votes / totalVotes * 100).toFixed(1) : 0;
            return { option, votes, percentage, index };
        });
        
        // Find winner(s)
        const maxVotes = Math.max(...voteData.map(v => v.votes));
        const winners = voteData.filter(v => v.votes === maxVotes && v.votes > 0);
        
        // Display results list with enhanced design
        const resultsList = document.getElementById('resultsList');
        resultsList.innerHTML = `
            <div class="results-header">
                <div class="total-votes">
                    <i class="fas fa-users"></i>
                    <span>Total Votes: ${totalVotes}</span>
                </div>
                ${winners.length > 0 ? `
                    <div class="winner-indicator">
                        <i class="fas fa-trophy"></i>
                        <span>${winners.length === 1 ? 'Winner' : 'Winners'}: ${winners.map(w => w.option).join(', ')}</span>
                    </div>
                ` : ''}
            </div>
            <div class="results-options">
                ${voteData.map((vote, index) => `
                    <div class="result-option ${winners.some(w => w.index === vote.index) ? 'winner' : ''}">
                        <div class="option-header">
                            <span class="option-name">${vote.option}</span>
                            <span class="vote-count">${vote.votes} votes</span>
                        </div>
                        <div class="progress-container">
                            <div class="progress-bar" style="width: ${vote.percentage}%"></div>
                            <span class="percentage">${vote.percentage}%</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Create chart with better styling
        const ctx = document.getElementById('resultsChart').getContext('2d');
        if (resultsChart) {
            resultsChart.destroy();
        }
        
        resultsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: poll.options,
                datasets: [{
                    label: 'Votes',
                    data: poll.options.map((option, index) => poll.voteCounts?.[index] || 0),
                    backgroundColor: poll.options.map((option, index) => {
                        const votes = poll.voteCounts?.[index] || 0;
                        return votes === maxVotes && votes > 0 ? '#28a745' : '#667eea';
                    }),
                    borderColor: poll.options.map((option, index) => {
                        const votes = poll.voteCounts?.[index] || 0;
                        return votes === maxVotes && votes > 0 ? '#28a745' : '#667eea';
                    }),
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#667eea',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                const votes = context.parsed.y;
                                const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : 0;
                                return `${votes} votes (${percentage}%)`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            color: '#666',
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        }
                    },
                    x: {
                        ticks: {
                            color: '#666',
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
        
        resultsModal.style.display = 'flex';
        
    } catch (error) {
        console.error('Error loading results:', error);
        showMessage('Error loading results', 'error');
    }
}

// Modal Functions
function showCreatePollModal() {
    createPollModal.style.display = 'flex';
    document.getElementById('pollTitle').value = '';
    document.getElementById('pollDescription').value = '';
    
    // Reset options
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = `
        <div class="option-input">
            <input type="text" class="option-text" placeholder="Option 1" required>
            <button type="button" onclick="removeOption(this)" class="remove-option">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="option-input">
            <input type="text" class="option-text" placeholder="Option 2" required>
            <button type="button" onclick="removeOption(this)" class="remove-option">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
}

function closeCreatePollModal() {
    createPollModal.style.display = 'none';
}

function closeResultsModal() {
    resultsModal.style.display = 'none';
    if (resultsChart) {
        resultsChart.destroy();
        resultsChart = null;
    }
}

function addOption() {
    const optionsContainer = document.getElementById('optionsContainer');
    const optionCount = optionsContainer.children.length + 1;
    
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option-input';
    optionDiv.innerHTML = `
        <input type="text" class="option-text" placeholder="Option ${optionCount}" required>
        <button type="button" onclick="removeOption(this)" class="remove-option">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    optionsContainer.appendChild(optionDiv);
}

function removeOption(button) {
    const optionsContainer = document.getElementById('optionsContainer');
    if (optionsContainer.children.length > 2) {
        button.parentElement.remove();
    } else {
        showMessage('At least 2 options are required', 'error');
    }
}

// Close modals when clicking outside
window.onclick = function(event) {
    if (event.target === createPollModal) {
        closeCreatePollModal();
    }
    if (event.target === resultsModal) {
        closeResultsModal();
    }
}

// Utility Functions
function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/email-already-in-use': 'Email already registered',
        'auth/weak-password': 'Password should be at least 6 characters',
        'auth/invalid-email': 'Invalid email address',
        'auth/too-many-requests': 'Too many failed attempts. Try again later'
    };
    return errorMessages[errorCode] || 'An error occurred. Please try again.';
}

// Show Firebase error message
function showFirebaseError() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.innerHTML = `
            <div style="text-align: center; color: white;">
                <h3>Firebase Configuration Required</h3>
                <p>Please configure Firebase in firebase-config.js</p>
                <p>1. Create a Firebase project</p>
                <p>2. Enable Authentication and Firestore</p>
                <p>3. Update the configuration with your project details</p>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: white; color: #667eea; border: none; border-radius: 5px; cursor: pointer;">
                    Reload Page
                </button>
            </div>
        `;
    }
}

// Force hide loading screen function
function forceHideLoading() {
    console.log('Force hiding loading screen...');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
    if (authContainer) {
        authContainer.style.display = 'flex';
    }
}

// Safety timeout - force hide loading screen after 5 seconds
setTimeout(() => {
    console.log('Safety timeout: forcing hide loading screen');
    forceHideLoading();
}, 5000); 