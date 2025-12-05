function updateActiveSlide(slide) {
  const block = slide.closest('.carousel');
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);
  block.dataset.activeSlide = slideIndex;

  const slides = block.querySelectorAll('.carousel-slide');

  slides.forEach((aSlide, idx) => {
    aSlide.setAttribute('aria-hidden', idx !== slideIndex);
    aSlide.querySelectorAll('a').forEach((link) => {
      if (idx !== slideIndex) {
        link.setAttribute('tabindex', '-1');
      } else {
        link.removeAttribute('tabindex');
      }
    });
  });

  const indicators = block.querySelectorAll('.carousel-slide-indicator');
  indicators.forEach((indicator, idx) => {
    const button = indicator.querySelector('button');
    const progress = indicator.querySelector('.progress-bar');
    if (idx !== slideIndex) {
      button.removeAttribute('disabled');
      button.removeAttribute('aria-current');
      if (progress) progress.style.width = '0%';
    } else {
      button.setAttribute('disabled', true);
      button.setAttribute('aria-current', true);
      if (progress) progress.style.width = '0%';
    }
  });
}

function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.carousel-slide');
  let realSlideIndex = slideIndex < 0 ? slides.length - 1 : slideIndex;
  if (slideIndex >= slides.length) realSlideIndex = 0;
  const activeSlide = slides[realSlideIndex];

  activeSlide.querySelectorAll('a').forEach((link) => link.removeAttribute('tabindex'));
  block.querySelector('.carousel-slides').scrollTo({
    top: 0,
    left: activeSlide.offsetLeft,
    behavior: 'smooth',
  });
}

function updateProgress(block) {
  const startTime = parseInt(block.dataset.progressStartTime, 10);
  const currentTime = Date.now();
  const elapsed = currentTime - startTime;
  const progress = Math.min((elapsed / 15000) * 100, 100);
  
  const activeSlideIndex = parseInt(block.dataset.activeSlide, 10);
  const indicators = block.querySelectorAll('.carousel-slide-indicator');
  const activeIndicator = indicators[activeSlideIndex];
  
  if (activeIndicator) {
    const progressBar = activeIndicator.querySelector('.progress-bar');
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
  }
  
  if (progress < 100) {
    block.dataset.progressAnimationFrame = requestAnimationFrame(() => updateProgress(block));
  }
}

function startAutoAdvance(block) {
  // Reset progress start time
  block.dataset.progressStartTime = Date.now();
  
  // Start progress animation
  if (block.dataset.progressAnimationFrame) {
    cancelAnimationFrame(parseInt(block.dataset.progressAnimationFrame, 10));
  }
  updateProgress(block);
  
  const autoAdvanceInterval = setInterval(() => {
    const currentSlide = parseInt(block.dataset.activeSlide, 10);
    showSlide(block, currentSlide + 1);
    block.dataset.progressStartTime = Date.now();
    updateProgress(block);
  }, 15000);
  
  // Store the interval ID on the block for later cleanup if needed
  block.dataset.autoAdvanceInterval = autoAdvanceInterval;
}

function resetAutoAdvance(block) {
  // Clear existing interval
  if (block.dataset.autoAdvanceInterval) {
    clearInterval(parseInt(block.dataset.autoAdvanceInterval, 10));
  }
  // Cancel progress animation
  if (block.dataset.progressAnimationFrame) {
    cancelAnimationFrame(parseInt(block.dataset.progressAnimationFrame, 10));
  }
  // Start a new interval
  startAutoAdvance(block);
}

function bindEvents(block) {
  const slideIndicators = block.querySelector('.carousel-slide-indicators');
  if (!slideIndicators) return;

  slideIndicators.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', (e) => {
      const slideIndicator = e.currentTarget.parentElement;
      showSlide(block, parseInt(slideIndicator.dataset.targetSlide, 10));
      resetAutoAdvance(block);
    });
  });

  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) updateActiveSlide(entry.target);
    });
  }, { threshold: 0.5 });
  block.querySelectorAll('.carousel-slide').forEach((slide) => {
    slideObserver.observe(slide);
  });

  // Start auto-advance
  startAutoAdvance(block);
}

function convertVideoLinks(slide) {
  const videoLinks = slide.querySelectorAll('a[href$=".mp4"]');
  videoLinks.forEach((link) => {
    const videoUrl = link.getAttribute('href');
    const container = link.parentElement;
    
    // Check if there's a picture or img element in the container
    const picture = container.querySelector('picture');
    const img = container.querySelector('img');
    
    const loadVideo = () => {
      const video = document.createElement('video');
      
      // Set properties directly for better browser compatibility
      video.autoplay = true;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      
      // Also set attributes for HTML5 compliance
      video.setAttribute('autoplay', 'autoplay');
      video.setAttribute('muted', 'muted');
      video.setAttribute('loop', 'loop');
      video.setAttribute('playsinline', 'playsinline');
      
      // If there's an image, use it as poster and hide video initially
      if (img && img.src) {
        video.setAttribute('poster', img.src);
        video.style.opacity = '0';
        video.style.transition = 'opacity 0.3s ease-in-out';
      }
      
      const source = document.createElement('source');
      source.setAttribute('src', videoUrl);
      source.setAttribute('type', 'video/mp4');
      
      video.appendChild(source);
      
      // Add the video to the container (don't replace the link yet if there's an image)
      if (picture || img) {
        // Keep the picture/img visible, add video hidden
        container.appendChild(video);
        
        // When video is ready to play, fade it in and remove the image
        video.addEventListener('canplay', () => {
          video.style.opacity = '1';
          // Remove picture/img after fade-in completes
          setTimeout(() => {
            if (picture) picture.remove();
            if (img && !picture) img.remove();
            link.remove();
          }, 300);
        }, { once: true });
      } else {
        // No image, just replace the link
        container.replaceChild(video, link);
      }
      
      // Manually trigger play to ensure it starts
      video.play().catch((error) => {
        console.log('Video autoplay failed:', error);
      });
    };
    
    // If there's an image, wait for it to load before creating the video
    if (img) {
      if (img.complete) {
        // Image already loaded
        loadVideo();
      } else {
        // Wait for image to load
        img.addEventListener('load', loadVideo, { once: true });
        // Also handle error case
        img.addEventListener('error', loadVideo, { once: true });
      }
    } else {
      // No image, load video immediately
      loadVideo();
    }
  });
}

function createSlide(row, slideIndex, carouselId) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.setAttribute('id', `carousel-${carouselId}-slide-${slideIndex}`);
  slide.classList.add('carousel-slide');

  row.querySelectorAll(':scope > div').forEach((column, colIdx) => {
    column.classList.add(`carousel-slide-${colIdx === 0 ? 'image' : 'content'}`);
    slide.append(column);
  });

  // Convert mp4 links to video tags
  convertVideoLinks(slide);

  const labeledBy = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (labeledBy) {
    slide.setAttribute('aria-labelledby', labeledBy.getAttribute('id'));
  }

  return slide;
}

let carouselId = 0;
export default function decorate(block) {
  carouselId += 1;
  block.setAttribute('id', `carousel-${carouselId}`);
  const rows = block.querySelectorAll(':scope > div');
  const isSingleSlide = rows.length < 2;

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Carousel');

  const container = document.createElement('div');
  container.classList.add('carousel-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('carousel-slides');
  block.prepend(slidesWrapper);

  let slideIndicators;
  if (!isSingleSlide) {
    const slideIndicatorsNav = document.createElement('nav');
    slideIndicatorsNav.setAttribute('aria-label', 'Carousel Slide Controls');
    slideIndicators = document.createElement('ol');
    slideIndicators.classList.add('carousel-slide-indicators');
    slideIndicatorsNav.append(slideIndicators);
    block.append(slideIndicatorsNav);
  }

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx, carouselId);
    slidesWrapper.append(slide);

    if (slideIndicators) {
      const indicator = document.createElement('li');
      indicator.classList.add('carousel-slide-indicator');
      indicator.dataset.targetSlide = idx;
      indicator.innerHTML = `<button type="button" aria-label="Show Slide ${idx + 1} of ${rows.length}"><span class="progress-bar"></span></button>`;
      slideIndicators.append(indicator);
    }
    row.remove();
  });

  container.append(slidesWrapper);
  block.prepend(container);

  if (!isSingleSlide) {
    bindEvents(block);
  }
}
