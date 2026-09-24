import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';

import {
  SvgCheveronDown,
  SvgCheveronRight,
  SvgHome,
  SvgLibrary,
  SvgList,
  SvgReports,
  SvgTag,
  SvgTuning,
  SvgUserGroup,
  SvgWallet,
} from '@actual-app/components/icons/v1';
import { SvgCalendar3 } from '@actual-app/components/icons/v2';
import { theme } from '@actual-app/components/theme';
import { radius, spacing } from '@actual-app/components/tokens';
import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';

import { useIsTestEnv } from '#hooks/useIsTestEnv';
import { useSyncServerStatus } from '#hooks/useSyncServerStatus';

import { NavRow } from './NavRow';

export function PrimaryNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const syncServerStatus = useSyncServerStatus();
  const isTestEnv = useIsTestEnv();
  const isUsingServer = syncServerStatus !== 'no-server' || isTestEnv;
  const isSecondaryRoute = ['/payees', '/rules', '/bank-sync', '/tags'].some(
    route => location.pathname.startsWith(route),
  );
  const [isMoreOpen, setIsMoreOpen] = useState(isSecondaryRoute);

  useEffect(() => {
    if (isSecondaryRoute) {
      setIsMoreOpen(true);
    }
  }, [isSecondaryRoute]);

  return (
    <View
      data-testid="sidebar-primary-buttons"
      style={{
        flexShrink: 0,
        padding: `${spacing.xs}px ${spacing.sm}px 0`,
      }}
    >
      <NavRow title={t('Overview')} Icon={SvgHome} to="/overview" />
      <NavRow title={t('Budget')} Icon={SvgWallet} to="/budget" />
      <NavRow title={t('Transactions')} Icon={SvgList} to="/accounts" />
      <NavRow title={t('Reports')} Icon={SvgReports} to="/reports" />
      <NavRow title={t('Schedules')} Icon={SvgCalendar3} to="/schedules" />
      <button
        type="button"
        aria-expanded={isMoreOpen}
        aria-controls="sidebar-more-links"
        onClick={() => setIsMoreOpen(!isMoreOpen)}
        className={css({
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          width: '100%',
          marginBottom: 1,
          padding: spacing.sm,
          border: 0,
          borderRadius: radius.sm,
          backgroundColor: 'transparent',
          color: theme.sidebarItemText,
          fontSize: 13,
          fontWeight: 500,
          textAlign: 'left',
          cursor: 'pointer',
          ':hover': { backgroundColor: theme.sidebarItemBackgroundHover },
          ':focus-visible': {
            outline: `2px solid ${theme.sidebarItemTextSelected}`,
          },
        })}
      >
        {isMoreOpen ? (
          <SvgCheveronDown width={15} height={15} />
        ) : (
          <SvgCheveronRight width={15} height={15} />
        )}
        <Trans>More</Trans>
      </button>
      {isMoreOpen && (
        <View id="sidebar-more-links">
          <NavRow title={t('Payees')} Icon={SvgUserGroup} to="/payees" />
          <NavRow title={t('Rules')} Icon={SvgTuning} to="/rules" />
          {isUsingServer && (
            <NavRow title={t('Bank Sync')} Icon={SvgLibrary} to="/bank-sync" />
          )}
          <NavRow title={t('Tags')} Icon={SvgTag} to="/tags" />
        </View>
      )}
    </View>
  );
}
