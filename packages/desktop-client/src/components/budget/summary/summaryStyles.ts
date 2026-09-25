import { theme } from '@actual-app/components/theme';
import { spacing } from '@actual-app/components/tokens';
import { css } from '@emotion/css';

export const summaryCardStyle = {
  backgroundColor: theme.cardBackground,
  border: `1px solid ${theme.cardBorder}`,
  borderRadius: 16,
  padding: spacing.lg,
};

export const summaryHeroStyle = {
  ...summaryCardStyle,
  backgroundColor: theme.financeHeroBackground,
  color: theme.financeHeroText,
};

export const summaryControlStyle = {
  backgroundColor: theme.financeSoftAccent,
  border: `1px solid ${theme.cardBorder}`,
  borderRadius: 8,
  color: theme.pageText,
  padding: `${spacing.sm}px ${spacing.md}px`,
};

export const summaryStickyCellStyle = {
  backgroundColor: theme.cardBackground,
  borderRight: `1px solid ${theme.tableBorder}`,
  left: 0,
  position: 'sticky' as const,
  zIndex: 1,
};

export const summaryControlClass = css({
  minHeight: 40,
  maxWidth: '100%',
  boxSizing: 'border-box',
  padding: '8px 12px',
  border: `1px solid ${theme.formInputBorder}`,
  borderRadius: 8,
  font: 'inherit',
  fontSize: 13,
  color: theme.pageText,
  background: theme.cardBackground,
  '&:is(button)': { cursor: 'pointer', fontWeight: 500 },
  '&:is(button):hover:not(:disabled)': { background: theme.financeSoftAccent },
  '&:disabled': { opacity: 0.45, cursor: 'default' },
  '&:focus-visible': {
    outline: `2px solid ${theme.buttonPrimaryBackground}`,
    outlineOffset: 2,
  },
});
