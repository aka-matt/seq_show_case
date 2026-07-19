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
// Fragment kind styles (CSS variable based)
// ---------------------------------------------------------------------------

const FRAGMENT_STYLES: Record<
  LayoutFragment['fragmentKind'],
  { bgVar: string; borderVar: string; headerBgVar: string }
> = {
  alt: { bgVar: '--sd-fragment-fill', borderVar: '--sd-accent', headerBgVar: '--sd-accent-soft' },
  opt: { bgVar: '--sd-success', borderVar: '--sd-success', headerBgVar: '--sd-success' },
  loop: { bgVar: '--sd-warning', borderVar: '--sd-warning', headerBgVar: '--sd-warning' },
  par: { bgVar: '--sd-warning', borderVar: '--sd-warning', headerBgVar: '--sd-warning' },
  critical: { bgVar: '--sd-error', borderVar: '--sd-error', headerBgVar: '--sd-error' },
  break: { bgVar: '--sd-note', borderVar: '--sd-accent', headerBgVar: '--sd-note' },
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
                backgroundColor: `var(${styles.bgVar})`,
                border: `1px solid var(${styles.borderVar})`,
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
                  backgroundColor: `var(${styles.headerBgVar})`,
                  border: `1px solid var(${styles.borderVar})`,
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
                    color: `var(${styles.borderVar})`,
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
              backgroundColor: 'var(--sd-border)',
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
                  color: 'var(--sd-text-muted)',
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
