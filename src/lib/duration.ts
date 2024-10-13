export const getDurationString = (start: number, end: number) => {
  if (start > end) return '<1m';
  const duration = end - start;
  const seconds = Math.floor((duration / 1000) % 60);
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
  const days = Math.floor(duration / (1000 * 60 * 60 * 24));

  return `${days ? days + 'd ' : ''}${hours ? hours + 'h ' : ''}${minutes ? minutes + 'm ' : ''}${
    seconds ? seconds + 's' : ''
  }`;
};

export const getApproximateDurationSince = (start: number) => {
  const end = Date.now();

  if (start > end) return '<1m';
  const duration = end - start;

  const years = Math.floor(duration / (1000 * 60 * 60 * 24 * 365));
  if (years) return `${years} ${years > 1 ? 'years' : 'year'}`;

  const months = Math.floor((duration / (1000 * 60 * 60 * 24 * 30)) % 12);
  if (months) return `${months} ${months > 1 ? 'months' : 'month'}`;

  const days = Math.floor(duration / (1000 * 60 * 60 * 24));
  if (days) return `${days} ${days > 1 ? 'days' : 'day'}`;

  const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
  if (hours) return `${hours} ${hours > 1 ? 'hours' : 'hour'}`;

  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  if (minutes) return `${minutes} ${minutes > 1 ? 'minutes' : 'minute'}`;
  return 'a few seconds';
};

export const getSecondsToDurationString = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes) return `${minutes}m ${remainingSeconds}s`;

  return `${remainingSeconds}s`;
};
