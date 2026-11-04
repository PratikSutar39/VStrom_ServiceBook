import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const ownerA='11111111-1111-4111-8111-111111111111';
const ownerB='22222222-2222-4222-8222-222222222222';

test('Postgres migration enforces private ownership, anonymous denial and revision checks', async t => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
      $$;
      grant usage on schema public, auth to anon, authenticated;
      grant execute on function auth.uid() to anon, authenticated;
      insert into auth.users(id) values ('${ownerA}'), ('${ownerB}');
    `);
    await db.exec(await readFile(new URL('../supabase/migrations/001_ridebooks.sql',import.meta.url),'utf8'));
    async function actAs(id){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated');}
    await t.test('An owner can insert and read their own book', async()=>{
      await actAs(ownerA);
      await db.query('insert into public.ridebooks(user_id,data) values ($1,$2)',[ownerA,{readings:[]}]);
      const r=await db.query('select user_id,revision from public.ridebooks');
      assert.equal(r.rows.length,1);assert.equal(r.rows[0].revision,1);
    });
    await t.test('A different account cannot read or modify that book',async()=>{
      await actAs(ownerB);
      assert.equal((await db.query('select * from public.ridebooks')).rows.length,0);
      const r=await db.query('update public.ridebooks set data=$1,revision=2 where user_id=$2 returning user_id',[{changed:true},ownerA]);
      assert.equal(r.rows.length,0);
      await assert.rejects(db.query('insert into public.ridebooks(user_id,data) values ($1,$2)',[ownerA,{}]),e=>e.code==='42501');
    });
    await t.test('Concurrent stale writes cannot replace newer data',async()=>{
      await actAs(ownerA);
      const first=await db.query('update public.ridebooks set data=$1,revision=2 where user_id=$2 and revision=1 returning revision',[{version:2},ownerA]);
      assert.equal(first.rows[0].revision,2);
      const stale=await db.query('update public.ridebooks set data=$1,revision=2 where user_id=$2 and revision=1 returning revision',[{version:'stale'},ownerA]);
      assert.equal(stale.rows.length,0);
      assert.deepEqual((await db.query('select data from public.ridebooks')).rows[0].data,{version:2});
    });
    await t.test('Direct writes cannot skip revision checks or change ownership',async()=>{
      await assert.rejects(db.query('update public.ridebooks set revision=9 where user_id=$1',[ownerA]));
      await assert.rejects(db.query('update public.ridebooks set user_id=$1,revision=3 where user_id=$2',[ownerB,ownerA]));
    });
    await t.test('An anonymous visitor has no read or write privilege',async()=>{
      await db.exec('reset role; set role anon');
      await assert.rejects(db.query('select * from public.ridebooks'),e=>e.code==='42501');
      await assert.rejects(db.query('insert into public.ridebooks(user_id,data) values ($1,$2)',[ownerB,{}]),e=>e.code==='42501');
    });
  } finally { await db.close(); }
});
