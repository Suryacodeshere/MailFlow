const fs = require('fs');
let c = fs.readFileSync('frontend/src/components/ComposeModal.tsx', 'utf8');

c = c.replace('const [imagePreview, setImagePreview] = useState<string | null>(null);', 
  'const [imagePreview, setImagePreview] = useState<string | null>(null);\n  const [error, setError] = useState<string | null>(null);\n  const [csvCount, setCsvCount] = useState<number | null>(null);');

c = c.replace('setTo([...to, ...emails]);', 
  'setTo([...to, ...emails]);\n          setCsvCount(emails.length);');

c = c.replace('} catch (error) {\\n      console.error(error);\\n      alert(\\\'Failed to schedule emails\\\');', 
  '} catch (err) {\n      console.error(err);\n      setError(\\\'Failed to schedule emails. Please check your inputs.\\\');');

c = c.replace('<div className="bg-white w-full max-w-[950px] h-[90vh] max-h-[750px] rounded-2xl shadow-2xl flex flex-col relative overflow-hidden">', 
  '<div className="bg-white w-full max-w-[950px] h-[90vh] max-h-[750px] rounded-2xl shadow-2xl flex flex-col relative overflow-hidden">\n        {error && <div className="bg-red-50 text-red-600 p-3 text-sm font-medium border-b border-red-100 flex justify-between items-center"><span>{error}</span><button onClick={() => setError(null)}><X size={16}/></button></div>}');

c = c.replace('<input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />\\n            </div>', 
  '<input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />\n            </div>\n            {csvCount !== null && <div className="text-xs text-green-600 font-medium pb-2 -mt-2 absolute right-0 top-10">{csvCount} email addresses detected</div>}');

fs.writeFileSync('frontend/src/components/ComposeModal.tsx', c);
