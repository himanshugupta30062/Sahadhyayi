// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSearchShortcutLabel, isApplePlatform, useGlobalSearchShortcut, useKeyboardShortcuts } from './useKeyboardShortcuts';

afterEach(()=>{ cleanup(); vi.restoreAllMocks(); });
describe('keyboard shortcut utilities',()=>{
 it('returns platform-specific search label',()=>{
  vi.spyOn(navigator,'platform','get').mockReturnValue('MacIntel');
  expect(getSearchShortcutLabel()).toEqual({display:'⌘K',key:'⌘',symbol:'K'});
  vi.spyOn(navigator,'platform','get').mockReturnValue('Win32');
  expect(getSearchShortcutLabel()).toEqual({display:'Ctrl+K',key:'Ctrl',symbol:'K'});
 });
 it('detects Apple platforms',()=>{
  vi.spyOn(navigator,'platform','get').mockReturnValue('iPhone');
  expect(isApplePlatform()).toBe(true);
  vi.spyOn(navigator,'platform','get').mockReturnValue('Linux');
  expect(isApplePlatform()).toBe(false);
 });
});
describe('useKeyboardShortcuts',()=>{
 it('runs matching shortcut and prevents default',()=>{
  const callback=vi.fn();renderHook(()=>useKeyboardShortcuts([{key:'k',ctrlKey:true,callback,description:'Search'}]));
  const event=new KeyboardEvent('keydown',{key:'K',ctrlKey:true,bubbles:true,cancelable:true});
  act(()=>window.dispatchEvent(event));expect(callback).toHaveBeenCalledTimes(1);expect(event.defaultPrevented).toBe(true);
 });
 it('does not trigger in input unless allowed',()=>{
  const callback=vi.fn();renderHook(()=>useKeyboardShortcuts([{key:'x',callback,description:'X'}]));
  const input=document.createElement('input');document.body.append(input);
  act(()=>input.dispatchEvent(new KeyboardEvent('keydown',{key:'x',bubbles:true,cancelable:true})));
  expect(callback).not.toHaveBeenCalled();input.remove();
 });
 it('respects disabled state and removes listener on unmount',()=>{
  const callback=vi.fn();const {unmount}=renderHook(()=>useKeyboardShortcuts([{key:'x',callback,description:'X'}],false));
  act(()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'x'})));expect(callback).not.toHaveBeenCalled();unmount();
 });
});
describe('useGlobalSearchShortcut',()=>{
 it('toggles on modifier K and slash outside editable fields',()=>{
  const toggle=vi.fn();renderHook(()=>useGlobalSearchShortcut(toggle));
  act(()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'k',ctrlKey:true,bubbles:true,cancelable:true})));
  expect(toggle).toHaveBeenCalledTimes(1);
  act(()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'/',bubbles:true,cancelable:true})));
  expect(toggle).toHaveBeenCalledTimes(2);
 });
 it('does not toggle slash in input or when disabled',()=>{
  const toggle=vi.fn();renderHook(()=>useGlobalSearchShortcut(toggle,false));
  const input=document.createElement('input');document.body.append(input);
  act(()=>input.dispatchEvent(new KeyboardEvent('keydown',{key:'/',bubbles:true,cancelable:true})));
  expect(toggle).not.toHaveBeenCalled();input.remove();
 });
});
