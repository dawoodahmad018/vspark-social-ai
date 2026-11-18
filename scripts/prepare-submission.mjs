// Export only committed source to a new temporary unzipped folder; never overwrite.
import { execFileSync } from 'node:child_process';
import { copyFileSync, lstatSync, mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
const root = execFileSync('git',['rev-parse','--show-toplevel'],{encoding:'utf8'}).trim();
if (execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim()) throw new Error('Commit/review source changes before preparing submission. Ignored env files stay excluded.');
const files = execFileSync('git',['ls-tree','-r','--name-only','-z','HEAD'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
for (const file of files) {
  if ((file.split('/').some(part => part.startsWith('.env') && part !== '.env.example')) || /\.(pem|key)$/i.test(file) || /firebase-adminsdk|service-account.*\.json/i.test(file)) throw new Error(`Unsafe submission file: ${file}`);
  if (!lstatSync(join(root,file)).isFile()) throw new Error(`Non-regular submission file: ${file}`);
}
const folder = join(mkdtempSync(join(tmpdir(),'vspark-submission-')),'vspark-social-ai');
mkdirSync(folder);
for (const file of files) {
  const target = resolve(folder,file);
  if (!target.startsWith(folder+sep)) throw new Error('Unsafe export path');
  mkdirSync(dirname(target),{recursive:true}); copyFileSync(join(root,file),target);
}
console.log(`Prepared ${files.length} committed source files, unzipped, without ignored secrets/dependencies/build output.`);
console.log(`Upload this folder to the organizer destination: ${folder}`);
console.log('This is a local export; no organizer upload or cloud submission has occurred.');
