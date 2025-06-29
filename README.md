# Online Voting System

A secure, real-time online voting system built with HTML, CSS, JavaScript, and Firebase. Features include user authentication, encrypted voting, live results, and admin dashboard.

## 🚀 Features

### 🔐 Secure Authentication
- Email/password registration and login
- Two user types: Admin and Voter
- Admin access control via email whitelist
- Automatic role-based dashboard routing

### 🗳️ Voting Interface
- Real-time poll display for voters
- One vote per poll per user (tracked by user ID)
- Encrypted vote storage using CryptoJS
- Live vote count updates
- Poll status indicators (active/closed)

### 📊 Live Results
- Real-time vote counting with Firebase listeners
- Interactive bar charts using Chart.js
- Percentage calculations for each option
- Live updates without page refresh

### 🛠️ Admin Dashboard
- Secure admin-only access
- Create new polls with multiple options
- Toggle poll status (open/close)
- Delete polls with confirmation
- View comprehensive statistics
- Real-time poll management

### 🔒 Security Features
- Vote encryption before storage
- User authentication with Firebase Auth
- Admin email verification
- Secure vote tracking

## 🛠️ Setup Instructions

### 1. Firebase Configuration

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Get your Firebase config and update `firebase-config.js`:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
```

### 2. Admin Configuration

Update the admin emails in `firebase-config.js`:

```javascript
const ADMIN_EMAILS = [
    'your-admin-email@domain.com',
    'another-admin@domain.com'
];
```

### 3. Encryption Key

Update the encryption key in `firebase-config.js`:

```javascript
const ENCRYPTION_KEY = 'your-secure-encryption-key-2024';
```

### 4. Firestore Security Rules

Set up Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Anyone can read polls, only admins can write
    match /polls/{pollId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.token.email in ['admin@votingsystem.com', 'admin2@votingsystem.com'];
    }
  }
}
```

## 📁 Project Structure

```
online-voting-system/
├── index.html          # Main HTML file
├── styles.css          # CSS styles and responsive design
├── app.js             # Main JavaScript application
├── firebase-config.js # Firebase configuration and utilities
└── README.md          # This file
```

## 🎯 Usage Guide

### For Voters

1. **Registration/Login**: Sign up with email and password or login if already registered
2. **View Polls**: See all active polls on the voting dashboard
3. **Cast Vote**: Click on an option to vote (one vote per poll)
4. **View Results**: Click "View Results" to see live vote counts and charts

### For Admins

1. **Login**: Use admin email to access admin dashboard
2. **Create Poll**: Click "Create New Poll" to add a new voting poll
3. **Manage Polls**: 
   - Toggle poll status (open/close)
   - Delete polls
   - View detailed results
4. **Monitor Stats**: View total polls, voters, and votes

## 🔧 Customization

### Styling
- Modify `styles.css` to change colors, fonts, and layout
- Update CSS variables for consistent theming
- Add custom animations and transitions

### Functionality
- Extend admin features in `app.js`
- Add new vote types or poll formats
- Implement additional security measures

### Firebase Integration
- Add more Firebase services (Storage, Functions)
- Implement real-time notifications
- Add analytics and monitoring

## 🚀 Deployment

### Firebase Hosting

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Initialize Firebase project:
```bash
firebase login
firebase init hosting
```

3. Deploy to Firebase:
```bash
firebase deploy
```

### Alternative Hosting

- Upload files to any web hosting service
- Ensure HTTPS is enabled for security
- Update Firebase config for production domain

## 🔒 Security Considerations

1. **Encryption**: Votes are encrypted before storage
2. **Authentication**: Firebase Auth handles user verification
3. **Authorization**: Admin access controlled by email whitelist
4. **Data Privacy**: Only vote counts are stored, not individual voter data
5. **Rate Limiting**: Consider implementing rate limiting for production

## 🐛 Troubleshooting

### Common Issues

1. **Firebase Connection**: Check API keys and project configuration
2. **Authentication**: Ensure email/password auth is enabled
3. **Firestore Rules**: Verify security rules allow read/write access
4. **Chart.js**: Ensure Chart.js CDN is loading correctly

### Debug Mode

Enable console logging by adding:
```javascript
console.log('Debug mode enabled');
```

## 📞 Support

For issues or questions:
1. Check Firebase console for errors
2. Review browser console for JavaScript errors
3. Verify all dependencies are loading correctly
4. Test with different browsers and devices

## 📄 License

This project is open source and available under the MIT License.

---

**Note**: This is a demo system. For production use, implement additional security measures, rate limiting, and proper error handling. 