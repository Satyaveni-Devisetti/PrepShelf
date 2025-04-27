// Book management functionality
let books = JSON.parse(localStorage.getItem('books') || '[]');

function showUploadDialog() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    fileInput.click();

    fileInput.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            // Create object URL for the file
            const fileUrl = URL.createObjectURL(file);
            
            // Create book object
            const book = {
                id: Date.now().toString(),
                title: file.name.replace('.pdf', ''),
                url: fileUrl,
                uploadDate: new Date().toISOString(),
                type: 'PDF'
            };

            // Add to books array
            books.push(book);
            localStorage.setItem('books', JSON.stringify(books));
            
            // Refresh display
            displayBooks();
            
            // Show success notification
            showNotification('Book uploaded successfully!', 'success');
        }
        document.body.removeChild(fileInput);
    };
}

function displayBooks() {
    const uploadedBooksContainer = document.getElementById('uploadedBooks');
    uploadedBooksContainer.innerHTML = '';

    books.forEach(book => {
        const bookElement = createBookElement(book);
        uploadedBooksContainer.appendChild(bookElement);
    });
}

function createBookElement(book) {
    const bookBox = document.createElement('div');
    bookBox.className = 'book-box';
    bookBox.innerHTML = `
        <span class="book-type-badge">${book.type}</span>
        <div class="book-actions">
            <button class="action-btn share-btn" onclick="shareBook('${book.id}')">
                <i class="fas fa-share-alt"></i>
            </button>
            <button class="action-btn" onclick="downloadBook('${book.id}')">
                <i class="fas fa-download"></i>
            </button>
            <button class="action-btn delete-btn" onclick="deleteBook('${book.id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <i class="fas fa-file-pdf pdf-icon"></i>
        <div class="book-title">${book.title}</div>
        <div class="book-author">Uploaded: ${new Date(book.uploadDate).toLocaleDateString()}</div>
    `;

    bookBox.addEventListener('click', (e) => {
        if (!e.target.closest('.action-btn')) {
            window.open(book.url, '_blank');
        }
    });

    return bookBox;
}

function deleteBook(bookId) {
    if (confirm('Are you sure you want to delete this book?')) {
        books = books.filter(book => book.id !== bookId);
        localStorage.setItem('books', JSON.stringify(books));
        displayBooks();
        showNotification('Book deleted successfully!', 'success');
    }
}

function downloadBook(bookId) {
    const book = books.find(b => b.id === bookId);
    if (book) {
        const link = document.createElement('a');
        link.href = book.url;
        link.download = `${book.title}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function shareBook(bookId) {
    const book = books.find(b => b.id === bookId);
    if (book) {
        if (navigator.share) {
            navigator.share({
                title: book.title,
                text: `Check out this book: ${book.title}`,
                url: book.url
            }).catch(console.error);
        } else {
            // Fallback for browsers that don't support Web Share API
            const dummy = document.createElement('input');
            document.body.appendChild(dummy);
            dummy.value = window.location.origin + book.url;
            dummy.select();
            document.execCommand('copy');
            document.body.removeChild(dummy);
            showNotification('Link copied to clipboard!', 'success');
        }
    }
}

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

// Initialize books display when page loads
window.addEventListener('load', displayBooks); 