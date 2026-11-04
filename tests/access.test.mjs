import test from 'node:test';
import assert from 'node:assert/strict';
import { isConfigured, isOwner, getSupabaseConfig } from '../lib/config.ts';
import { isSameOrigin, safeReturnPath } from '../lib/request.ts';

test('Owner access fails closed when owner configuration is absent',()=>{const old=process.env.RIDEBOOK_OWNER_EMAIL;delete process.env.RIDEBOOK_OWNER_EMAIL;assert.equal(isOwner('owner@example.invalid'),false);if(old!==undefined)process.env.RIDEBOOK_OWNER_EMAIL=old;});
test('Owner allowlist uses exact email matching, insensitive to case',()=>{const old=process.env.RIDEBOOK_OWNER_EMAIL;process.env.RIDEBOOK_OWNER_EMAIL='Owner@example.invalid';assert.equal(isOwner('owner@example.invalid'),true);assert.equal(isOwner('other@example.invalid'),false);assert.equal(isOwner('owner@example.invalid.attacker.invalid'),false);assert.equal(isOwner(null),false);if(old===undefined)delete process.env.RIDEBOOK_OWNER_EMAIL;else process.env.RIDEBOOK_OWNER_EMAIL=old;});
test('Unset database configuration never creates a working auth state',()=>{const keys=['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','RIDEBOOK_OWNER_EMAIL'];const previous=keys.map(k=>process.env[k]);keys.forEach(k=>delete process.env[k]);assert.equal(getSupabaseConfig(),null);assert.equal(isConfigured(),false);keys.forEach((k,i)=>{if(previous[i]!==undefined)process.env[k]=previous[i]});});
test('Cross-origin browser writes are rejected',()=>{assert.equal(isSameOrigin(new Request('https://ridebook.example/api/book',{headers:{origin:'https://attacker.example'}})),false);assert.equal(isSameOrigin(new Request('https://ridebook.example/api/book',{headers:{origin:'https://ridebook.example'}})),true);});
test('Auth redirects only accept explicitly supported internal paths',()=>{for(const target of ['https://attacker.invalid','//attacker.invalid','/\\attacker.invalid','/other',null])assert.equal(safeReturnPath(target),'/');assert.equal(safeReturnPath('/update-password'),'/update-password');});
