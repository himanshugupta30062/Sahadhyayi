import { describe, expect, it } from 'vitest';
import { AiResponseSchema } from './schema';

describe('AiResponseSchema',()=>{
 it('accepts a valid reply, references and optional follow-up',()=>{
  expect(AiResponseSchema.parse({reply:'Read this next.',references:[{bookId:'b1',title:'Book'}],followup:'More?'})).toEqual({reply:'Read this next.',references:[{bookId:'b1',title:'Book'}],followup:'More?'});
 });
 it('rejects empty or overlong replies and more than five references',()=>{
  expect(AiResponseSchema.safeParse({reply:'',references:[]}).success).toBe(false);
  expect(AiResponseSchema.safeParse({reply:'x'.repeat(1201),references:[]}).success).toBe(false);
  expect(AiResponseSchema.safeParse({reply:'ok',references:Array.from({length:6},()=>({title:'Book'}))}).success).toBe(false);
 });
 it('allows optional reference fields to be omitted',()=>{
  expect(AiResponseSchema.parse({reply:'Hello',references:[{}]}).references).toEqual([{}]);
 });
});