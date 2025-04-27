// Registration form validation and handling
document.getElementById('registrationForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const branch = document.getElementById('branch').value;
    const gender = document.getElementById('gender').value;
    const dob = document.getElementById('dob').value;
    const year = document.getElementById('year').value;
    const skills = document.getElementById('skills').value
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0)
        .join(', ');
    const about = document.getElementById('about').value.trim();

    // Basic validation
    if (!name || !email || !password || !branch || !gender || !dob || !year || !about) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    // Email validation for RGUKT domain
    if (!email.match(/^s\d{6}@rguktsklm\.ac\.in$/)) {
        showNotification('Please use your valid RGUKT Srikakulam email (sXXXXXX@rguktsklm.ac.in)', 'error');
        return;
    }

    // Password validation
    if (password.length < 8) {
        showNotification('Password must be at least 8 characters long', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }

    try {
        // Get existing users
        let users = [];
        try {
            const storedUsers = localStorage.getItem('users');
            if (storedUsers) {
                users = JSON.parse(storedUsers);
                if (!Array.isArray(users)) users = [];
            }
        } catch (error) {
            console.error('Error parsing stored users:', error);
            users = [];
        }

        // Check if email already exists
        if (users.some(user => user.email.toLowerCase() === email.toLowerCase())) {
            showNotification('This email is already registered', 'error');
            return;
        }

        // Create new user object
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password,
            branch,
            gender,
            dob,
            year,
            skills,
            about,
            registrationDate: new Date().toISOString()
        };

        // Add to users array
        users.push(newUser);

        // Save to localStorage
        localStorage.setItem('users', JSON.stringify(users));
        
        // Also store individual user data
        localStorage.setItem(email, JSON.stringify(newUser));

        console.log('Registration successful:', newUser);

        // Show success message
        showNotification('Registration successful! Redirecting to login...', 'success');

        // Redirect to login page after delay
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);

    } catch (error) {
        console.error('Registration error:', error);
        showNotification('An error occurred during registration. Please try again.', 'error');
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
document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', function() {
        const inputId = this.getAttribute('data-input');
        const passwordInput = document.getElementById(inputId);
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
});

// Format skills input
document.getElementById('skills').addEventListener('input', function(e) {
    let skills = this.value.split(',');
    skills = skills.map(skill => skill.trim());
    this.value = skills.join(', ');
}); 