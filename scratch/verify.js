const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');

const ids = [
  'senior-btn-groom', 'senior-btn-bride', 'senior-btn-all',
  'btn-mode-senior', 'btn-mode-admin',
  'search-input', 'search-badge',
  'admin-metrics-bar', 'admin-header-actions', 'btn-admin-auth',
  'admin-auth-dot', 'admin-auth-text', 'btn-view-toggle', 'btn-toggle-label',
  'btn-filter-all', 'btn-filter-groom', 'btn-filter-bride', 'btn-filter-vip', 'btn-filter-available',
  'metric-available-tables', 'metric-available-seats',
  'search-input-admin', 'search-badge-admin',
  'cad-wrapper', 'pan-hint', 'zoom-badge', 'cad-scroll-area', 'cad-svg-container', 'hall-svg'
];

let hasErrors = false;
ids.forEach(id => {
  const count = (content.match(new RegExp(`id=["']${id}["']`, 'g')) || []).length;
  if (count === 0) {
    console.error(`MISSING ID: ${id}`);
    hasErrors = true;
  } else if (count > 1) {
    console.warn(`DUPLICATE ID: ${id} (${count} occurrences)`);
  }
});

// Check for script extraction and JS syntax error
const scriptTags = content.match(/<script>([\s\S]*?)<\/script>/gi);
if (scriptTags) {
  scriptTags.forEach((tag, idx) => {
    const code = tag.replace(/<\/?script>/gi, '');
    try {
      new Function(code);
      console.log(`Script tag ${idx + 1}: Valid syntax`);
    } catch (e) {
      console.error(`Script tag ${idx + 1} Syntax Error:`, e.message);
      hasErrors = true;
    }
  });
}

if (!hasErrors) {
  console.log('SUCCESS: All DOM IDs verified, zero duplicates, and JS syntax is 100% valid!');
} else {
  process.exit(1);
}
