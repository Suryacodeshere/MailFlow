const fs = require('fs');
let c = fs.readFileSync('frontend/src/components/ComposeModal.tsx', 'utf8');

c = c.replace('\\n              {csvCount', '\n              {csvCount');

fs.writeFileSync('frontend/src/components/ComposeModal.tsx', c);
