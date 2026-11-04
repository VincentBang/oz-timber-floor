import test from 'node:test';
import assert from 'node:assert/strict';
import {metresPerPixel,roomArea,roomsOverlap,MAX_POINTS,MAX_AREA} from '../floor-plan/geometry.mjs';

const points=(...pairs)=>pairs.map(([x,y])=>({x,y}));
const rect=(x,y,width,height)=>points([x,y],[x+width,y],[x+width,y+height],[x,y+height]);
const square=rect(0,0,100,80);
const reversed=poly=>[...poly].reverse();
test('known calibration in metres, centimetres or millimetres produces a 20 m² room',()=>{
  for (const [value,unit] of [[5,'m'],[500,'cm'],[5000,'mm']]) {
    const scale=metresPerPixel({x:5,y:5},{x:105,y:5},value,unit);
    assert.equal(scale,.05);
    assert.equal(roomArea(square,scale),20);
    assert.equal(roomArea(reversed(square),scale),20);
  }
});
test('uses Euclidean distance, not horizontal distance, for diagonal calibration',()=>{
  assert.equal(metresPerPixel({x:10,y:10},{x:13,y:14},1,'m'),.2);
});
test('invalid calibration fails before assigning a scale',()=>{
  for (const n of [0,-2,NaN,Infinity,1001]) assert.throws(()=>metresPerPixel({x:0,y:0},{x:2,y:2},n,'m'));
  for (const p of [{x:0,y:0},{x:1,y:0},{x:NaN,y:2}]) assert.throws(()=>metresPerPixel({x:0,y:0},p,5,'m'));
  assert.throws(()=>metresPerPixel({x:0,y:0},{x:2,y:0},5,'ft'));
});
test('a concave L-shaped room has only the floor area inside its outline',()=>{
  const room=points([0,0],[60,0],[60,20],[20,20],[20,60],[0,60]);
  assert.equal(roomArea(room,.1),20);
  assert.equal(roomArea(reversed(room),.1),20);
});
test('rejects open line, bow-tie, crossed, duplicate, self-touch and backtracking edges',()=>{
  const invalid=[
    points([0,0],[1,1]),points([0,0],[1,1],[2,2]),
    points([0,0],[4,4],[4,0],[0,4]),
    points([0,0],[4,0],[4,4],[2,-1],[0,4]),
    points([0,0],[4,0],[4,0],[0,4]),
    points([0,0],[4,0],[4,4],[2,0],[0,4]),
    points([0,0],[4,0],[2,0],[2,4],[0,4])
  ];
  for (const polygon of invalid) assert.throws(()=>roomArea(polygon,1));
});
test('supports straight intermediate corners around a valid room',()=>{
  assert.equal(roomArea(points([0,0],[2,0],[4,0],[4,4],[0,4]),1),16);
});
test('bounds vertex count, scale and output while preserving sub-square-metre rooms',()=>{
  assert.throws(()=>roomArea(Array(MAX_POINTS+1).fill({x:0,y:0}),1));
  assert.throws(()=>roomArea(points([NaN,2],[0,3],[1,4]),1));
  assert.throws(()=>roomArea(square,0));
  assert.throws(()=>roomArea(square,Infinity));
  assert.throws(()=>roomArea(rect(0,0,.05,.15),1));
  assert.throws(()=>roomArea(rect(0,0,MAX_AREA,10),1));
  assert.equal(roomArea(rect(0,0,2,2),.1).toFixed(2),'0.04');
});
test('positive interior overlap is detected independently of tracing direction and order',()=>{
  const base=rect(0,0,10,10);
  for (const other of [rect(2,2,2,2),rect(5,0,10,10),rect(4,-4,2,20),rect(-1,5,2,9),base,points([0,0],[10,10],[0,10])]) {
    for (const one of [base,reversed(base)]) for (const two of [other,reversed(other)]) {
      assert.equal(roomsOverlap(one,two),true);
      assert.equal(roomsOverlap(two,one),true);
    }
  }
});
test('sharing any length of a wall or a corner never adds overlapping area',()=>{
  const base=rect(0,0,10,10);
  for (const other of [rect(10,0,10,10),rect(10,2,2,2),rect(10,10,2,2),rect(11,1,1,1)]) {
    assert.equal(roomsOverlap(base,other),false);
    assert.equal(roomsOverlap(base,reversed(other)),false);
    assert.equal(roomsOverlap(other,base),false);
  }
});
test('a second rectangle can fill and touch the missing corner of an L',()=>{
  const l=points([0,0],[8,0],[8,2],[2,2],[2,8],[0,8]);
  assert.equal(roomsOverlap(l,rect(2,2,6,6)),false);
  assert.equal(roomsOverlap(l,rect(1,1,6,6)),true);
});
test('an area crossing a concave room through two aligned boundary vertices is detected',()=>{
  const l=points([0,0],[8,0],[8,2],[2,2],[2,8],[0,8]);
  const triangle=points([0,8],[8,0],[8,8]);
  assert.equal(roomsOverlap(l,triangle),true);
});
