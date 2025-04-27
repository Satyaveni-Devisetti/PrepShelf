// Login form validation and handling
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    
    // Basic validation
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    try {
        let user = null;
        
        // First try to get the specific user data
        const storedUser = localStorage.getItem(email);
        if (storedUser) {
            user = JSON.parse(storedUser);
        }
        
        // If not found, check the users array as backup
        if (!user) {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        }
        
        // If still no user found
        if (!user) {
            showNotification('User not found. Please register first.', 'error');
            return;
        }

        // Check password
        if (user.password !== password) {
            showNotification('Incorrect password', 'error');
            return;
        }

        // Store current user info
        const userInfo = {
            id: user.id,
            name: user.name,
            email: user.email,
            branch: user.branch,
            skills: user.skills,
            gender: user.gender,
            dob: user.dob,
            year: user.year,
            about: user.about,
            loginTime: new Date().toISOString()
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userInfo));
        
        // Handle "Remember me"
        if (document.getElementById('rememberMe').checked) {
            localStorage.setItem('rememberedUser', email);
        } else {
            localStorage.removeItem('rememberedUser');
        }

        // Show success message
        showNotification('Login successful! Welcome ' + user.name, 'success');
        
        // Redirect to home page after delay
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 1500);

    } catch (error) {
        console.error('Login error:', error);
        showNotification('An error occurred during login. Please try again.', 'error');
    }
});

// Show notification function
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        ${message}
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Password visibility toggle
document.getElementById('togglePassword').addEventListener('click', function() {
    const passwordInput = document.getElementById('password');
    const icon = this.querySelector('i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
});

// Check for remembered user
document.addEventListener('DOMContentLoaded', function() {
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
        document.getElementById('email').value = rememberedUser;
        document.getElementById('rememberMe').checked = true;
    }
}); 