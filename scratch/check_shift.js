const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const part = content.split('const allTablesData = [')[2];
const tables = eval('[' + part.split('];')[0] + ']');

const shiftY = 150;
const r = 46;
const chairMargin = 16;
const totalR = r + chairMargin; // ~62px

console.log('--- GROOM TABLES (shiftY = 150) ---');
tables.filter(t => t.side === 'groom').forEach(t => {
  const newCy = t.cy - shiftY;
  console.log(`Bàn ${t.tableNo.toString().padStart(2)}: cx=${t.cx}, cy=${newCy} (top: ${newCy - totalR}, bottom: ${newCy + totalR})`);
});

console.log('\n--- BRIDE TABLES (shiftY = 150) ---');
tables.filter(t => t.side === 'bride').forEach(t => {
  const newCy = t.cy - shiftY;
  console.log(`Bàn ${t.tableNo.toString().padStart(2)}: cx=${t.cx}, cy=${newCy} (top: ${newCy - totalR}, bottom: ${newCy + totalR})`);
});
