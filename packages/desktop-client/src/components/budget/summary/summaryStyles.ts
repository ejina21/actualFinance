import { theme } from '@actual-app/components/theme';
import { spacing } from '@actual-app/components/tokens';

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
