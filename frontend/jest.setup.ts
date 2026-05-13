import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'node:util';

// jsdom v30+ 은 TextEncoder/TextDecoder 를 jsdom global 에 expose 하지 않으므로
// SSE 디코딩 같은 코드를 위해 Node util 구현으로 polyfill.
const g = globalThis as Record<string, unknown>;
if (typeof g.TextEncoder === 'undefined') g.TextEncoder = TextEncoder;
if (typeof g.TextDecoder === 'undefined') g.TextDecoder = TextDecoder;
