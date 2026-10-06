const fs = require('fs');

// Test using pure JS evaluation of the file logic
const content = fs.readFileSync('index.html', 'utf8');

// Extract script 2 where the logic lives
const match = content.match(/<script>([\s\S]*?)<\/script>[\s\S]*?<script>([\s\S]*?)<\/script>/i);
if (!match || !match[2]) {
  console.error("Could not find second script tag");
  process.exit(1);
}

// Mock window and document
const mockDocument = {
  getElementById: (id) => {
    return {
      id: id,
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false
      },
      style: {},
      setAttribute: () => {},
      addEventListener: () => {}
    };
  },
  body: {
    classList: {
      add: () => {},
      remove: () => {}
    }
  }
};

global.window = {
  innerWidth: 390, // Mobile width (iPhone)
  addEventListener: () => {},
  _hasDraggedMap: false
};
global.document = mockDocument;
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

let openedModalTableId = null;
global.openMobileModal = (id) => {
  openedModalTableId = id;
};

// Check if openMobileModal is called inside handleSearch
const handleSearchSrc = content.substring(content.indexOf('function handleSearch('), content.indexOf('function setListViewFilter('));
console.log("handleSearch function preview:\n", handleSearchSrc);

if (handleSearchSrc.includes('openMobileModal(')) {
  console.log("Checking if openMobileModal is called in handleSearch...");
  // It should only be closeMobileModal(), not openMobileModal
  const calls = handleSearchSrc.match(/\bopenMobileModal\s*\(/g);
  if (calls && calls.length > 0) {
    console.error("FAIL: handleSearch still calls openMobileModal directly!");
    process.exit(1);
  }
}

if (!handleSearchSrc.includes('closeMobileModal()')) {
  console.error("FAIL: handleSearch should close any previously opened modal so map is visible!");
  process.exit(1);
}

// Verify removeAccents
const removeAccentsMatch = content.match(/function removeAccents[\s\S]*?}/);
if (removeAccentsMatch) {
  const fn = new Function(removeAccentsMatch[0] + "; return removeAccents;");
  const removeAccents = fn();
  console.log("Testing removeAccents:");
  console.log("  'Nguyễn Văn Kiệt' ->", removeAccents('Nguyễn Văn Kiệt'));
  if (removeAccents('Nguyễn Văn Kiệt') !== 'Nguyen Van Kiet') {
    console.error("FAIL: removeAccents failed");
    process.exit(1);
  }
}

// Verify matchQuery
const matchQueryMatch = content.match(/function matchQuery[\s\S]*?}/);
if (matchQueryMatch) {
  const fn = new Function(removeAccentsMatch[0] + ";" + matchQueryMatch[0] + "; return matchQuery;");
  const matchQuery = fn();
  console.log("Testing matchQuery:");
  console.log("  'Kiệt' matches 'kiet':", matchQuery('Kiệt', 'kiet'));
  console.log("  'Bác Ba' matches 'ba':", matchQuery('Bác Ba', 'ba'));
  console.log("  'Bác Ba' matches 'bác':", matchQuery('Bác Ba', 'bác'));
  if (!matchQuery('Kiệt', 'kiet') || !matchQuery('Bác Ba', 'ba')) {
    console.error("FAIL: matchQuery failed");
    process.exit(1);
  }
}

console.log("\nALL SEARCH & MOBILE INTERACTION TESTS PASSED!");
