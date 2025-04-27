// Initialize IndexedDB
const dbName = 'PrepShelfDB';
const dbVersion = 1;
let db;

const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('pdfs')) {
                db.createObjectStore('pdfs', { keyPath: 'id' });
            }
        };
    });
};

// Book management functionality
let books = JSON.parse(localStorage.getItem('books') || '[]');

// Initialize modal
let uploadModal;

// Initialize DB when page loads
window.addEventListener('load', async () => {
    try {
        await initDB();
        
        // Initialize modal
        uploadModal = new bootstrap.Modal(document.getElementById('uploadModal'));
        
        // Initialize drag and drop
        initializeDragAndDrop();
        
        // Display uploaded books
        displayUploadedBooks();
        
        // Initialize search functionality
        initializeSearch();
    } catch (error) {
        console.error('Error initializing application:', error);
        showNotification('Error loading uploaded books. Please refresh the page.', 'error');
    }
});

async function getPDFData(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['pdfs'], 'readonly');
        const store = transaction.objectStore('pdfs');
        const request = store.get(id);
        
        request.onsuccess = () => resolve(request.result?.pdfData);
        request.onerror = () => reject(request.error);
    });
}

// Display only uploaded books
function displayUploadedBooks() {
    const uploadedBooksContainer = document.getElementById('uploadedBooks');
    if (!uploadedBooksContainer) return;

    // Get books from localStorage
    const books = JSON.parse(localStorage.getItem('books') || '[]');
    
    if (books.length === 0) {
        uploadedBooksContainer.innerHTML = ''; // Clear if no uploaded books
        return;
    }

    let uploadedBooksHTML = '';
    books.forEach(book => {
        uploadedBooksHTML += `
            <div class="book-box" data-id="${book.id}">
                <div class="book-actions">
                    <button class="action-btn delete-btn" onclick="deleteBook('${book.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="action-btn share-btn" onclick="shareBook('${book.id}')">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
                ${book.coverImage 
                    ? `<img src="${book.coverImage}" alt="${book.title}" onerror="this.onerror=null; this.src='https://via.placeholder.com/200x300?text=No+Cover'">` 
                    : `<div class="pdf-icon"><i class="fas fa-file-pdf"></i></div>`
                }
                <div class="book-title"><b>${book.title}</b></div>
                ${book.author ? `<div class="book-author">By: ${book.author}</div>` : ''}
                <div class="book-type-badge">Uploaded</div>
            </div>
        `;
    });

    uploadedBooksContainer.innerHTML = uploadedBooksHTML;

    // Add click handlers for opening PDFs
    books.forEach(book => {
        const bookElement = uploadedBooksContainer.querySelector(`[data-id="${book.id}"]`);
        if (bookElement) {
            bookElement.addEventListener('click', (e) => {
                if (!e.target.closest('.action-btn')) {
                    openPdf(book.id);
                }
            });
        }
    });
}

async function openPdf(bookId) {
    try {
        const book = books.find(b => b.id === bookId);
        const pdfData = await getPDFData(bookId);
        
        if (book && pdfData) {
            const pdfWindow = window.open('', '_blank');
            pdfWindow.document.write(`
                <html>
                <head>
                    <title>${book.title}</title>
                    <style>
                        body { margin: 0; padding: 0; overflow: hidden; }
                        embed { width: 100vw; height: 100vh; }
                    </style>
                </head>
                <body>
                    <embed src="${pdfData}" type="application/pdf" />
                </body>
                </html>
            `);
        } else {
            showNotification('Error: PDF data not found', 'error');
        }
    } catch (error) {
        console.error('Error opening PDF:', error);
        showNotification('Error opening PDF file', 'error');
    }
}

async function deleteBook(bookId) {
    if (confirm('Are you sure you want to delete this book?')) {
        try {
            // Remove from IndexedDB
            const transaction = db.transaction(['pdfs'], 'readwrite');
            const store = transaction.objectStore('pdfs');
            await store.delete(bookId);

            // Remove from localStorage
            books = books.filter(book => book.id !== bookId);
            localStorage.setItem('books', JSON.stringify(books));
            
            displayUploadedBooks();
            showNotification('Book deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting book:', error);
            showNotification('Error deleting book', 'error');
        }
    }
}

async function downloadBook(bookId) {
    try {
        const book = books.find(b => b.id === bookId);
        const pdfData = await getPDFData(bookId);
        
        if (book && pdfData) {
            const link = document.createElement('a');
            link.href = pdfData;
            link.download = book.fileName || `${book.title}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showNotification('Download started!', 'success');
        } else {
            showNotification('Error: PDF data not found', 'error');
        }
    } catch (error) {
        console.error('Error downloading PDF:', error);
        showNotification('Error downloading PDF file', 'error');
    }
}

function shareBook(bookId) {
    const book = books.find(b => b.id === bookId);
    if (book) {
        if (navigator.share) {
            navigator.share({
                title: book.title,
                text: `Check out this book: ${book.title}`,
                url: window.location.href
            }).catch(error => {
                console.error('Error sharing:', error);
                showNotification('Unable to share. Try copying the link instead.', 'error');
            });
        } else {
            // Fallback for browsers that don't support Web Share API
            const dummyInput = document.createElement('input');
            document.body.appendChild(dummyInput);
            dummyInput.value = window.location.href;
            dummyInput.select();
            document.execCommand('copy');
            document.body.removeChild(dummyInput);
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

// Search functionality
const searchBar = document.getElementById('searchBar');
if (searchBar) {
    searchBar.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        
        // Get all book boxes
        const allBookBoxes = document.querySelectorAll('.book-box');
        
        allBookBoxes.forEach(box => {
            const title = box.querySelector('.book-title').textContent.toLowerCase();
            const author = box.querySelector('.book-author')?.textContent.toLowerCase() || '';
            
            if (title.includes(searchTerm) || author.includes(searchTerm)) {
                box.style.display = '';
            } else {
                box.style.display = 'none';
            }
        });
    });
}

function logout() {
    if(confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

function openUploadModal() {
    // Reset form
    document.getElementById('uploadForm').reset();
    document.getElementById('coverPreview').innerHTML = '';
    document.getElementById('pdfPreview').innerHTML = '';
    document.getElementById('coverPreview').classList.remove('show');
    document.getElementById('pdfPreview').classList.remove('show');
    
    // Show modal
    uploadModal.show();
}

function initializeDragAndDrop() {
    const dropAreas = document.querySelectorAll('.file-drop-area');
    
    dropAreas.forEach(dropArea => {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => {
                dropArea.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => {
                dropArea.classList.remove('dragover');
            });
        });

        dropArea.addEventListener('drop', handleDrop);
    });

    // Add change event listeners for file inputs
    document.getElementById('bookCover').addEventListener('change', function(e) {
        handleFileSelect(this, 'cover');
    });

    document.getElementById('bookFile').addEventListener('change', function(e) {
        handleFileSelect(this, 'pdf');
    });
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    const input = this.querySelector('input[type="file"]');
    const type = input.id === 'bookCover' ? 'cover' : 'pdf';
    
    input.files = files;
    handleFileSelect(input, type);
}

function handleFileSelect(input, type) {
    const file = input.files[0];
    if (!file) return;

    const preview = document.getElementById(type === 'cover' ? 'coverPreview' : 'pdfPreview');
    preview.innerHTML = '';

    // Validate file type
    if (type === 'pdf' && !file.type.includes('pdf')) {
        showNotification('Please select a valid PDF file.', 'error');
        input.value = '';
        return;
    }

    if (type === 'cover' && !file.type.includes('image')) {
        showNotification('Please select a valid image file.', 'error');
        input.value = '';
        return;
    }

    // Show file info
    const fileInfo = document.createElement('div');
    fileInfo.innerHTML = `
        <strong>Selected file:</strong> ${file.name}<br>
        <strong>Size:</strong> ${formatFileSize(file.size)}
    `;
    preview.appendChild(fileInfo);

    // Show image preview for cover
    if (type === 'cover') {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            preview.appendChild(img);
        };
        reader.readAsDataURL(file);
    }

    preview.classList.add('show');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function processAndCompressFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            resolve(e.target.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function processAndCompressImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Calculate new dimensions (max 800px width/height)
            let width = img.width;
            let height = img.height;
            const maxSize = 800;
            
            if (width > maxSize || height > maxSize) {
                if (width > height) {
                    height = (height / width) * maxSize;
                    width = maxSize;
                } else {
                    width = (width / height) * maxSize;
                    height = maxSize;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = reject;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function storePDFInIndexedDB(pdfObject) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not initialized'));
            return;
        }
        const transaction = db.transaction(['pdfs'], 'readwrite');
        const store = transaction.objectStore('pdfs');
        const request = store.put(pdfObject);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function saveBookMetadata(metadata) {
    try {
        // Get existing books from localStorage
        let books = JSON.parse(localStorage.getItem('books') || '[]');
        
        // Add new metadata
        books.push(metadata);
        
        // Save back to localStorage
        localStorage.setItem('books', JSON.stringify(books));
        
        // Update the global books array
        window.books = books;
        
        // Refresh the display
        displayUploadedBooks();
    } catch (error) {
        console.error('Error saving book metadata:', error);
        throw error;
    }
}

async function uploadBook() {
    const form = document.getElementById('uploadForm');
    const bookFile = document.getElementById('bookFile').files[0];
    const coverFile = document.getElementById('bookCover').files[0];
    const titleInput = document.getElementById('bookTitle');
    const authorInput = document.getElementById('bookAuthor');
    
    if (!titleInput.value || !authorInput.value) {
        showNotification('Please fill in all required fields.', 'error');
        return;
    }

    if (!bookFile) {
        showNotification('Please select a PDF file to upload.', 'error');
        return;
    }

    if (!bookFile.type.includes('pdf')) {
        showNotification('Please select a valid PDF file.', 'error');
        return;
    }

    // Show loading overlay
    document.querySelector('.loading-overlay').style.display = 'flex';

    try {
        // Process the PDF file
        const pdfData = await processAndCompressFile(bookFile);
        
        // Generate unique ID
        const bookId = Date.now().toString();
        
        // Create book metadata object
        const bookMetadata = {
            id: bookId,
            title: titleInput.value.trim(),
            author: authorInput.value.trim(),
            description: document.getElementById('bookDescription').value.trim(),
            fileName: bookFile.name,
            uploadDate: new Date().toISOString(),
            type: 'Book',
            fileSize: bookFile.size
        };

        // Handle cover image if present
        if (coverFile) {
            try {
                const coverData = await processAndCompressImage(coverFile);
                bookMetadata.coverImage = coverData;
            } catch (error) {
                console.error('Error processing cover image:', error);
                // Continue without cover image if there's an error
            }
        }

        // Store PDF in IndexedDB
        await storePDFInIndexedDB({
            id: bookId,
            pdfData: pdfData
        });

        // Store metadata in localStorage
        await saveBookMetadata(bookMetadata);

        // Hide loading overlay
        document.querySelector('.loading-overlay').style.display = 'none';

        // Close modal
        uploadModal.hide();

        // Show success message
        showNotification('Book uploaded successfully!', 'success');

        // Refresh display
        displayUploadedBooks();

    } catch (error) {
        console.error('Upload error:', error);
        document.querySelector('.loading-overlay').style.display = 'none';
        showNotification('Error uploading file. Please try again.', 'error');
    }
}

// Add search initialization function
function initializeSearch() {
    const searchBar = document.getElementById('searchBar');
    if (searchBar) {
        searchBar.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const allBookBoxes = document.querySelectorAll('.book-box');
            
            allBookBoxes.forEach(box => {
                const title = box.querySelector('.book-title')?.textContent.toLowerCase() || '';
                const author = box.querySelector('.book-author')?.textContent.toLowerCase() || '';
                
                if (title.includes(searchTerm) || author.includes(searchTerm)) {
                    box.style.display = '';
                } else {
                    box.style.display = 'none';
                }
            });
        });
    }
} 