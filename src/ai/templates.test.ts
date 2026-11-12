import { describe, expect, it } from 'vitest';
import { PROMPT_V1, TEMPLATES } from './templates';

describe('AI prompt templates',()=>{
 it('renders request intent, question, bounded genres and book details',()=>{
  const prompt=PROMPT_V1({question:'Find a mystery',intent:'book_query',promptVersion:'V1',ctx:{site:{totalBooks:100,topGenres:['g1','g2','g3','g4','g5','g6']},books:[{id:'b1',title:'The Book',author:'A Writer',snippet:'A clue'}]});
  expect(prompt).toContain('User intent: book_query');
  expect(prompt).toContain('Question: "Find a mystery"');
  expect(prompt).toContain('Total books: 100');
  expect(prompt).toContain('Top genres: g1, g2, g3, g4, g5');
  expect(prompt).toContain('The Book by A Writer — A clue');
  expect(prompt).toContain('Respond ONLY as compact JSON');
  expect(prompt).not.toContain('g6');
 });
 it('avoids guessing unavailable book counts and omits absent author/snippet',()=>{
  const prompt=PROMPT_V1({question:'Hi',intent:'general',promptVersion:'V1',ctx:{site:{totalBooks:null,topGenres:[]},books:[{id:'b',title:'Untitled'}]}});
  expect(prompt).toContain('currently unavailable; do not guess the count');
  expect(prompt).toContain('- Untitled');
  expect(prompt).not.toContain(' by ');
  expect(prompt).not.toContain(' — ');
 });
 it('keeps V2 mapped to the current V1 template until experiments change',()=>{expect(TEMPLATES.V2).toBe(TEMPLATES.V1);});
});