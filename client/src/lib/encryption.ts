function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function decryptData(encryptedData: string, key: string): Promise<ArrayBuffer> {
  const [ivHex, dataHex, tagHex] = encryptedData.split(':');
  
  const iv = hexToBytes(ivHex);
  const data = hexToBytes(dataHex);
  const tag = hexToBytes(tagHex);
  const keyBytes = hexToBytes(key);

  const algorithm = {
    name: 'AES-GCM',
    iv: iv,
    tagLength: 128
  };

  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyBytes,
    algorithm,
    false,
    ['decrypt']
  );

  const decrypted = await window.crypto.subtle.decrypt(
    algorithm,
    cryptoKey,
    new Uint8Array([...data, ...tag])
  );

  return decrypted;
}
