// src/fileManager.js

// Check if File System Access API is available
const hasFileSystemAccess = 'showOpenFilePicker' in window;

// File picker options
const imageFileOptions = {
  types: [{
    description: 'Images',
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] }
  }],
  excludeAcceptAllOption: false,
  multiple: false
};

export class FileManager {
  constructor() {
    this.fileHandle = null;
    this.imageBlob = null;
    this.setupEventListeners();
    this.loadSavedImage();
  }

  setupEventListeners() {
    $('#openFileBtn').on('click', () => this.openFile());
    $('#saveFileBtn').on('click', () => this.saveFile());

    $('#qualitySlider').on('input', (e) => {
      $('#qualityValue').text(`${e.target.value}%`);
      this.updatePreview();
    });
  }

  async openFile() {
    console.log('openFile 3');

    try {
      if (hasFileSystemAccess) {
        const [handle] = await window.showOpenFilePicker(imageFileOptions);
        this.fileHandle = handle;
        const file = await handle.getFile();
        await this.displayImage(file);
      } else {
        console.error('API File System Access not supported');
      }
    } catch (error) {
      console.error('Error during file opening:', error);
    }
  }

  async displayImage(file) {
    const $imagePreview = $('#imagePreview');
    const $previewContainer = $('#previewContainer');
    const $saveBtn = $('#saveFileBtn');

    // Create URL for preview
    const imageUrl = URL.createObjectURL(file);
    $imagePreview.attr('src', imageUrl);
    $previewContainer.removeClass('hidden');
    $saveBtn.prop('disabled', false).removeClass('opacity-50');

    // Store original blob
    this.imageBlob = await file.arrayBuffer();
  }

  async updatePreview() {
    if (!this.imageBlob) return;

    const quality = $('#qualitySlider').val() / 100;
    const $imagePreview = $('#imagePreview');

    // Create canvas for compression
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = async () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      // Update preview with new quality
      const newImageUrl = canvas.toDataURL('image/jpeg', quality);
      $imagePreview.attr('src', newImageUrl);
    };

    img.src = $imagePreview.attr('src');
  }

  async saveFile() {
    try {
      const quality = $('#qualitySlider').val() / 100;
      const $imagePreview = $('#imagePreview');

      // Create canvas for final compression
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = async () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);

        // Convert to blob with selected quality
        const blob = await new Promise(resolve => {
          canvas.toBlob(resolve, 'image/jpeg', quality);
        });

        if (hasFileSystemAccess && this.fileHandle) {
          // Save using File System Access API
          const writable = await this.fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          console.info('File saved successfully');
        } else {
          console.error('File System API not supported');
        }
      };

      img.src = $imagePreview.attr('src');
    } catch (error) {
      console.error('Error while saving:', error);
    }
  }

  async loadSavedImage() {
    try {
      const savedImage = localStorage.getItem('savedImage');
      if (savedImage) {
        const $imagePreview = $('#imagePreview');
        const $previewContainer = $('#previewContainer');
        const $saveBtn = $('#saveFileBtn');

        $imagePreview.attr('src', savedImage);
        $previewContainer.removeClass('hidden');
        $saveBtn.prop('disabled', false).removeClass('opacity-50');
      }
    } catch (error) {
      console.error('Error loading saved image:', error);
    }
  }
} 