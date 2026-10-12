let channelCounter = 0;

/**
 * Supabase returns the SAME channel object when two callers use the same name,
 * and calling `.subscribe()` twice on it throws. Give each subscriber its own name.
 */
export const uniqueChannelName = (base: string): string => {
  channelCounter += 1;
  return `${base}:${channelCounter}`;
};
