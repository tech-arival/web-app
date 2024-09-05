document.getElementById('uploadForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const uploadButton = document.getElementById('uploadButton');
    const fileInput = document.getElementById('file');
    const form = document.getElementById('uploadForm');
    const spinner = document.getElementById('spinner');
    const messageRibbon = document.getElementById('messageRibbon');

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);

    // Disable the button and show the spinner
    uploadButton.disabled = true;
    form.style.display = 'none';
    spinner.style.display = 'block';

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            showMessage('File uploaded successfully!', 'success', response.processedRowsCount, response.skippedRowCount);
        } else {
            showMessage('File upload failed: ' + result.message, 'error');
        }
    } catch (error) {
        showMessage('File upload failed: ' + error.message, 'error');
    } finally {
        // Re-enable the button and toggle the spinner back
        uploadButton.disabled = false;
        form.style.display = 'block';
        spinner.style.display = 'none';
    }
});

function showMessage(message, type, rowsProcessed = 0, rowsSkipped = 0) {
    const messageRibbon = document.getElementById('messageRibbon');
    messageRibbon.textContent = `${message}. Rows Processed: ${rowsProcessed}, Rows Skipped: ${rowsSkipped}`;
    messageRibbon.className = 'message-ribbon show ' + type; // Add type for different styles

    setTimeout(() => {
        messageRibbon.classList.remove('show');
    }, 3000); // Hide the ribbon after 3 seconds
}
