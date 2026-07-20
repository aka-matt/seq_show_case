import React from 'react';
import type {
  ParticipantIcon as ParticipantIconName,
  ParticipantKind,
} from '../model/public-types';

const KIND_ICONS: Record<ParticipantKind, ParticipantIconName> = {
  actor: 'person',
  service: 'server',
  system: 'browser',
  database: 'database',
  queue: 'queue',
  external: 'cloud',
};

export function resolveParticipantIcon(
  icon?: ParticipantIconName,
  kind?: ParticipantKind
): ParticipantIconName | undefined {
  return icon ?? (kind === undefined ? undefined : KIND_ICONS[kind]);
}

export function ParticipantIcon({
  icon,
  kind,
}: {
  icon?: ParticipantIconName;
  kind?: ParticipantKind;
}): React.ReactElement | null {
  const resolved = resolveParticipantIcon(icon, kind);
  if (resolved === undefined) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      role="img"
      aria-label={kind ? `${kind} participant` : `${resolved} participant`}
      data-participant-icon={resolved}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {resolved === 'person' && (
        <>
          <circle cx="12" cy="7" r="3" />
          <path d="M5.5 20c.7-4.5 2.8-7 6.5-7s5.8 2.5 6.5 7" />
        </>
      )}
      {resolved === 'server' && (
        <>
          <rect x="4" y="4" width="16" height="6" rx="1.5" />
          <rect x="4" y="14" width="16" height="6" rx="1.5" />
          <path d="M8 7h.01M8 17h.01M12 7h5M12 17h5" />
        </>
      )}
      {resolved === 'database' && (
        <>
          <ellipse cx="12" cy="5.5" rx="7" ry="3" />
          <path d="M5 5.5v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6M5 11.5v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
        </>
      )}
      {resolved === 'queue' && (
        <>
          <rect x="4" y="5" width="13" height="4" rx="1" />
          <rect x="7" y="10" width="13" height="4" rx="1" />
          <rect x="4" y="15" width="13" height="4" rx="1" />
        </>
      )}
      {resolved === 'cloud' && (
        <path d="M7 18h10a4 4 0 0 0 .7-7.9A6 6 0 0 0 6.3 9 4.5 4.5 0 0 0 7 18Z" />
      )}
      {resolved === 'browser' && (
        <>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 9h18M7 6.5h.01M10 6.5h.01" />
        </>
      )}
    </svg>
  );
}
