import { useQuery } from '@tanstack/react-query';

import { UNSUPPORTED_NEWS_FEED_FORMAT } from '#news/fetchNewsFeed';
import { newsQueries } from '#news/queries';
import type { NewsEntry } from '#news/types';
import { getNewestDate, getUnseenEntries } from '#news/utils';
import { RUSSIAN_NEWS_FEED_ENABLED } from '#news/visibility';

import { useGlobalPref } from './useGlobalPref';

const EMPTY_ENTRIES: NewsEntry[] = [];

/**
 * Why the feed couldn't be shown: it couldn't be downloaded (usually offline),
 * or it is in a newer format than this version of the app understands.
 */
type NewsFeedErrorKind = 'unavailable' | 'unsupported';

function getErrorKind(error: Error | null): NewsFeedErrorKind | undefined {
  if (!error) {
    return undefined;
  }
  return error.message === UNSUPPORTED_NEWS_FEED_FORMAT
    ? 'unsupported'
    : 'unavailable';
}

export function useNewsFeed() {
  // The upstream feed stays off in the Russian fork until its content is
  // translated. The user preference still applies if the feature is enabled.
  const [showNewsFeed] = useGlobalPref('showNewsFeed');
  const isEnabled = RUSSIAN_NEWS_FEED_ENABLED && Boolean(showNewsFeed);
  const [lastSeenNewsDate, setLastSeenNewsDate] =
    useGlobalPref('lastSeenNewsDate');

  // `enabled: false` means no request is ever made while the feature is off.
  const query = useQuery({ ...newsQueries.feed(), enabled: isEnabled });
  const entries = query.data?.entries ?? EMPTY_ENTRIES;
  const unseenCount = getUnseenEntries(entries, lastSeenNewsDate).length;

  const markAllSeen = () => {
    const newestDate = getNewestDate(entries);
    if (newestDate && newestDate !== lastSeenNewsDate) {
      setLastSeenNewsDate(newestDate);
    }
  };

  return {
    isEnabled,
    entries,
    unseenCount,
    lastSeenNewsDate,
    markAllSeen,
    isLoading: isEnabled && query.isPending,
    errorKind: getErrorKind(query.error),
    retry: () => void query.refetch(),
  };
}
