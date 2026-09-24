import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
// oxlint-disable-next-line actual/no-extraneous-dependencies -- node:test is a built-in Node.js module.
import test from 'node:test';

const directory = new URL('./local-russian/', import.meta.url);

function readCatalog(name) {
  return JSON.parse(readFileSync(new URL(name, directory), 'utf8'));
}

function markers(value) {
  return [...value.matchAll(/{{[^{}]+}}|<\/?\d+\s*\/?\s*>/g)]
    .map(match => match[0])
    .sort((a, b) => a.localeCompare(b));
}

void test('Russian catalog covers every source string', () => {
  const english = readCatalog('en.json');
  const russian = readCatalog('ru.json');

  const missing = Object.keys(english).filter(key => !russian[key]);
  assert.deepEqual(missing, []);
});

void test('Russian plural forms cover one, few, and many', () => {
  const english = readCatalog('en.json');
  const russian = readCatalog('ru.json');

  const plurals = Object.keys(english)
    .filter(key => key.endsWith('_one'))
    .map(key => key.slice(0, -4));
  const missing = plurals.flatMap(base =>
    ['one', 'few', 'many'].filter(form => !russian[`${base}_${form}`]),
  );
  assert.deepEqual(missing, []);
});

void test('translations retain interpolation and component markers', () => {
  const english = readCatalog('en.json');
  const russian = readCatalog('ru.json');

  const mismatches = Object.entries(english)
    .filter(
      ([key, value]) =>
        JSON.stringify(markers(value)) !==
        JSON.stringify(markers(russian[key] ?? '')),
    )
    .map(([key]) => key);
  assert.deepEqual(mismatches, []);
});
