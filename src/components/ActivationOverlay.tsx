/**
 * ActivationOverlay - renders activation/deactivation bars as React Flow overlays.
 * Uses ViewportPortal for proper z-ordering above message edges.
 */
import React, { memo } from 'react';
import { ViewportPortal } from '@xyflow/react';
import type { LayoutActivation } from '../layout/layout-types';

export interface ActivationOverlayProps {
  activations: LayoutActivation[];
}

/**
 * Colors for activation bars - using a subtle blue that stands out from background
 */
const ACTIVATION_COLOR = '#3b82f6';
const ACTIVATIONBg_COLOR = 'rgba(59, 130, 246, 0.15)';

function ActivationOverlayComponent({
  activations,
}: ActivationOverlayProps): React.ReactElement | null {
  if (activations.length === 0) return null;

  return (
    <ViewportPortal>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 4,
        }}
      >
        {activations.map((activation) => (
          <div
            key={`activation-${activation.activateEventId}`}
            style={{
              position: 'absolute',
              left: activation.x,
              top: activation.y,
              width: activation.width,
              height: activation.height,
              backgroundColor: ACTIVATIONBg_COLOR,
              borderLeft: `2px solid ${ACTIVATION_COLOR}`,
              borderRight: `2px solid ${ACTIVATION_COLOR}`,
              boxSizing: 'border-box',
            }}
          />
        ))}
      </div>
    </ViewportPortal>
  );
}

export const ActivationOverlay = memo(ActivationOverlayComponent);
