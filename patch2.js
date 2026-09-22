const fs = require('fs');
let c = fs.readFileSync('frontend/src/components/ComposeModal.tsx', 'utf8');

c = c.replace('className="hidden" ref={fileInputRef} onChange={handleFileUpload} />', 
  'className="hidden" ref={fileInputRef} onChange={handleFileUpload} />\\n              {csvCount !== null && <div className="text-xs text-green-600 font-medium absolute right-0 top-8 mt-1">{csvCount} email addresses detected</div>}');

fs.writeFileSync('frontend/src/components/ComposeModal.tsx', c);
