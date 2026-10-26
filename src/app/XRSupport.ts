export interface XRCapabilityResult {
  supported: boolean;
  reason?: string;
}

export interface XRCapabilityProvider {
  isSessionSupported(mode: XRSessionMode): Promise<boolean>;
}

export async function detectImmersiveVRSupport(
  xr?: XRCapabilityProvider,
): Promise<XRCapabilityResult> {
  const provider = xr ?? globalThis.navigator?.xr;

  if (!provider) {
    return {
      supported: false,
      reason: 'This browser does not expose the WebXR Device API.',
    };
  }

  try {
    const supported = await provider.isSessionSupported('immersive-vr');
    return supported
      ? { supported: true }
      : {
          supported: false,
          reason: 'Immersive VR is unavailable here. You can continue on screen.',
        };
  } catch {
    return {
      supported: false,
      reason: 'WebXR support could not be checked. You can continue on screen.',
    };
  }
}
