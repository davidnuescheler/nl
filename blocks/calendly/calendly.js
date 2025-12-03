import { loadScript } from '../../scripts/aem.js';

export default async function decorate (block) {
  const calendlyUrl = block.textContent.trim();
  block.textContent = '';
  const calendlyWidget = document.createElement('div');
  calendlyWidget.classList.add('calendly-widget');
  calendlyWidget.innerHTML = `
    <div class="calendly-inline-widget" data-url="${calendlyUrl}" style="min-width:320px;height:700px;"></div>
  `;
  block.append(calendlyWidget);
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        loadScript('https://assets.calendly.com/assets/external/widget.js');
      }
    });
  });
  io.observe(block);
}