import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ParticipantIcon, resolveParticipantIcon } from '../../src/components/ParticipantIcon';

describe('ParticipantIcon', () => {
  it.each([
    ['actor', 'person'],
    ['service', 'server'],
    ['system', 'browser'],
    ['database', 'database'],
    ['queue', 'queue'],
    ['external', 'cloud'],
  ] as const)('maps %s kind to the %s icon', (kind, icon) => {
    expect(resolveParticipantIcon(undefined, kind)).toBe(icon);
  });

  it('prefers an explicit icon over the kind default', () => {
    expect(resolveParticipantIcon('cloud', 'actor')).toBe('cloud');
  });

  it.each(['person', 'server', 'database', 'queue', 'cloud', 'browser'] as const)(
    'renders the %s SVG',
    icon => {
      const markup = renderToStaticMarkup(<ParticipantIcon icon={icon} />);
      expect(markup).toContain('<svg');
      expect(markup).toContain(`data-participant-icon="${icon}"`);
    }
  );
});
