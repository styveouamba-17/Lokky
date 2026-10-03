import { exportPKCS8, generateKeyPair } from 'jose';

// Génère la clé privée de signature des jetons d'accès (Ed25519), à mettre dans
// JWT_PRIVATE_KEY (.env en local, secret du serveur en production). Jamais commitée.
const { privateKey } = await generateKeyPair('EdDSA', { crv: 'Ed25519', extractable: true });
const pem = await exportPKCS8(privateKey);
console.log(`JWT_PRIVATE_KEY="${pem.replace(/\n/g, '\n')}"`);
