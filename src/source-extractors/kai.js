class RFunction {
  constructor(userAgent = '', cookie = '') {
    this.userAgent = userAgent;
    this.cookie = cookie;
  }

  // --- helpers ---
  atobNode(b64) {
    return Buffer.from(b64, 'base64').toString('binary');
  }
  toByteArray(binStr) {
    return Array.from(binStr, c => c.charCodeAt(0) & 0xff);
  }
  fromByteArray(bytes) {
    return String.fromCharCode(...bytes);
  }

  // transforms
  f(a) {
    return (108 ^ a) & 0xff;
  }
  k(a) {
    return ((a << 1) | (a >>> 7)) & 0xff;
  }
  i(a) {
    return (a + 183) % 256;
  }
  w(a) {
    return ((a >>> 5) | (a << 3)) & 0xff;
  }
  Y(a) {
    return (a + 128) % 256;
  }
  B(a) {
    return (121 ^ a) & 0xff;
  }
  W(a) {
    return (a - 74 + 256) % 256;
  }
  _(a) {
    return ((a >>> 2) | (a << 6)) & 0xff;
  }
  A(a) {
    return ((a >>> 4) | (a << 4)) & 0xff;
  }
  O(a) {
    return (46 ^ a) & 0xff;
  }
  b(a) {
    return ((a >>> 2) | (a << 6)) & 0xff;
  }
  v(a) {
    return (33 ^ a) & 0xff;
  }

  // RC4 string<->string
  rc4String(keyStr, dataStr) {
    const key = this.toByteArray(keyStr);
    const data = this.toByteArray(dataStr);
    const S = Array.from({ length: 256 }, (_, i) => i);
    let j = 0;
    for (let i = 0; i < 256; i++) {
      j = (j + S[i] + key[i % key.length]) & 0xff;
      [S[i], S[j]] = [S[j], S[i]];
    }
    const out = new Array(data.length);
    let i = 0;
    j = 0;
    for (let k = 0; k < data.length; k++) {
      i = (i + 1) & 0xff;
      j = (j + S[i]) & 0xff;
      [S[i], S[j]] = [S[j], S[i]];
      const K = S[(S[i] + S[j]) & 0xff];
      out[k] = data[k] ^ K;
    }
    return this.fromByteArray(out);
  }

  // c5: URL-safe base64 decode
  c5(input) {
    let s = input.replace(/-/g, '+').replace(/_/g, '/');
    const pad = (4 - (s.length % 4)) % 4;
    if (pad) s += '='.repeat(pad);
    return this.atobNode(s);
  }

  // env normalization
  normalize_h(ua) {
    if (!ua) return '';
    return ua.replace(/[^0-9A-Za-z]/g, '').slice(-30);
  }
  normalize_X(ua) {
    if (!ua) return '';
    return ua.replace(/[^0-9A-Za-z]/g, '').slice(0, 20);
  }

  // env key mixing
  keyBytesFromB64(baseB64) {
    const base = this.atobNode(baseB64);
    let bytes = this.toByteArray(base);
    const ua = this.userAgent || '';
    const ck = this.cookie || '';
    if (!ua && !ck) return bytes;

    const h = this.normalize_h(ua);
    const Xs = this.normalize_X(ua);
    const envStr = h + Xs + ck;
    if (!envStr) return bytes;
    const envBytes = this.toByteArray(envStr);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] ^= envBytes[i % envBytes.length];
    }
    return bytes;
  }

  // base64 constants
  get CONST() {
    return {
      Q5: 'saLcir+c7RBVNu0XfdrxLvVwm03bb+4uAzUkEzERgqg=',
      e5: 'JApvCbx8Lchtl3W/rM7MeGBMT58ZnWJQqlpd9I57dBI=',
      p: 'vDR59rdropmqaV35iiuGYaz/Uqpz0n6HWHzA44XBG2g=',
      n5: 'EPRudCj7Av+hrFC+M2XW/kxTtOKstRjbjuuuaCDCGgA=',
      k5: 'VkY0c6BagMbL2PQ9H2bN4ZAJ7o5GM2Cw8XdyMW6vBoQ=',
      V: 'WNljI8hwiA7Kn3L8dm24lq+wPTf7bCifukRMoExX+ec=',
      p5: '1/iQzGPJYbVzOeB8zVhq85x+yjbRNv0rhx5f4H67NDo=',
      s5: 'IlzjBXADlt34741PFw1xUpg/6SRJevXIrd4aUvc3eU8=',
      r5: 'GKP/D2XHdOs6dV4FSUyJgQr6JDquqW2thSxXCC+HBS8=',
      x5: 'uJ38lDX9jZpUtGCc5BlsBA4WyqN1UI3FCPc+WMpbyLY=',
    };
  }

  // key getters
  Q5() {
    return this.keyBytesFromB64(this.CONST.Q5);
  }
  k5() {
    return this.keyBytesFromB64(this.CONST.k5);
  }
  p5() {
    return this.keyBytesFromB64(this.CONST.p5);
  }
  r5() {
    return this.keyBytesFromB64(this.CONST.r5);
  }
  p() {
    return this.keyBytesFromB64(this.CONST.p);
  }

  e5() {
    return this.atobNode(this.CONST.e5);
  }
  n5() {
    return this.atobNode(this.CONST.n5);
  }
  V() {
    return this.atobNode(this.CONST.V);
  }
  s5() {
    return this.atobNode(this.CONST.s5);
  }
  x5() {
    return this.atobNode(this.CONST.x5);
  }

  // apply transforms
  applyTransformations(dataBytes, keyBytes, transforms) {
    return dataBytes.map((b, i) => {
      const tfn = this[transforms[i % transforms.length]];
      const v = tfn ? tfn(b) : b;
      return (v ^ keyBytes[i % keyBytes.length]) & 0xff;
    });
  }

  // pipeline (r(a))
  decrypt(encrypted) {
    // step 1: c5
    let bin = this.c5(encrypted);
    let bytes = this.toByteArray(bin);

    // step 2: o5 with Q5
    bytes = this.applyTransformations(bytes, this.Q5(), ['i', 'k', 'b', 'i', 'v', 'B', 'W', '_', 'B', 'w']);

    // step 3: t5 RC4 with e5
    let s = this.rc4String(this.e5(), this.fromByteArray(bytes));
    bytes = this.toByteArray(s);

    // step 4: h5 with p
    bytes = this.applyTransformations(bytes, this.p(), ['_', 'b', '_', 'Y', 'A', 'f', 'Y', 'A', 'i', 'w']);

    // step 5: a5 RC4 with n5
    s = this.rc4String(this.n5(), this.fromByteArray(bytes));
    bytes = this.toByteArray(s);

    // step 6: v5 with k5
    bytes = this.applyTransformations(bytes, this.k5(), ['Y', 'W', 'f', 'O', 'b', 'v', 'k', 'W', 'A', 'v']);

    // step 7: I RC4 with V
    s = this.rc4String(this.V(), this.fromByteArray(bytes));
    bytes = this.toByteArray(s);

    // step 8: Z5 with p5
    bytes = this.applyTransformations(bytes, this.p5(), ['Y', 'A', 'f', 'i', 'W', 'B', '_', 'B', 'i', 'w']);

    // step 9: X5 RC4 with s5
    s = this.rc4String(this.s5(), this.fromByteArray(bytes));
    bytes = this.toByteArray(s);

    // step 10: d with r5
    bytes = this.applyTransformations(bytes, this.r5(), ['f', 'k', 'i', 'w', 'W', 'i', 'w', 'Y', 'B', '_']);

    // step 11: z RC4 with x5
    s = this.rc4String(this.x5(), this.fromByteArray(bytes));
    bytes = this.toByteArray(s);

    // step 12: final string + decodeURIComponent
    const finalStr = this.fromByteArray(bytes);
    try {
      return decodeURIComponent(finalStr);
    } catch {
      return finalStr;
    }
  }
}
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const COOKIE =
  '1052=3ih67; cf_clearance=PCbHJ6fitL9vjg4SelWeQG0j5zynjn3KDGeAaB023Fo-1758376586-1.2.1.1-iZEH5beYPIYIIDmu0k5afjdK9ZrSfnXRj4B8NY1ugdsK3Jw3cTaZQ1_qrPsk_oBmLzVOOibpFsONNMfJ_2zeCIDhBwCSmBGGXlPlbfg.dXQJu9_A0T_KpZH2boCoW6XwlgaHgOuXfkB62vybGXIw5UoGMCu1iCZmWC36X9ZIQ5keQk4URY5VNHVPeej6ZsXERDLYf8qdvvwq78X2606TVThEPTKF7Tm6jv.73RNeGxs';

const megaup = new RFunction(UA, COOKIE);

const data = megaup.decrypt(
  'mX9fqb1aVnliQkSv7zVUutPMu0aFtytJG1GZnmeSle_6O_vpvEAbt3oIkNvNWPRpaxCtURiif1BdhbPqEsU0DMpmVgAF_NvQqCw9G3UhSoR96F4-ausDyO_SDVBxgn3sfUjIMKFk3NrFhiIHELaO5uVSRphrM-H_G8QlT5dv0IDtWASqYLlKJ4Jr7qMZPpp82Mv5U4Mj_RiRDQECrjA_N9PIaeuUBXWJgKH72vUC1MrEP8zohvBX_oMy1tuXuUNNjk2U0KlPf7s8LgfMnQQn0CCqAtK21EmrSTprXAxiYhiLsC5bZBHcRqKoj7iFdvmDxrcxl7RqeRz0kpWil_siV_I0ClSYnx7Nvefu6bSZAsGlfeh5iTI6YFy_Yb7ds9Xzx0e_73agsgU5CCe4TPcdZQPnBX3MAz47EormIiPVxfcG945OdBa1BtC8Mvkf0Ncwxg6j60FVFK8nLI2GjH5EO3IFoQwf9qsubxH1epy-TiiupeEUr5vMbt2_oKj3sMF8IA-vgWC3Q3n5SPfaSFoc2o_niREZysiwFiGyVWnJZhjn1UPgEcMW9-HkYRA3owRa8PKqLO3p_PHzW-qy21rFb25-SkqHPVPWVoOpeKAecOdeDEYxiuC0fBLHzqD-fqoBWrbSAUmzVnxWK6SGef6ObDIpLsE8Ta-1uW5Z_Nh19CdzrY-NDykOzpIF5oCkWTg3DCkm5VCpcp01cFXHZAExw7zz-GKkMRwASbD2I2G0dEYV53crdZ46nC5V22IdqyNXKj99kmsJt9Wqg-xngmuEsEhBk5txGIUzXxD7Ci11CemkHsNXXdmiu9SdNIzOu24eEkrsW58dFxpZx3qbeXkh7Zhc2mmWChXsb9VSuIl_xxrrqcpQWvy_WdpduuJMnDYQraFdgXhEVT4StKp09nDOZR3y5sG0ga6y',
);

console.log(data);
