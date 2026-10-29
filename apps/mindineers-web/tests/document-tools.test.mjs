import test from 'node:test';
import assert from 'node:assert/strict';
import {documentOutline,sheetSeries} from '../src/domains/product/document-tools.ts';
test('document outline ignores fenced code and retains exact selection offsets',()=>{
 const body='# Brief\n\n```md\n# Not a heading\n```\n## Outcome\n';
 assert.deepEqual(documentOutline(body),[{title:'Brief',level:1,offset:0},{title:'Outcome',level:2,offset:body.indexOf('## Outcome')}]);
});
test('sheet chart includes signed values and formulas but reports invalid data instead of inventing zeroes',()=>{
 const rows=[['Label','Value'],['Revenue','12'],['Adjustment','-3'],['Net','=B2+B3'],['Invalid','=B5'],['Missing',''],['','']];
 const result=sheetSeries(rows,0,1,true);
 assert.deepEqual(result.points.map(point=>point.value),[12,-3,9]);
 assert.equal(result.omitted,2);
});
