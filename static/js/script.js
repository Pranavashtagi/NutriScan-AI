document.addEventListener('DOMContentLoaded', function () {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('foodImage');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const uploadForm = document.getElementById('uploadForm');
    const previewSection = document.getElementById('previewSection');
    const imagePreview = document.getElementById('imagePreview');
    const loading = document.getElementById('loading');

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
        uploadArea.style.borderColor = 'var(--primary)';
        uploadArea.style.background = '#f5f7ff';
    });
    uploadArea.addEventListener('dragover', e => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--primary)';
        uploadArea.style.background = '#f5f7ff';
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '';
        uploadArea.style.background = '';
    });

    // Handle the actual file drop — single handler
    uploadArea.addEventListener('drop', e => {
        uploadArea.style.borderColor = '';
        uploadArea.style.background = '';

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

        loading.style.display = 'block';
        analyzeBtn.disabled = true;

        const formData = new FormData();
        formData.append('food_image', fileInput.files[0]);

        fetch('/upload', { method: 'POST', body: formData })
            .then(async response => {
                const contentType = response.headers.get('content-type') || '';
                if (contentType.includes('application/json')) {
                    // Server returned a JSON error — show inline instead of alert
                    const data = await response.json();
                    const msg = (data && data.error) ? data.error : 'An unexpected error occurred.';
                    document.documentElement.innerHTML = buildErrorPage(msg);
                } else {
                    const html = await response.text();
                    document.documentElement.innerHTML = html;
                }
            })
            .catch(() => {
                loading.style.display = 'none';
                analyzeBtn.disabled = false;
                document.documentElement.innerHTML = buildErrorPage('Could not reach the server. Please try again.');
            });
    });

    function buildErrorPage(message) {
        return `<!DOCTYPE html><html><head>
            <title>NutriScan AI</title>
            <link rel="stylesheet" href="/static/css/style.css">
        </head><body><div class="container">
            <header class="result-header">
                <a href="/" class="back-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    Back to Dashboard
                </a>
                <h1>Analysis Report</h1>
            </header>
            <div class="upload-section" style="text-align:center;background:#fff1f2;border-color:#fda4af;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:16px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <h2 style="color:#9f1239;">Something went wrong</h2>
                <p style="color:#be123c;margin-top:8px;">${message}</p>
                <a href="/" class="analyze-btn" style="text-decoration:none;display:inline-block;width:auto;margin-top:24px;">Try Again</a>
            </div>
        </div></body></html>`;
    }
});


// Clear image function
function clearImage() {
    const fileInput = document.getElementById('foodImage');
    const previewSection = document.getElementById('previewSection');
    const analyzeBtn = document.getElementById('analyzeBtn');

    fileInput.value = '';
    previewSection.style.display = 'none';
    analyzeBtn.disabled = true;
}