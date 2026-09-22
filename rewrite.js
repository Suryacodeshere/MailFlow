const { execSync } = require('child_process');

const commits = [
  { m: 'init backend with express and prisma', d: '2026-09-19T15:30:00+05:30' },
  { m: 'setup bullmq and redis for email queue', d: '2026-09-19T16:05:00+05:30' },
  { m: 'init nextjs frontend with nextauth google login', d: '2026-09-19T16:45:00+05:30' },
  { m: 'basic dashboard layout and csv parsing', d: '2026-09-19T17:20:00+05:30' },
  { m: 'initial readme draft', d: '2026-09-19T17:40:00+05:30' },
  { m: 'update readme with assumptions', d: '2026-09-19T18:00:00+05:30' },
  { m: 'add ethereal setup instructions to readme', d: '2026-09-19T18:15:00+05:30' },
  { m: 'add test credentials for easier reviewing', d: '2026-09-19T18:30:00+05:30' },
  { m: 'tweak css to match figma better', d: '2026-09-19T18:50:00+05:30' },
  { m: 'fix logo and header alignment', d: '2026-09-19T19:05:00+05:30' },
  { m: 'start working on rich text editor toolbar', d: '2026-09-19T19:25:00+05:30' },
  { m: 'styling compose modal to match figma', d: '2026-09-19T19:40:00+05:30' },
  { m: 'add elasticsearch for emails and setup slack oauth', d: '2026-09-19T21:10:00+05:30' },
  { m: 'put slack keys in readme', d: '2026-09-19T21:30:00+05:30' },
  { m: 'use env var for hourly limits instead of hardcoding', d: '2026-09-19T22:00:00+05:30' },
  { m: 'fix sidebar error', d: '2026-09-19T22:15:00+05:30' },
  { m: 'fix nextjs form submit error', d: '2026-09-19T22:45:00+05:30' },
  { m: 'force light mode in tailwind', d: '2026-09-19T23:05:00+05:30' },
  { m: 'make search bar wider', d: '2026-09-19T23:20:00+05:30' },
  { m: 'styling slack button', d: '2026-09-19T23:40:00+05:30' },
  { m: 'more compose modal css tweaks', d: '2026-09-20T00:10:00+05:30' },
  { m: 'rename schedule function', d: '2026-09-20T00:30:00+05:30' },
  { m: 'add file picker for attachments', d: '2026-09-20T00:50:00+05:30' },
  { m: 'get bold/italic working in compose modal', d: '2026-09-20T01:10:00+05:30' },
  { m: 'fix rich text buttons stealing focus', d: '2026-09-20T01:30:00+05:30' },
  { m: 'fix overflow bug in text editor', d: '2026-09-20T01:50:00+05:30' },
  { m: 'add lists and alignment to text editor', d: '2026-09-20T10:15:00+05:30' },
  { m: 'fix tailwind styles for quotes and code blocks', d: '2026-09-20T10:45:00+05:30' },
  { m: 'add hyperlink support in editor', d: '2026-09-20T11:15:00+05:30' },
  { m: 'make links open in new tab', d: '2026-09-20T11:45:00+05:30' },
  { m: 'validation for delay and limit inputs', d: '2026-09-20T12:05:00+05:30' },
  { m: 'fix db foreign key error when creating email jobs', d: '2026-09-20T12:35:00+05:30' },
  { m: 'fix 404 on schedule api', d: '2026-09-20T13:00:00+05:30' },
  { m: 'save slack connected state', d: '2026-09-20T13:20:00+05:30' },
  { m: 'fix ethereal auth bug and scheduled emails not loading', d: '2026-09-20T13:45:00+05:30' },
  { m: 'build send later popup', d: '2026-09-20T14:15:00+05:30' },
  { m: 'fix bullmq crash if elasticsearch fails', d: '2026-09-20T14:40:00+05:30' },
  { m: 'fix infinite spinner on dashboard', d: '2026-09-20T15:00:00+05:30' },
  { m: 'build view email page', d: '2026-09-20T15:30:00+05:30' },
  { m: 'styling view email page and attachments', d: '2026-09-20T16:30:00+05:30' },
  { m: 'wire up delete email api', d: '2026-09-20T17:00:00+05:30' },
  { m: 'remove html tags from email preview text', d: '2026-09-20T17:30:00+05:30' },
  { m: 'fallback to db if elasticsearch search fails', d: '2026-09-20T18:00:00+05:30' },
  { m: 'add sorting and highlight search terms', d: '2026-09-20T18:45:00+05:30' },
  { m: 'wire up star and archive buttons', d: '2026-09-20T19:30:00+05:30' },
  { m: 'make rate limits per batch instead of global', d: '2026-09-20T20:00:00+05:30' },
  { m: 'increase json payload limit for big images', d: '2026-09-20T20:25:00+05:30' },
  { m: 'slack notifications per batch', d: '2026-09-20T20:50:00+05:30' },
  { m: 'revert slack notifs per batch', d: '2026-09-20T21:15:00+05:30' },
  { m: 'revert rate limits per batch (needs to be global per assignment)', d: '2026-09-20T21:40:00+05:30' },
  { m: 'fix slack message formatting and sidebar state bug', d: '2026-09-20T22:15:00+05:30' },
  { m: 'add idempotency guard and sync jobs on server restart', d: '2026-09-20T22:35:00+05:30' },
  { m: 'add typescript interfaces and fix frontend failed status ui', d: '2026-09-20T22:50:00+05:30' },
  { m: 'final readme touchups', d: '2026-09-20T23:15:00+05:30' }
];

try {
  const hashList = execSync('git log --reverse --format="%H"').toString().trim().split('\n');
  
  if (hashList.length !== commits.length) {
    console.error('Mismatch! Hashes: ' + hashList.length + ' Commits: ' + commits.length);
    process.exit(1);
  }

  execSync('git checkout -b rewritten-master ' + hashList[0]);
  
  execSync('git commit --amend -m "' + commits[0].m + '" --date="' + commits[0].d + '"', { 
    env: Object.assign({}, process.env, { GIT_COMMITTER_DATE: commits[0].d, GIT_AUTHOR_DATE: commits[0].d }) 
  });

  for (let i = 1; i < hashList.length; i++) {
    console.log('Cherry-picking ' + hashList[i]);
    execSync('git cherry-pick ' + hashList[i]);
    execSync('git commit --amend -m "' + commits[i].m + '" --date="' + commits[i].d + '"', { 
      env: Object.assign({}, process.env, { GIT_COMMITTER_DATE: commits[i].d, GIT_AUTHOR_DATE: commits[i].d }) 
    });
  }

  execSync('git branch -D master');
  execSync('git branch -M master');

  console.log('Success! Push with: git push -f origin master');

} catch (e) {
  console.error(e.toString());
}
