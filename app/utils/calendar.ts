export const CAL = {
  formatUtc(iso: string): string {
    const date = new Date(iso);
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  },

  urlEncode(s: string): string {
    return encodeURIComponent(s);
  },

  googleLink({
    title,
    details,
    startIso,
    endIso,
    location,
  }: {
    title: string;
    details?: string;
    startIso: string;
    endIso: string;
    location?: string;
  }): string {
    const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
    const dates = CAL.formatUtc(startIso) + '/' + CAL.formatUtc(endIso);
    return `${base}&text=${CAL.urlEncode(title)}&dates=${dates}&details=${CAL.urlEncode(details || '')}&location=${CAL.urlEncode(location || '')}`;
  },

  outlookLink({
    title,
    details,
    startIso,
    endIso,
    location,
  }: {
    title: string;
    details?: string;
    startIso: string;
    endIso: string;
    location?: string;
  }): string {
    const base = 'https://outlook.live.com/calendar/0/action/compose';
    return `${base}?rru=addevent&subject=${CAL.urlEncode(title)}&body=${CAL.urlEncode(details || '')}&startdt=${CAL.urlEncode(startIso)}&enddt=${CAL.urlEncode(endIso)}&location=${CAL.urlEncode(location || '')}`;
  },

  icsContent({
    title,
    details,
    startIso,
    endIso,
    location,
    url,
  }: {
    title: string;
    details?: string;
    startIso: string;
    endIso: string;
    location?: string;
    url?: string;
  }): string {
    const dtstamp = CAL.formatUtc(new Date().toISOString());
    const dtstart = CAL.formatUtc(startIso);
    const dtend = CAL.formatUtc(endIso);
    const uid = `on-${Math.random().toString(36).slice(2)}@overboardnorth`;

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Overboard North//Craft Fair//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${title}`,
      details ? `DESCRIPTION:${details.replace(/\r?\n/g, '\\n')}` : '',
      location ? `LOCATION:${location}` : '',
      url ? `URL:${url}` : '',
      'END:VEVENT',
      'END:VCALENDAR',
    ]
      .filter(Boolean)
      .join('\r\n');
  },

  downloadIcs(icsContent: string, filename: string): void {
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  },

  icsDataUri(icsContent: string): string {
    return `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;
  },
};
