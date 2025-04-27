// Initialize EmailJS with your public key
emailjs.init("6gwUhzhvXF_mAox_I");

// Get DOM elements
const contactForm = document.getElementById('contactForm');
const loader = document.querySelector('.loader');
const submitBtn = document.querySelector('.submit-btn');

// Check if user is authenticated
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'login.html';
    }
    
    // Test EmailJS initialization
    console.log('EmailJS initialized');
});

// Handle form submission
contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Show loader
    loader.style.display = 'flex';
    submitBtn.disabled = true;

    // Get form data
    const formData = {
        from_name: document.getElementById('name').value,
        from_email: document.getElementById('email').value,
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value,
        to_email: "d4357814@gmail.com"
    };

    // Log the form data
    console.log('Sending email with data:', formData);

    try {
        // Send email using EmailJS
        const response = await emailjs.send(
            "service_pncmjat",
            "template_ci3m20t",
            formData
        );

        console.log('EmailJS Response:', response);

        if (response.status === 200) {
            // Show success message
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Your message has been sent successfully.',
                confirmButtonColor: '#2B3774'
            });

            // Reset form
            contactForm.reset();
        }
    } catch (error) {
        // Show detailed error message
        console.error('EmailJS Error Details:', error);
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: `Failed to send message: ${error.message}`,
            confirmButtonColor: '#2B3774'
        });
    } finally {
        // Hide loader
        loader.style.display = 'none';
        submitBtn.disabled = false;
    }
}); 