const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'tests');

const mappings = [
    { file: 'auth.controller.unit.test.js', dest: 'unit/controllers/auth.controller.test.js', depth: 3 },
    { file: 'task.controller.unit.test.js', dest: 'unit/controllers/task.controller.test.js', depth: 3 },
    { file: 'order.service.unit.test.js', dest: 'unit/services/order.service.test.js', depth: 3 },
    { file: 'task.service.unit.test.js', dest: 'unit/services/task.service.test.js', depth: 3 },
    { file: 'task.model.unit.test.js', dest: 'unit/models/task.model.test.js', depth: 3 },
    { file: 'model.test.js', dest: 'integration/model.test.js', depth: 2 },
    { file: 'auth.middleware.unit.test.js', dest: 'unit/middlewares/auth.middleware.test.js', depth: 3 },
    { file: 'validate.middleware.unit.test.js', dest: 'unit/middlewares/validate.middleware.test.js', depth: 3 },
    { file: 'utils.test.js', dest: 'unit/utils/utils.test.js', depth: 3 },
    { file: 'errors.test.js', dest: 'unit/utils/errors.test.js', depth: 3 },
    { file: 'edge_cases.test.js', dest: 'unit/utils/edge_cases.test.js', depth: 3 }, // or integration
    { file: 'health.test.js', dest: 'integration/health.test.js', depth: 2 },
    { file: 'auth.test.js', dest: 'integration/auth.test.js', depth: 2 },
    { file: 'auth.flow.test.js', dest: 'integration/auth.flow.test.js', depth: 2 },
    { file: 'task.test.js', dest: 'integration/task.test.js', depth: 2 },
    { file: 'order.test.js', dest: 'integration/order.test.js', depth: 2 },
    { file: 'security.test.js', dest: 'integration/security.test.js', depth: 2 },
];

mappings.forEach(m => {
    const oldPath = path.join(srcDir, m.file);
    if (!fs.existsSync(oldPath)) return;
    const newPath = path.join(srcDir, m.dest);
    
    fs.mkdirSync(path.dirname(newPath), { recursive: true });
    
    let content = fs.readFileSync(oldPath, 'utf8');
    
    if (m.depth === 2) {
        content = content.replace(/require\(['"]\.\.\/src/g, "require('../../src");
        content = content.replace(/require\(['"]\.\.\/utils/g, "require('../../utils");
    } else if (m.depth === 3) {
        content = content.replace(/require\(['"]\.\.\/src/g, "require('../../../src");
        content = content.replace(/require\(['"]\.\.\/utils/g, "require('../../../utils");
    }

    fs.writeFileSync(newPath, content);
    fs.unlinkSync(oldPath);
});

console.log('Moved files and updated requires.');
