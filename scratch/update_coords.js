const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');

// Replace cy: <value> with cy: <value - 150> for all 34 tables
const shiftY = 150;

content = content.replace(/cx:\s*(\d+),\s*cy:\s*(\d+)/g, (match, cx, cy) => {
  const newCy = parseInt(cy, 10) - shiftY;
  return `cx: ${cx}, cy: ${newCy}`;
});

fs.writeFileSync('index.html', content, 'utf8');
console.log('Successfully updated table cy coordinates with -150px shift!');
