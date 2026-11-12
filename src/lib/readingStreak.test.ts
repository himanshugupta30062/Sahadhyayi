import { describe, expect, it } from 'vitest';
import { computeReadingStreak } from '@/lib/readingStreak';
describe('computeReadingStreak',()=>{
 const now=new Date(2026,10,12,15,30);
 it('returns empty stats without activity',()=>expect(computeReadingStreak([],null,now)).toEqual({current:0,best:0,daysThisWeek:0,activeDays:[],lastActiveAt:null}));
 it('counts today and consecutive prior days',()=>{const r=computeReadingStreak(['2026-11-10','2026-11-11','2026-11-12'],'2026-11-12T10:00:00Z',now);expect(r.current).toBe(3);expect(r.best).toBe(3);expect(r.activeDays).toEqual(['2026-11-10','2026-11-11','2026-11-12']);});
 it('keeps streak alive through yesterday when today is inactive',()=>expect(computeReadingStreak(['2026-11-10','2026-11-11'],null,now).current).toBe(2));
 it('breaks current streak but retains historic best',()=>{const r=computeReadingStreak(['2026-11-01','2026-11-02','2026-11-03','2026-11-10','2026-11-12'],null,now);expect(r.current).toBe(1);expect(r.best).toBe(3);});
 it('deduplicates repeated dates',()=>{const r=computeReadingStreak(['2026-11-12','2026-11-12','2026-11-11'],null,now);expect(r.current).toBe(2);expect(r.daysThisWeek).toBe(2);});
 it('counts rolling seven-day window',()=>{const r=computeReadingStreak(['2026-11-06','2026-11-08','2026-11-12'],null,now);expect(r.daysThisWeek).toBe(3);expect(r.activeDays).toEqual(['2026-11-06','2026-11-08','2026-11-12']);});
});