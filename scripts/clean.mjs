import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const targets = ['dist', '.archicat', 'tests/.tmp'];

for (const target of targets) {
  fs.rmSync(path.join(root, target), { recursive: true, force: true });
}

for (const entry of fs.readdirSync(path.join(root, 'packages'), { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  fs.rmSync(path.join(root, 'packages', entry.name, 'dist'), { recursive: true, force: true });
}
