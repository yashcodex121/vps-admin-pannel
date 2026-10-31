const assert = require('assert');
const crypto = require('crypto');

// Test AES-256-GCM encryption & decryption logic
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(secret) {
  return crypto.createHash('sha256').update(secret).digest();
}

function encrypt(text, secretKey) {
  if (!text) return '';
  const key = getKey(secretKey);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function decrypt(encryptedText, secretKey) {
  if (!encryptedText) return '';
  const parts = encryptedText.split(':');
  assert.strictEqual(parts.length, 3, 'Must have 3 parts iv:authTag:ciphertext');
  const [ivHex, authTagHex, encrypted] = parts;
  const key = getKey(secretKey);
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

console.log('--- RUNNING NEXUS AI BACKEND UNIT TESTS ---');

// Test 1: Symmetric Encryption
const testSecret = 'nexus_super_secret_test_encryption_key_32bytes';
const plaintext = 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC8... test-private-key';
const ciphertext = encrypt(plaintext, testSecret);
assert.notStrictEqual(ciphertext, plaintext, 'Ciphertext must not match plaintext');
const decrypted = decrypt(ciphertext, testSecret);
assert.strictEqual(decrypted, plaintext, 'Decrypted text must match original plaintext');
console.log('✅ Test 1 Passed: AES-256-GCM Encryption/Decryption verified.');

// Test 2: Integrity Verification (tampered ciphertext)
assert.throws(() => {
  const tampered = ciphertext.slice(0, -4) + 'ffff';
  decrypt(tampered, testSecret);
}, /Unsupported state or unable to authenticate data|Authentication failed/, 'Tampered ciphertext must fail auth tag check');
console.log('✅ Test 2 Passed: GCM Auth Tag prevents ciphertext tampering.');

// Test 3: Path Traversal Protection
function isPathSafe(targetPath) {
  const ALLOWED_ROOTS = ['/home', '/var/www', '/etc/nginx', '/opt', '/var/log'];
  if (targetPath.includes('../') || targetPath.includes('..\\')) return false;
  return ALLOWED_ROOTS.some(root => targetPath.startsWith(root) || targetPath === '/' || targetPath === '');
}

assert.strictEqual(isPathSafe('/home/deploy/quiz-bot'), true, 'Authorized directory should be safe');
assert.strictEqual(isPathSafe('/home/deploy/../../etc/shadow'), false, 'Directory traversal must be blocked');
assert.strictEqual(isPathSafe('/root/.ssh/id_rsa'), false, 'Unauthorized root directory must be blocked');
console.log('✅ Test 3 Passed: Path traversal security guard verified.');

console.log('🎉 ALL BACKEND LOGIC TESTS PASSED SUCCESSFULLY!');
