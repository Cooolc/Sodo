const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const scripts = html.match(/<script[\s\S]*?<\/script>/gi) || [];
for (const s of scripts) {
  if (s.includes('const allTablesData = [')) {
    let code = s.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
    code = code.replace('const allTablesData = [', 'globalThis.allTablesData = [');
    const vm = require('vm');
    const sandbox = { 
      console, 
      window: {}, 
      document: { getElementById: () => null, addEventListener: () => {} }, 
      localStorage: { getItem: () => null, setItem: () => {} },
      sessionStorage: { getItem: () => null, setItem: () => {} }
    };
    sandbox.globalThis = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);
    console.log('Tables in script:', sandbox.allTablesData.length);
    sandbox.allTablesData.forEach(t => {
      console.log(`${t.id.padEnd(5)} | ${t.side.padEnd(6)} | No: ${String(t.tableNo).padEnd(2)} | Cat: ${t.displayCategory.padEnd(12)} | Group: ${(t.groupName || '').padEnd(28)} | Color: ${t.customColor}`);
    });
    break;
  }
}

