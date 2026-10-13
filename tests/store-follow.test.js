import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../server/src/models/User.js';
import storeRoutes from '../server/src/routes/storeRoutes.js';
import { safeReturnPath } from '../client/src/utils/authReturn.js';
test('authentication returns allow local pages including query and hash but reject external or auth loops', () => {
 for (const path of ['/store/abc/name?sort=newest#products','/product/outfit']) assert.equal(safeReturnPath(path),path);
 for (const path of ['https://evil.test','//evil.test','/\\evil.test','/login','/register?x=1',null]) assert.equal(safeReturnPath(path),'/');
});
test('store follows require a customer session and persist idempotently without exposing followers', async () => {
 const customer='66aa11bb22cc33dd44ee5501', seller='66aa11bb22cc33dd44ee5500';
 const original={find:User.findById,update:User.updateOne,secret:process.env.JWT_SECRET};
 process.env.JWT_SECRET='test-store-follow-secret'; const follows=new Set(); let role='customer';
 User.findById=(id)=>({select(){return this;},lean:async()=>({_id:seller,accountType:'platform_admin'}),then(resolve){return Promise.resolve({_id:customer,accountType:role,sessionVersion:0,followedStores:[...follows]}).then(resolve);}});
 User.updateOne=async (filter,update)=>{assert.equal(filter._id,customer); if(update.$addToSet) follows.add(update.$addToSet.followedStores); else follows.delete(update.$pull.followedStores); return {modifiedCount:1};};
 const app=express(); app.use('/stores',storeRoutes); const server=app.listen(0,'127.0.0.1'); await new Promise(resolve=>server.once('listening',resolve));
 const url=`http://127.0.0.1:${server.address().port}/stores/${seller}/follow`;
 const headers={Authorization:`Bearer ${jwt.sign({id:customer,sessionVersion:0},process.env.JWT_SECRET)}`};
 try {
 assert.equal((await fetch(url,{method:'PUT'})).status,401);
 role='seller'; assert.equal((await fetch(url,{method:'PUT',headers})).status,403); role='customer';
 for(let i=0;i<2;i++) assert.deepEqual(await (await fetch(url,{method:'PUT',headers})).json(),{following:true}); assert.equal(follows.size,1);
 const response=await fetch(url,{headers}); assert.equal(response.headers.get('cache-control'),'private, no-store'); assert.deepEqual(await response.json(),{following:true});
 assert.deepEqual(await (await fetch(url,{method:'DELETE',headers})).json(),{following:false}); assert.equal(follows.size,0);
 assert.equal((await fetch(url.replace(seller,'invalid'),{method:'PUT',headers})).status,404);
 }finally{User.findById=original.find;User.updateOne=original.update;if(original.secret===undefined) delete process.env.JWT_SECRET;else process.env.JWT_SECRET=original.secret;await new Promise(resolve=>server.close(resolve));}
});
