// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useColorCycle } from './useColorCycle';
describe('useColorCycle',()=>{
 afterEach(()=>vi.useRealTimers());
 it('starts at first class and cycles/wraps on interval',()=>{vi.useFakeTimers();const {result}=renderHook(()=>useColorCycle(['a','b','c'],1000));expect(result.current).toBe('a');act(()=>vi.advanceTimersByTime(1000));expect(result.current).toBe('b');act(()=>vi.advanceTimersByTime(2000));expect(result.current).toBe('a');});
 it('uses default interval and remains stable for one class',()=>{vi.useFakeTimers();const {result}=renderHook(()=>useColorCycle(['only']));act(()=>vi.advanceTimersByTime(10000));expect(result.current).toBe('only');});
 it('returns empty for no classes and clears interval on unmount',()=>{vi.useFakeTimers();const clear=vi.spyOn(global,'clearInterval');const {result,unmount}=renderHook(()=>useColorCycle([],50));expect(result.current).toBe('');unmount();expect(clear).toHaveBeenCalled();});
 it('restarts timer when interval changes',()=>{vi.useFakeTimers();const {result,rerender}=renderHook(({ms})=>useColorCycle(['a','b'],ms),{initialProps:{ms:100}});act(()=>vi.advanceTimersByTime(100));expect(result.current).toBe('b');rerender({ms:500});act(()=>vi.advanceTimersByTime(500));expect(result.current).toBe('a');});
});