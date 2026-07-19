/**
 * FragmentOverlay - renders fragment rectangles and branch separators.
 * Supports alt/opt/loop/par/critical/break fragment types.
 * Uses ViewportPortal for proper z-ordering.
 */
import React, { memo } from 'react';
import { ViewportPortal } from '@xyflow/react';
import type { LayoutFragment, LayoutBranch } from '../layout/layout-types';

export interface FragmentOverlayProps {
  fragments: LayoutFragment[];
  branches: LayoutBranch[];
  /** Callback when a fragment title is clicked (restores pointer-events) */
  onFragmentClick?: (fragmentEventId: string) => void;
}

// ---------------------------------------------------------------------------
// Fragment kind styles
// ---------------------------------------------------------------------------

const FRAGMENT_STYLES: Record<
  LayoutFragment['fragmentKind'],
  { bg: string; border: string; headerBg: string }
> = {
  alt: { bg: 'rgba(239, 246, 255, 0.5)', border: '#3b82f6', headerBg: 'rgba(59, 130, 246, 0.1)' },
  opt: { bg: 'rgba(240, 253, 244, 0.5)', border: '#22c55e', headerBg: 'rgba(34, 197, 94, 0.1)' },
  loop: { bg: 'rgba(254, 252, 232, 0.5)', border: '#f59e0b', headerBg: 'rgba(245, 158, 11, 0.1)' },
  par: { bg: 'rgba(253, 230, 138, 0.3)', border: '#d97706', headerBg: 'rgba(217, 119, 6, 0.1)' },
  critical: { bg: 'rgba(254, 242, 242, 0.5)', border: '#ef4444', headerBg: 'rgba(239, 68, 68, 0.1)' },
  break: { bg: 'rgba(252, 231, 243, 0.5)', border: '#db2777', headerBg: 'rgba(219, 39, 119, 0.1)' },
};

const FRAGMENT_LABELS: Record<LayoutFragment['fragmentKind'], string> = {
  alt: 'ALT',
  opt: 'OPT',
  loop: 'LOOP',
  par: 'PAR',
  critical: 'CRITICAL',
  break: 'BREAK',
};

function FragmentOverlayComponent({
  fragments,
  branches,
  onFragmentClick,
}: FragmentOverlayProps): React.ReactElement | null {
  if (fragments.length === 0) return null;

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
          zIndex: 2,
        }}
      >
        {/* Fragment rectangles */}
        {fragments.map((fragment) => {
          const styles = FRAGMENT_STYLES[fragment.fragmentKind] ?? FRAGMENT_STYLES.alt;
          return (
            <div
              key={`fragment-${fragment.fragmentEventId}`}
              style={{
                position: 'absolute',
                left: fragment.x,
                top: fragment.y,
                width: fragment.width,
                height: fragment.height,
                backgroundColor: styles.bg,
                border: `1px solid ${styles.border}`,
                borderRadius: 6,
                boxSizing: 'border-box',
              }}
            >
              {/* Fragment header/label */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onFragmentClick?.(fragment.fragmentEventId);
                }}
                style={{
                  position: 'absolute',
                  top: -14,
                  left: 12,
                  backgroundColor: styles.headerBg,
                  border: `1px solid ${styles.border}`,
                  borderRadius: 4,
                  padding: '2px 8px',
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: styles.border,
                    letterSpacing: '0.5px',
                  }}
                >
                  {FRAGMENT_LABELS[fragment.fragmentKind]}
                  {fragment.label ? ` — ${fragment.label}` : ''}
                </span>
              </div>
            </div>
          );
        })}

        {/* Branch separators */}
        {branches.map((branch) => (
          <div
            key={`branch-${branch.branchId}`}
            style={{
              position: 'absolute',
              left: branch.x,
              top: branch.y,
              width: branch.width,
              height: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              boxSizing: 'border-box',
            }}
          >
            {branch.label && (
              <span
                style={{
                  position: 'absolute',
                  left: 8,
                  top: 4,
                  fontSize: 11,
                  color: '#4b5563',
                  fontStyle: 'italic',
                  backgroundColor: 'transparent',
                  padding: '0 4px',
                  whiteSpace: 'nowrap',
                }}
              >
                {branch.label}
              </span>
            )}
          </div>
        ))}
      </div>
    </ViewportPortal>
  );
}

export const FragmentOverlay = memo(FragmentOverlayComponent);
