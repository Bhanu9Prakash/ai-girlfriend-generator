/**
 * AI Girlfriend Generator - Frontend Script
 * Handles user interactions and API communication
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const uploadContainer = document.getElementById('upload-container');
  const uploadContent = document.getElementById('upload-content');
  const fileInput = document.getElementById('file-input');
  const previewContainer = document.getElementById('preview-container');
  const previewImage = document.getElementById('preview-image');
  const changePhotoBtn = document.getElementById('change-photo');
  const presetBtns = document.querySelectorAll('.preset-btn');
  const customPrompt = document.getElementById('custom-prompt');
  const generateBtn = document.getElementById('generate-btn');
  const resultSection = document.getElementById('result-section');
  const resultImage = document.getElementById('result-image');
  const loader = document.getElementById('loader');
  const downloadBtn = document.getElementById('download-btn');
  const shareBtn = document.getElementById('share-btn');
  const startOverBtn = document.getElementById('start-over-btn');
  const historyBtn = document.getElementById('history-btn');
  const historyModal = document.getElementById('history-modal');
  const closeModal = document.querySelector('.close-modal');
  const generationGrid = document.getElementById('generation-grid');

  // Enhancement elements
  const enhanceToggle = document.getElementById('enhance-toggle');
  const fidelitySliderContainer = document.getElementById('fidelity-slider-container');
  const fidelitySlider = document.getElementById('fidelity-slider');
  const fidelityValue = document.getElementById('fidelity-value');
  const applyEnhancementBtn = document.getElementById('apply-enhancement');
  const enhancementLoader = document.getElementById('enhancement-loader');
  const imageVersions = document.getElementById('image-versions');
  const versionBtns = document.querySelectorAll('.version-btn');

  // State variables
  let uploadedFile = null;
  let selectedPreset = null;
  let generations = JSON.parse(localStorage.getItem('aiGirlfriendGenerations')) || [];
  let currentImageUrl = null;
  let enhancedImageUrl = null;
  let activeVersion = 'original';

  // Event Listeners

  // Upload Container Events
  uploadContainer.addEventListener('click', () => fileInput.click());

  uploadContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadContainer.style.borderColor = 'var(--primary-color)';
    uploadContainer.style.backgroundColor = 'rgba(255, 107, 107, 0.05)';
  });

  uploadContainer.addEventListener('dragleave', () => {
    uploadContainer.style.borderColor = 'var(--gray-color)';
    uploadContainer.style.backgroundColor = '#fcfcfc';
  });

  uploadContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadContainer.style.borderColor = 'var(--gray-color)';
    uploadContainer.style.backgroundColor = '#fcfcfc';

    if (e.dataTransfer.files.length) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
      handleFileSelect(e.target.files[0]);
    }
  });

  // Change Photo Button
  changePhotoBtn.addEventListener('click', () => {
    resetUpload();
  });

  // Preset Buttons
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedPreset = btn.dataset.prompt;
      customPrompt.value = btn.dataset.prompt; // Fill the textarea with the preset text
      updateGenerateButton();
    });
  });

  // Custom Prompt Input
  customPrompt.addEventListener('input', () => {
    if (customPrompt.value.trim()) {
      presetBtns.forEach(btn => {
        if (btn.dataset.prompt !== customPrompt.value.trim()) {
          btn.classList.remove('active');
        }
      });
      selectedPreset = customPrompt.value.trim();
    }
    updateGenerateButton();
  });

  // Generate Button
  generateBtn.addEventListener('click', generateImage);

  // Download Button
  downloadBtn.addEventListener('click', () => {
    // Determine which version to download
    const imageUrl = activeVersion === 'original' ? currentImageUrl : enhancedImageUrl;
    if (!imageUrl) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const versionSuffix = activeVersion === 'enhanced' ? '-enhanced' : '';
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `ai-girlfriend${versionSuffix}-${timestamp}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Show download feedback
    const originalText = downloadBtn.innerHTML;
    downloadBtn.innerHTML = '<i class="fas fa-check"></i> Downloaded!';
    setTimeout(() => {
      downloadBtn.innerHTML = originalText;
    }, 2000);
  });

  // Start Over Button
  startOverBtn.addEventListener('click', () => {
    resetAll();
  });

  // Enhancement-related event listeners
  enhanceToggle.addEventListener('change', () => {
    fidelitySliderContainer.style.display = enhanceToggle.checked ? 'block' : 'none';
  });

  fidelitySlider.addEventListener('input', () => {
    fidelityValue.textContent = fidelitySlider.value;
  });

  applyEnhancementBtn.addEventListener('click', enhanceCurrentImage);

  versionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      versionBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      activeVersion = btn.dataset.version;
      toggleImageVersion(activeVersion);
    });
  });

  // History Modal Functionality
  historyBtn.addEventListener('click', () => {
    updateHistoryGrid();
    historyModal.style.display = 'block';
  });

  closeModal.addEventListener('click', () => {
    historyModal.style.display = 'none';
  });

  window.addEventListener('click', (e) => {
    if (e.target === historyModal) {
      historyModal.style.display = 'none';
    }
  });

  // Share Button Functionality
  shareBtn.addEventListener('click', async () => {
    try {
      // Determine which version to share
      const imageUrl = activeVersion === 'original' ? currentImageUrl : enhancedImageUrl;
      if (!imageUrl) return;

      if (navigator.share) {
        // For mobile devices with Web Share API
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], 'ai-girlfriend.png', { type: 'image/png' });

        await navigator.share({
          title: 'My AI Girlfriend',
          text: 'Check out my AI generated girlfriend!',
          files: [file]
        });
      } else {
        // Fallback for desktop - copy image URL to clipboard
        navigator.clipboard.writeText(window.location.origin + imageUrl);

        // Show feedback
        const originalText = shareBtn.innerHTML;
        shareBtn.innerHTML = '<i class="fas fa-check"></i> URL Copied!';
        setTimeout(() => {
          shareBtn.innerHTML = originalText;
        }, 2000);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  });

  // Functions

  /**
   * Handle file selection from upload
   * @param {File} file - The uploaded file
   */
  function handleFileSelect(file) {
    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      alert('Please upload a JPG, JPEG or PNG file.');
      return;
    }

    if (file.size > maxSize) {
      alert('File size exceeds 5MB limit.');
      return;
    }

    uploadedFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      uploadContainer.style.display = 'none';
      previewContainer.style.display = 'block';
      updateGenerateButton();
    };
    reader.readAsDataURL(file);
  }

  /**
   * Update generate button state based on inputs
   */
  function updateGenerateButton() {
    const hasPrompt = customPrompt.value.trim() || selectedPreset;
    generateBtn.disabled = !uploadedFile || !hasPrompt;
  }

  /**
   * Reset the upload section
   */
  function resetUpload() {
    uploadedFile = null;
    fileInput.value = '';
    previewImage.src = '';
    uploadContainer.style.display = 'block';
    previewContainer.style.display = 'none';
    updateGenerateButton();
  }

  /**
   * Reset the entire form
   */
  function resetAll() {
    resetUpload();
    customPrompt.value = '';
    presetBtns.forEach(btn => btn.classList.remove('active'));
    selectedPreset = null;
    resultSection.style.display = 'none';
    resultImage.src = '';
    currentImageUrl = null;
    enhancedImageUrl = null;
    activeVersion = 'original';

    // Reset enhancement options
    enhanceToggle.checked = false;
    fidelitySliderContainer.style.display = 'none';
    fidelitySlider.value = 0.5;
    fidelityValue.textContent = '0.5';
    imageVersions.style.display = 'none';
    versionBtns.forEach(btn => {
      if (btn.dataset.version === 'original') {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  /**
   * Toggle between original and enhanced image versions
   * @param {string} version - Version to display ('original' or 'enhanced')
   */
  function toggleImageVersion(version) {
    if (version === 'original') {
      resultImage.src = currentImageUrl;
    } else if (version === 'enhanced' && enhancedImageUrl) {
      resultImage.src = enhancedImageUrl;
    }
  }

  /**
   * Enhance the current image using the CodeFormer API
   */
  async function enhanceCurrentImage() {
    try {
      // Show the enhancement loader
      applyEnhancementBtn.disabled = true;
      enhancementLoader.style.display = 'flex';

      // Get the fidelity value (ensure it's a number)
      const fidelity = parseFloat(fidelitySlider.value);
      console.log(`Enhancing image with fidelity: ${fidelity} (type: ${typeof fidelity})`);

      // Send request to the enhancement API
      const response = await fetch('/api/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imagePath: currentImageUrl,
          fidelity: fidelity
        })
      });

      const data = await response.json();

      if (data.success) {
        // Store the enhanced image URL
        enhancedImageUrl = data.enhancedImageUrl;

        // Show version selector buttons
        imageVersions.style.display = 'block';

        // Automatically switch to enhanced version
        versionBtns.forEach(btn => {
          if (btn.dataset.version === 'enhanced') {
            btn.click();
          }
        });

        // Add to the generation history
        const existingGeneration = generations.find(gen => gen.imageUrl === currentImageUrl);
        if (existingGeneration) {
          existingGeneration.enhancedImageUrl = enhancedImageUrl;
          localStorage.setItem('aiGirlfriendGenerations', JSON.stringify(generations));
        }
      } else {
        throw new Error(data.error || 'Failed to enhance image');
      }
    } catch (error) {
      console.error('Error enhancing image:', error);
      alert(`Error: ${error.message || 'Failed to enhance image'}`);
    } finally {
      // Hide the enhancement loader
      enhancementLoader.style.display = 'none';
      applyEnhancementBtn.disabled = false;
    }
  }

  /**
   * Generate the girlfriend image through API
   */
  async function generateImage() {
    // Show loader and result section
    resultSection.style.display = 'block';
    resultImage.style.display = 'none';
    loader.style.display = 'flex';

    // Reset enhancement options
    enhanceToggle.checked = false;
    fidelitySliderContainer.style.display = 'none';
    imageVersions.style.display = 'none';
    enhancedImageUrl = null;

    try {
      const formData = new FormData();
      formData.append('image', uploadedFile);

      // Get the prompt text
      const promptText = customPrompt.value.trim();

      // Add prompt to form data
      if (promptText) {
        formData.append('prompt', promptText);
      } else if (selectedPreset) {
        formData.append('presetPrompt', selectedPreset);
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        currentImageUrl = data.imageUrl;
        resultImage.src = currentImageUrl;
        activeVersion = 'original';

        resultImage.onload = () => {
          resultImage.style.display = 'block';
          loader.style.display = 'none';

          // Save to localStorage
          const newGeneration = {
            id: Date.now(),
            imageUrl: currentImageUrl,
            prompt: promptText || selectedPreset,
            timestamp: new Date().toISOString()
          };

          generations.unshift(newGeneration);
          // Keep only the last 20 generations
          if (generations.length > 20) {
            generations = generations.slice(0, 20);
          }

          localStorage.setItem('aiGirlfriendGenerations', JSON.stringify(generations));
        };
      } else {
        throw new Error(data.error || 'Failed to generate image');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      alert(`Error: ${error.message || 'Failed to generate image'}`);
      loader.style.display = 'none';
      resultSection.style.display = 'none';
    }
  }

  /**
   * Update the history grid with saved generations
   */
  function updateHistoryGrid() {
    generationGrid.innerHTML = '';

    if (generations.length === 0) {
      generationGrid.innerHTML = '<p class="empty-history-message">You haven\'t created any images yet.</p>';
      return;
    }

    generations.forEach(gen => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';

      const formattedDate = new Date(gen.timestamp).toLocaleString();

      // Check if it has an enhanced version
      const hasEnhanced = gen.enhancedImageUrl !== undefined;

      historyItem.innerHTML = `
        <div class="history-image-container">
          <img src="${gen.imageUrl}" alt="Generated girlfriend">
          ${hasEnhanced ? '<span class="enhanced-badge">Enhanced Available</span>' : ''}
        </div>
        <div class="history-details">
          <p class="history-prompt">${gen.prompt.length > 40 ? gen.prompt.substring(0, 40) + '...' : gen.prompt}</p>
          <p class="history-date">${formattedDate}</p>
        </div>
        <div class="history-actions">
          <button class="history-download" data-url="${gen.imageUrl}" title="Download Original">
            <i class="fas fa-download"></i>
          </button>
          ${hasEnhanced ? `
            <button class="history-download-enhanced" data-url="${gen.enhancedImageUrl}" title="Download Enhanced">
              <i class="fas fa-magic"></i>
            </button>
          ` : ''}
          <button class="history-delete" data-id="${gen.id}" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;

      generationGrid.appendChild(historyItem);
    });

    // Add event listeners to history item buttons
    document.querySelectorAll('.history-download').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const imageUrl = btn.dataset.url;
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `ai-girlfriend-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    });

    document.querySelectorAll('.history-download-enhanced').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const imageUrl = btn.dataset.url;
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `ai-girlfriend-enhanced-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    });

    document.querySelectorAll('.history-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const genId = parseInt(btn.dataset.id);
        generations = generations.filter(gen => gen.id !== genId);
        localStorage.setItem('aiGirlfriendGenerations', JSON.stringify(generations));
        updateHistoryGrid();
      });
    });

    // Make history items clickable to view full image
    document.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', () => {
        const imgSrc = item.querySelector('img').src;
        resultImage.src = imgSrc;
        currentImageUrl = imgSrc;

        // Check if it has an enhanced version
        const enhancedBtn = item.querySelector('.history-download-enhanced');
        if (enhancedBtn) {
          enhancedImageUrl = enhancedBtn.dataset.url;
          imageVersions.style.display = 'block';
          versionBtns.forEach(btn => {
            if (btn.dataset.version === 'original') {
              btn.classList.add('active');
            } else {
              btn.classList.remove('active');
            }
          });
          activeVersion = 'original';
        } else {
          enhancedImageUrl = null;
          imageVersions.style.display = 'none';
        }

        resultSection.style.display = 'block';
        resultImage.style.display = 'block';
        loader.style.display = 'none';
        historyModal.style.display = 'none';

        // Scroll to result section
        resultSection.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }
});