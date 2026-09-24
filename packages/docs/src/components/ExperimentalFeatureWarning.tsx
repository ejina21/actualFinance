import type { ReactNode } from 'react';

import Admonition from '@theme/Admonition';

type ExperimentalFeatureWarningProps = {
  issueId?: string;
  children?: ReactNode;
};

export function ExperimentalFeatureWarning({
  children,
}: ExperimentalFeatureWarningProps) {
  return (
    <Admonition type="warning">
      <p>
        Это <strong>экспериментальная функция</strong>. Она ещё разрабатывается:
        возможны ошибки, отсутствующие возможности и неполная документация. В
        будущей версии функция может измениться или исчезнуть.
      </p>
      {children}
    </Admonition>
  );
}
