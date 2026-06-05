document.addEventListener('DOMContentLoaded', function () {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('foodImage');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const uploadForm = document.getElementById('uploadForm');
    const previewSection = document.getElementById('previewSection');
    const imagePreview = document.getElementById('imagePreview');
    const loading = document.getElementById('loading');
    const loadingText = document.getElementById('loadingText');

    let loadingMessageInterval = null;

    // Click on upload area triggers file input
    uploadArea.addEventListener('click', () => fileInput.click());

    // Handle file selection
    fileInput.addEventListener('change', function () {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function (e) {
                imagePreview.src = e.target.result;
                previewSection.style.display = 'block';
                analyzeBtn.disabled = false;
            };
            reader.readAsDataURL(this.files[0]);
        }
    });

    // Prevent default browser drag behaviour on the whole page
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
        document.body.addEventListener(evt, e => { e.preventDefault(); e.stopPropagation(); });
    });

    // Highlight drop zone
    uploadArea.addEventListener('dragenter', () => {
        uploadArea.classList.add('drag-over');
    });
    uploadArea.addEventListener('dragover', e => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    // Handle the actual file drop
    uploadArea.addEventListener('drop', e => {
        uploadArea.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files && files[0]) {
            fileInput.files = files;
            fileInput.dispatchEvent(new Event('change'));
        }
    });

    // Form submission
    uploadForm.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!fileInput.files[0]) return;

        // Visual loading state
        loading.style.display = 'block';
        analyzeBtn.disabled = true;
        uploadArea.style.pointerEvents = 'none';

        // Cycle through professional loading messages
        const messages = [
            "Analyzing food image...",
            "AI identifying ingredients...",
            "Estimating nutritional profile...",
            "Calculating calorie count...",
            "Finalizing macro breakdown..."
        ];
        let msgIndex = 0;
        loadingText.textContent = messages[0];

        loadingMessageInterval = setInterval(() => {
            msgIndex = (msgIndex + 1) % messages.length;
            loadingText.textContent = messages[msgIndex];
        }, 2200);

        const formData = new FormData();
        formData.append('food_image', fileInput.files[0]);

        fetch('/upload', { method: 'POST', body: formData })
            .then(async response => {
                clearInterval(loadingMessageInterval);
                const contentType = response.headers.get('content-type') || '';
                if (contentType.includes('application/json')) {
                    const data = await response.json();
                    const msg = (data && data.error) ? data.error : 'An unexpected error occurred.';
                    document.documentElement.innerHTML = buildErrorPage(msg);
                } else {
                    const html = await response.text();
                    document.documentElement.innerHTML = html;
                }
            })
            .catch(() => {
                clearInterval(loadingMessageInterval);
                loading.style.display = 'none';
                analyzeBtn.disabled = false;
                uploadArea.style.pointerEvents = 'auto';
                document.documentElement.innerHTML = buildErrorPage('Could not reach the server. Please check your connection and try again.');
            });
    });

    // Try sample helper function (exposed to window)
    window.selectSample = async function (imageUrl, filename) {
        try {
            // First, visual reset
            clearImage();

            // Fetch image from local path
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error("Failed to fetch sample image.");
            
            const blob = await response.blob();
            // Match file extension and type
            const file = new File([blob], filename, { type: blob.type || 'image/png' });

            // Feed file into file input using DataTransfer
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;

            // Trigger preview & automatic submission
            const reader = new FileReader();
            reader.onload = function (e) {
                imagePreview.src = e.target.result;
                previewSection.style.display = 'block';
                analyzeBtn.disabled = false;

                // Submit form automatically to trigger analysis immediately
                uploadForm.dispatchEvent(new Event('submit'));
            };
            reader.readAsDataURL(file);

        } catch (error) {
            console.error("Error loading sample image:", error);
            alert("Could not load the sample image. Please try uploading a food image manually.");
        }
    };

    function buildErrorPage(message) {
        return `<!DOCTYPE html><html><head>
            <title>NutriScan AI</title>
            <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="/static/css/style.css">
        </head><body>
            <nav class="navbar">
                <a href="/" class="nav-logo">
                    <span class="nav-logo-dot"></span>
                    NutriScan AI
                </a>
            </nav>
            <div class="page">
                <header class="result-header">
                    <a href="/" class="back-link">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                        Back to Dashboard
                    </a>
                </header>
                <div class="no-food-card" style="border-color: #fca5a5; background: #fff8f8;">
                    <div style="width: 52px; height: 52px; border-radius: 50%; background: #fef2f2; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; border: 1px solid #fee2e2;">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    </div>
                    <h2 style="color: #991b1b; margin-top: 0;">Something went wrong</h2>
                    <p style="color: #7f1d1d;">${message}</p>
                    <a href="/" class="cta-btn primary" style="text-decoration:none;display:inline-block;width:auto;margin: 20px auto 0;">Try Again</a>
                </div>
            </div></body></html>`;
    }
});

// Clear image function (exposed to window)
window.clearImage = function() {
    const fileInput = document.getElementById('foodImage');
    const previewSection = document.getElementById('previewSection');
    const analyzeBtn = document.getElementById('analyzeBtn');

    fileInput.value = '';
    previewSection.style.display = 'none';
    analyzeBtn.disabled = true;
};