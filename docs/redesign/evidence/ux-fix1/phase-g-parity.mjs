import fs from 'node:fs';
import {generateSnapshot,extractParity} from '/home/alucard/Documents/CNCF/cncf-peshawar.github.io-main/docs/redesign/tools/parity.mjs';
const routes=['/','/events/','/events/01-cncf-peshawar-genesis/','/events/02-the-cloud-native-launchpad-docker-kubernetes-real-deployments/','/speak/','/sponsors/','/team/','/blog/','/blog/announcing-cncf-peshawar/','/code-of-conduct/'];
const built=generateSnapshot('dist',routes);const results=[];
for(const route of routes){const r=await fetch('http://127.0.0.1:4322'+route);const html=await r.text();const live=extractParity(html,route);const build=built[route];const same=!!build&&JSON.stringify(live)===JSON.stringify(build);results.push({route,status:r.status,parity:same,title:live.title,headingCount:live.headings.length});}
const summary={totalRoutesScanned:results.length,successful:results.filter(r=>r.status===200&&r.parity).length,failures:results.filter(r=>r.status!==200||!r.parity).length,exitCode:results.every(r=>r.status===200&&r.parity)?0:1,results};
fs.writeFileSync('docs/redesign/evidence/ux-fix1/phase-g-parity.json',JSON.stringify(summary,null,2));console.log(JSON.stringify(summary));process.exitCode=summary.exitCode;
