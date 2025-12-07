function groupContent(col) {
  const children = [...col.children];
  
  // Find key elements
  const h3 = col.querySelector('h3, h2');
  
  // If no h3, skip grouping for this column (might be image-only)
  if (!h3) return;
  
  // Create wrapper divs
  const eyebrowDiv = document.createElement('div');
  eyebrowDiv.classList.add('booking-eyebrow');
  
  const headingDiv = document.createElement('div');
  headingDiv.classList.add('booking-heading');
  
  const metaDiv = document.createElement('div');
  metaDiv.classList.add('booking-meta');
  
  const descriptionDiv = document.createElement('div');
  descriptionDiv.classList.add('booking-description');
  
  const descriptionContent = document.createElement('div');
  descriptionContent.classList.add('booking-description-content');
  
  const ctaDiv = document.createElement('div');
  ctaDiv.classList.add('booking-cta');
  
  // Track h3 position to identify what comes before/after
  const h3Index = children.indexOf(h3);
  
  let metaFound = false;
  
  children.forEach((child, index) => {
    // Eyebrow: paragraphs before h3
    if (index < h3Index && child.tagName === 'P') {
      eyebrowDiv.appendChild(child.cloneNode(true));
      child.remove();
    }
    // Heading: the h3 itself
    else if (child.tagName === 'H3' || child.tagName === 'H2') {
      headingDiv.appendChild(child.cloneNode(true));
      child.remove();
    }
    // CTA: button containers or links with button class
    else if (child.classList.contains('button-container') || 
             (child.tagName === 'A' && child.classList.contains('button'))) {
      ctaDiv.appendChild(child.cloneNode(true));
      child.remove();
    }
    // First paragraph after h3 is meta (time/price)
    else if (index > h3Index && child.tagName === 'P' && !metaFound) {
      metaDiv.appendChild(child.cloneNode(true));
      child.remove();
      metaFound = true;
    }
    // Remaining paragraphs are description
    else if (child.tagName === 'P') {
      descriptionContent.appendChild(child.cloneNode(true));
      child.remove();
    }
  });
  
  // Clear remaining empty nodes
  while (col.firstChild) {
    col.removeChild(col.firstChild);
  }
  
  // Add see more button if description has content
  if (descriptionContent.children.length) {
    descriptionDiv.appendChild(descriptionContent);
    
    const seeMoreBtn = document.createElement('button');
    seeMoreBtn.classList.add('booking-see-more');
    seeMoreBtn.setAttribute('aria-expanded', 'false');
    seeMoreBtn.setAttribute('aria-label', 'Show more');
    
    seeMoreBtn.addEventListener('click', () => {
      const isExpanded = descriptionContent.classList.toggle('expanded');
      seeMoreBtn.setAttribute('aria-expanded', isExpanded);
      seeMoreBtn.setAttribute('aria-label', isExpanded ? 'Show less' : 'Show more');
    });
    
    descriptionDiv.appendChild(seeMoreBtn);
  }
  
  // Append grouped divs in order (only if they have content)
  if (eyebrowDiv.children.length) col.appendChild(eyebrowDiv);
  if (headingDiv.children.length) col.appendChild(headingDiv);
  if (metaDiv.children.length) col.appendChild(metaDiv);
  if (descriptionDiv.children.length) col.appendChild(descriptionDiv);
  if (ctaDiv.children.length) col.appendChild(ctaDiv);
}

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`booking-${cols.length}-cols`);

  // setup image columns and group content
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('booking-img-col');
        }
      } else {
        // Group content in non-image columns
        groupContent(col);
      }
    });
  });
}

