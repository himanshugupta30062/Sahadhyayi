export interface ReadingStreak {
  current: number;
  best: number;
  daysThisWeek: number;
  activeDays: string[];
  lastActiveAt: string | null;
}
export const emptyStreak: ReadingStreak = { current: 0, best: 0, daysThisWeek: 0, activeDays: [], lastActiveAt: null };
export const localDayKey = (date: Date): string => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const parseDayKey = (key: string): Date => { const [y,m,d]=key.split('-').map(Number); return new Date(y,m-1,d); };
export const computeReadingStreak = (activityDates: string[], lastActiveAt: string|null, now = new Date()): ReadingStreak => {
 const today=new Date(now); today.setHours(0,0,0,0);
 const todayKey=localDayKey(today);
 const set=new Set(activityDates.filter((key)=>key<=todayKey)); if(!set.size) return emptyStreak; const yesterday=new Date(today); yesterday.setDate(yesterday.getDate()-1);
 let current=0; const cursor=new Date(set.has(localDayKey(today))?today:yesterday);
 while(set.has(localDayKey(cursor))){current++;cursor.setDate(cursor.getDate()-1);}
 const sorted=[...set].sort(); let best=1,run=1;
 for(let i=1;i<sorted.length;i++){const diff=Math.round((parseDayKey(sorted[i]).getTime()-parseDayKey(sorted[i-1]).getTime())/86400000);run=diff===1?run+1:1;best=Math.max(best,run);}
 const weekStart=new Date(today);weekStart.setDate(weekStart.getDate()-6);
 const daysThisWeek=sorted.filter(k=>parseDayKey(k)>=weekStart).length;
 const activeDays=Array.from({length:7},(_,i)=>{const d=new Date(today);d.setDate(d.getDate()-(6-i));return localDayKey(d);}).filter(k=>set.has(k));
 return {current,best:Math.max(best,current),daysThisWeek,activeDays,lastActiveAt};
};