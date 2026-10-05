export function formatSummaryMonth(month: string, language: string) {
  return new Intl.DateTimeFormat(
    language.startsWith('ru') ? 'ru-RU' : 'en-US',
    {
      month: 'long',
      year: 'numeric',
    },
  ).format(
    new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1),
  );
}
