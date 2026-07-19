/**
 * DividerOverlay - renders horizontal dividers spanning participants.
 * Uses ViewportPortal for proper z-ordering above activation bars.
 */
import React, { memo } from 'react';
import { ViewportPortal } from '@xyflow/react';
import type { LayoutDivider } from '../layout/layout-types';

export interface DividerOverlayProps {
  dividers: LayoutDivider[];
}

function DividerOverlayComponent({
  dividers,
}: DividerOverlayProps): React.ReactElement | null {
  if (dividers.length === 0) return null;

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
        {dividers.map((divider) => (
          <div
            key={`divider-${divider.eventId}`}
            style={{
              position: 'absolute',
              left: divider.x,
              top: divider.y,
              width: divider.width,
              height: 1,
              backgroundColor: 'var(--sd-border)',
              boxSizing: 'border-box',
            }}
          >
            {divider.label && (
              <span
                style={{
                  position: 'absolute',
                  left: 8,
                  top: -8,
                  fontSize: 11,
                  color: 'var(--sd-text-muted)',
                  backgroundColor: 'var(--sd-canvas)',
                  padding: '0 4px',
                  whiteSpace: 'nowrap',
                }}
              >
                {divider.label}
              </span>
            )}
          </div>
        ))}
      </div>
    </ViewportPortal>
  );
}

export const DividerOverlay = memo(DividerOverlayComponent);
