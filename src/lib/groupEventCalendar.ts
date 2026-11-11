import type { GroupEvent } from '@/hooks/useGroupEvents';

const escapeIcs = (value:string) => value.replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
const utcStamp = (value:string) => new Date(value).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
export const groupEventToIcs = (event:GroupEvent) => [
 'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Sahadhyayi//Reading Groups//EN','CALSCALE:GREGORIAN','BEGIN:VEVENT',
 `UID:${event.id}@sahadhyayi.com`, `DTSTAMP:${utcStamp(new Date().toISOString())}`,
 `DTSTART:${utcStamp(event.starts_at)}`, `DTEND:${utcStamp(event.ends_at)}`,
 `SUMMARY:${escapeIcs(event.title)}`, ...(event.description?[`DESCRIPTION:${escapeIcs(event.description)}`]:[]),
 ...(event.location?[`LOCATION:${escapeIcs(event.location)}`]:[]),
 'END:VEVENT','END:VCALENDAR'
].join('\r\n');
export const downloadGroupEventCalendar = (event:GroupEvent) => {
 const blob=new Blob([groupEventToIcs(event)],{type:'text/calendar;charset=utf-8'});
 const url=URL.createObjectURL(blob);const anchor=document.createElement('a');
 anchor.href=url;anchor.download=`sahadhyayi-${event.id}.ics`;anchor.click();URL.revokeObjectURL(url);
};
