import { describe, expect, it } from 'vitest';
import { detectImmersiveVRSupport } from '../src/app/XRSupport';

describe('immersive VR capability detection', () => {
  it('reports unsupported when WebXR is absent', async () => {
    await expect(detectImmersiveVRSupport(undefined)).resolves.toMatchObject({
      supported: false,
    });
  });

  it('uses the WebXR capability API', async () => {
    const modes: XRSessionMode[] = [];
    const result = await detectImmersiveVRSupport({
      isSessionSupported: async (mode) => {
        modes.push(mode);
        return true;
      },
    });

    expect(modes).toEqual(['immersive-vr']);
    expect(result).toEqual({ supported: true });
  });

  it('turns capability errors into a recoverable fallback', async () => {
    const result = await detectImmersiveVRSupport({
      isSessionSupported: async () => {
        throw new Error('Capability check failed');
      },
    });

    expect(result.supported).toBe(false);
    expect(result.reason).toContain('continue on screen');
  });
});
