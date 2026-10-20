import { browserSupportsWebAuthn, startAuthentication, startRegistration } from '@simplewebauthn/browser';

export const supportsPasskeys = () => window.isSecureContext && browserSupportsWebAuthn();
export const authenticatePasskey = options => startAuthentication({ optionsJSON: options });
export const registerPasskey = options => startRegistration({ optionsJSON: options });
export const passkeyError = error => error.response?.data?.message ||
  (['NotAllowedError', 'AbortError'].includes(error.name) ? 'Device verification was cancelled or timed out. Try again, or use your password and email code.' :
    error.name === 'InvalidStateError' ? 'This device already has this passkey. Use it to sign in, or choose another device.' :
      'Passkey verification could not be completed on this device. Password and email-code sign-in is still available.');
