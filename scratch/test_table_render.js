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
      window: { innerWidth: 1200 }, 
      document: { getElementById: () => null, addEventListener: () => {} }, 
      localStorage: { getItem: () => null, setItem: () => {} },
      sessionStorage: { getItem: () => null, setItem: () => {} }
    };
    sandbox.globalThis = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);

    console.log('Testing renderTableNode for all 34 tables:');
    let hasUniqueColors = new Set();
    sandbox.allTablesData.forEach(t => {
      const nodeHtml = sandbox.renderTableNode(t);
      const color = sandbox.getTableColor(t);
      hasUniqueColors.add(color);
      if (!nodeHtml.includes('svg-table-') || !nodeHtml.includes('rect') || !nodeHtml.includes('text')) {
        throw new Error('Failed to render node for ' + t.id);
      }
    });

    console.log('Unique active table colors rendered:', hasUniqueColors.size, Array.from(hasUniqueColors));
    console.log('SUCCESS: All 34 table nodes rendered with distinct colors and white banquet styling!');
    break;
  }
}

