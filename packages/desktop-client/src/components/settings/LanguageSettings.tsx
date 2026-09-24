import React from 'react';
import { Trans } from 'react-i18next';

import { Text } from '@actual-app/components/text';

import { Setting } from './UI';

export function LanguageSettings() {
  return (
    <Setting
      primaryAction={
        <Text>
          <Trans>Russian</Trans>
        </Text>
      }
    >
      <Text>
        <strong>
          <Trans>Language</Trans>
        </strong>
      </Text>
    </Setting>
  );
}
