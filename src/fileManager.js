// src/fileManager.js
import { openDB } from 'idb';

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
    this.fileHandle = null;  // Reference to the selected file in the file system (FileSystemFileHandle)
    this.imageBlob = null;   // Raw image data stored as ArrayBuffer for processing and preview
    this.setupEventListeners();
    this.loadSavedImage();
  }

  setupEventListeners() {
    $('#openFileBtn').on('click', () => this.openFile());
    $('#downloadImageBtn').on('click', () => this.downloadFile());

    $('#qualitySlider').on('input', (e) => {
      $('#qualityValue').text(`${e.target.value}%`);
      this.updatePreview();
    });

    $('#closeImageBtn').on('click', async () => {
      $('#previewContainer').addClass('hidden');
      if (this.imageBlob) {
        URL.revokeObjectURL($('#imagePreview').attr('src'));
      }
      await this.deleteImageDB();
      this.imageBlob = null;
      this.fileHandle = null;
    });
  }

  async openFile() {
    try {
      if (window?.showOpenFilePicker) {
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

  async updatePreview() {
    if (!this.imageBlob) return;

    const quality = $('#qualitySlider').val() / 100;
    const img = await this.createImageFromBlob(this.imageBlob, this.fileType);
    const canvas = this.createCanvasFromImage(img);
    const newImageUrl = canvas.toDataURL(this.fileType, quality);

    $('#imagePreview').attr('src', newImageUrl);
  }

  createCanvasFromImage(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    return canvas;
  }

  async createImageFromBlob(blob, type) {
    const img = new Image();
    const url = URL.createObjectURL(new Blob([blob], { type }));
    img.onload = () => {
      URL.revokeObjectURL(url);
    };
    img.src = url;
    return img;
  }

  async downloadFile() {
    try {
      const quality = $('#qualitySlider').val() / 100;
      const $imagePreview = $('#imagePreview');

      const img = new Image();
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = $imagePreview.attr('src');
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      const originalFile = await this.fileHandle?.getFile();
      const fileType = originalFile?.type || 'image/jpeg';
      const fileExt = fileType.split('/')[1];

      const originalName = originalFile?.name || `image.${fileExt}`;
      const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
      const suggestedName = `${nameWithoutExt}_q${Math.round(quality * 100)}.${fileExt}`;

      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, fileType, quality);
      });

      const options = {
        suggestedName,
        types: [{ description: 'Images', accept: { [fileType]: [`.${fileExt}`] } }],
      };

      const handle = await window.showSaveFilePicker(options);
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();

      console.info('File saved successfully');
    } catch (error) {
      if (error.name === 'AbortError') {
        console.info('Save file operation was cancelled');
        return;
      }
      console.error('Error while saving:', error);
    }
  }

  async displayImage(file) {
    try {
      this.imageBlob = await file.arrayBuffer();
      const imageData = {
        blob: this.imageBlob,
        type: file.type,
        name: file.name,
        lastModified: file.lastModified
      };

      await this.saveImageDB(imageData);
      await this.updateImagePreview(this.imageBlob, file.type);
    } catch (error) {
      console.error('Error displaying image:', error);
    }
  }

  async updateImagePreview(blob, type) {
    const $imagePreview = $('#imagePreview');
    const $previewContainer = $('#previewContainer');

    const newBlob = new Blob([blob], { type });
    const imageUrl = URL.createObjectURL(newBlob);

    $imagePreview.attr('src', imageUrl);
    $previewContainer.removeClass('hidden');
  }

  async loadSavedImage() {
    try {
      const savedImage = await this.loadImageDB();
      if (savedImage) {
        const $imagePreview = $('#imagePreview');
        const $previewContainer = $('#previewContainer');

        // Recreate blob and URL
        const blob = new Blob([savedImage.blob], { type: savedImage.type });
        const imageUrl = URL.createObjectURL(blob);
        $imagePreview.attr('src', imageUrl);
        $previewContainer.removeClass('hidden');
        this.imageBlob = savedImage.blob;
        this.fileType = savedImage.type;
      }
    } catch (error) {
      console.error('Error loading saved image:', error);
    }
  }

  async initDB() {
    return openDB('fileManager-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images', { keyPath: 'id' });
        }
      },
    });
  }

  async saveImageDB(imageData) {
    const db = await this.initDB();
    await db.put('images', { id: 'currentImage', ...imageData });
  }

  async loadImageDB() {
    const db = await this.initDB();
    return await db.get('images', 'currentImage');
  }

  async deleteImageDB() {
    const db = await this.initDB();
    await db.delete('images', 'currentImage');
  }
} 