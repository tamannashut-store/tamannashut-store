import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { customerOtpHandlers } from '../server/src/services/customerOtpService.js';
import User from '../server/src/models/User.js';
import { prepareCustomerEmailIndex } from '../server/src/utils/customerEmailIndex.js';
import { normalizeCustomer } from '../server/src/services/orderService.js';
process.env.JWT_SECRET = 'customer-otp-test-secret';
const response = () => ({ statusCode: 200, status(n) { this.statusCode=n; return this; }, set() { return this; }, json(body) { this.body=body; return this; } });
const matches = (doc, filter) => doc && Object.entries(filter).every(([key,value]) => {
  if (key === '$or') return value.some(f => matches(doc,f));
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    if ('$lt' in value) return doc[key] < value.$lt;
    if ('$lte' in value) return doc[key] <= value.$lte;
    if ('$gt' in value) return doc[key] > value.$gt;
    if ('$ne' in value) return doc[key] !== value.$ne;
    if ('$type' in value) return doc[key] instanceof Date;
  }
  return value == null ? doc[key] == null : String(doc[key]) === String(value);
});
function fixture(existing = []) {
  const records = []; const users = [...existing]; let mailCode, sends=0, fail=false, smsApproved=true;
  const update = (list,filter,change,options={}) => {
    let row=list.find(doc=>matches(doc,filter));
    if (!row && options.upsert) {
      if (list.some(doc=>doc.key===filter.key)) throw Object.assign(new Error('Duplicate'),{code:11000});
      row={_id:'66aa11bb22cc33dd44ee55ff',key:filter.key};list.push(row);
    }
    if (!row) return null;
    Object.assign(row,change.$set||{});
    for (const [key,value] of Object.entries(change.$inc||{})) row[key]=(row[key]||0)+value;
    for (const key of Object.keys(change.$unset||{})) delete row[key];
    return {...row};
  };
  const handlers=customerOtpHandlers({
    users:{findOne:async f=>users.find(doc=>matches(doc,f)),create:async doc=>{if(users.some(u=>doc.email ? u.email===doc.email : u.phoneNormalized===doc.phoneNormalized)) throw Object.assign(new Error('Duplicate'),{code:11000}); const u={...doc,_id:'77bb22cc33dd44ee55ff6600',sessionVersion:0};users.push(u);return u;},findOneAndUpdate:async(f,u,o)=>update(users,f,u,o)},
    challenges:{findOneAndUpdate:async(f,u,o)=>update(records,f,u,o), updateOne:async(f,u)=>update(records,f,u)},
    email:async(_to,_subject,html)=>{sends++;mailCode=html.match(/<strong>(\d+)<\/strong>/)[1];return {sent:!fail};},
    sms:async()=>{sends++;if(fail)throw new Error('SMS failed');},checkSms:async()=>({status:smsApproved?'approved':'pending'}),
    sessionPayload:u=>({token:'session',user:{id:u._id,email:u.email,phone:u.phone}}),
  });
  return {handlers,users,records,code:()=>mailCode,sends:()=>sends,fail:()=>{fail=true;},rejectSms:()=>{smsApproved=false;}};
}
const send=async(f,body,user)=>{const r=response();await f.handlers.send({body,user},r);return r;};
const check=async(f,token,code,user,purpose)=>{const r=response();await f.handlers.check({body:{challengeToken:token,code},user,otpPurpose:purpose},r);return r;};
const emailSignup={purpose:'register',channel:'email',contact:'parent@example.com',termsAccepted:true};
const phoneSignup={...emailSignup,channel:'phone',contact:'9876543210'};
test('email signup creates a passwordless customer only after verifying their one contact',async()=>{
  const f=fixture(),r=await send(f,emailSignup);assert.equal(r.statusCode,200);assert.equal(f.users.length,0);
  assert.notEqual(f.records[0].codeHash,f.code());const result=await check(f,r.body.challengeToken,f.code());
  assert.equal(result.statusCode,200);assert.equal(f.users[0].email,emailSignup.contact);assert.equal(f.users[0].phone,undefined);assert.equal(f.users[0].password,undefined);assert.equal(f.users[0].passwordLoginEnabled,false);assert.ok(f.users[0].termsAcceptedAt);assert.ok(f.users[0].emailVerifiedAt);
  assert.equal((await check(f,r.body.challengeToken,f.code())).statusCode,400);
});
test('mobile signup needs no email, name or password and normalizes the verified number',async()=>{
  const f=fixture(),r=await send(f,phoneSignup);const result=await check(f,r.body.challengeToken,'123456');assert.equal(result.statusCode,200);assert.equal(f.users[0].name,'Customer');assert.equal(f.users[0].email,undefined);assert.equal(f.users[0].phoneNormalized,'+919876543210');assert.ok(f.users[0].phoneVerifiedAt);
});
test('incorrect codes are limited to five attempts and cannot create users',async()=>{
  const f=fixture(),r=await send(f,emailSignup);for(let i=0;i<5;i++)assert.equal((await check(f,r.body.challengeToken,'000000')).statusCode,400);assert.equal((await check(f,r.body.challengeToken,f.code())).statusCode,400);assert.equal(f.users.length,0);
});
test('concurrent verification consumes a challenge only once',async()=>{
  const f=fixture(),r=await send(f,emailSignup);const results=await Promise.all([check(f,r.body.challengeToken,f.code()),check(f,r.body.challengeToken,f.code())]);assert.deepEqual(results.map(r=>r.statusCode).sort(),[200,400]);assert.equal(f.users.length,1);
});
test('resend cooldown limits delivery and delivery failure never creates an account',async()=>{
  const f=fixture();await send(f,emailSignup);assert.equal((await send(f,emailSignup)).statusCode,429);assert.equal(f.sends(),1);
  const failed=fixture();failed.fail();assert.equal((await send(failed,phoneSignup)).statusCode,502);assert.equal(failed.users.length,0);assert.equal(failed.records[0].ready,false);assert.equal(failed.records[0].sentAt,null);
});
test('signup rejects existing contacts and requires terms consent',async()=>{
  const f=fixture([{email:emailSignup.contact}]);assert.equal((await send(f,emailSignup)).statusCode,409);assert.equal((await send(f,{...phoneSignup,termsAccepted:false})).statusCode,400);assert.equal(f.sends(),0);
});
test('expired, forged, or purpose-mismatched challenges never authorize signup',async()=>{
  const f=fixture(),r=await send(f,emailSignup);assert.equal((await check(f,r.body.challengeToken,f.code(),undefined,'login')).statusCode,400);assert.equal((await check(f,'forged','123456')).statusCode,400);f.records[0].expiresAt=new Date(0);assert.equal((await check(f,r.body.challengeToken,f.code())).statusCode,400);assert.equal(f.users.length,0);
});
test('email code login verifies customer email and rejects seller/admin accounts',async()=>{
  const user={_id:'66aa11bb22cc33dd44ee55ff',email:emailSignup.contact,accountType:'customer',sessionVersion:2};
  const f=fixture([user]),r=await send(f,{...emailSignup,purpose:'login'});assert.equal((await check(f,r.body.challengeToken,f.code())).statusCode,200);assert.ok(f.users[0].emailVerifiedAt);
  for(const role of ['seller','platform_admin']){const rejected=fixture([{...user,accountType:role}]);assert.equal((await send(rejected,{...emailSignup,purpose:'login'})).statusCode,400);assert.equal(rejected.sends(),0);}
});
test('password or session changes invalidate outstanding login codes',async()=>{
  const user={_id:'66aa11bb22cc33dd44ee55ff',email:emailSignup.contact,accountType:'customer',sessionVersion:0};const f=fixture([user]),r=await send(f,{...emailSignup,purpose:'login'});user.sessionVersion++;assert.equal((await check(f,r.body.challengeToken,f.code())).statusCode,400);
});
test('deletion verification is bound to the authenticated customer and issues a short-lived proof',async()=>{
  const user={_id:'66aa11bb22cc33dd44ee55ff',email:emailSignup.contact,accountType:'customer',sessionVersion:0};const f=fixture([user]);assert.equal((await send(f,{purpose:'delete'})).statusCode,403);const r=await send(f,{purpose:'delete'},user);assert.equal((await check(f,r.body.challengeToken,f.code())).statusCode,400);const proof=await check(f,r.body.challengeToken,f.code(),user,'delete');assert.equal(proof.statusCode,200);const token=jwt.verify(proof.body.deletionToken,process.env.JWT_SECRET);assert.equal(token.type,'customer-delete');assert.equal(token.id,user._id);assert.equal(token.exp-token.iat,300);
});
test('multiple mobile-only users validate without email/password while privileged users require them',async()=>{
  for(const phone of ['+919876543210','+919876543211']){const user=new User({name:'Customer',accountType:'customer',phone,phoneNormalized:phone,phoneVerifiedAt:new Date(),passwordLoginEnabled:false});assert.equal(user.validateSync(),undefined);}
  const privileged=new User({name:'Admin',accountType:'platform_admin',passwordLoginEnabled:false});assert.ok(privileged.validateSync().errors.email);assert.ok(privileged.validateSync().errors.password);
});
test('email index migration preserves uniqueness before dropping the legacy full index',async()=>{
  const calls=[];await prepareCustomerEmailIndex({createIndex:async(k,o)=>calls.push(['create',k,o]),indexes:async()=>[{name:'email_1',key:{email:1},unique:true},{name:'user_email_unique',key:{email:1},unique:true,partialFilterExpression:{email:{$type:'string'}}}],dropIndex:async n=>calls.push(['drop',n])});assert.equal(calls[0][0],'create');assert.deepEqual(calls[0][2].partialFilterExpression,{email:{$type:'string'}});assert.deepEqual(calls[1],['drop','email_1']);
});
test('mobile-only checkout accepts a full shipping address without email but validates optional email',()=>{
  const customer={name:'Test Parent',phone:'9876543210',address:'12 Sample Street',city:'Mumbai',pincode:'400001'};assert.equal(normalizeCustomer(customer).email,'');assert.throws(()=>normalizeCustomer({...customer,email:'invalid'}),/valid email/);assert.throws(()=>normalizeCustomer({...customer,address:''}),/delivery address/);
});

test('verification and deletion tokens cannot be used as authenticated sessions', async () => {
  const { protect, optionalProtect } = await import('../server/src/middleware/authMiddleware.js');
  for (const type of ['customer-phone-login', 'seller-centre-2fa', 'customer-otp', 'customer-delete']) {
    const token=jwt.sign({id:'66aa11bb22cc33dd44ee55ff',type,sessionVersion:0},process.env.JWT_SECRET,{expiresIn:'5m'});
    const req={headers:{authorization:`Bearer ${token}`}},r=response();let nextCalls=0;
    await protect(req,r,()=>nextCalls++);assert.equal(r.statusCode,401);assert.equal(nextCalls,0);
    await optionalProtect(req,r,()=>nextCalls++);assert.equal(nextCalls,1);assert.equal(req.user,undefined);
  }
});
test('mobile-only shipment uses the actual store inbox without assigning a false customer email',async()=>{
  const { shipmentContactEmail }=await import('../server/src/services/shiprocketService.js');
  const customer={phone:'+919876543210'};assert.equal(shipmentContactEmail(customer),process.env.ADMIN_EMAIL||'support@tamannashut.com');assert.equal(customer.email,undefined);assert.equal(shipmentContactEmail({email:'parent@example.com'}),'parent@example.com');
});

test('mobile-only refund requests remain in the account without attempting an email',async()=>{
  const {notifyRefundDetails}=await import('../server/src/services/refundDetailsNotification.js');
  const result=await notifyRefundDetails({_id:'66aa11bb22cc33dd44ee55ff',status:'Refund Pending',paymentMethod:'COD',paymentStatus:'Paid',refund:{}},{model:{findOneAndUpdate:()=>{throw new Error('Email should not be claimed');}},send:()=>{throw new Error('No email should be sent');}});assert.deepEqual(result,{sent:false,skipped:true});
});


test('mobile-only customers can attach a verified email without replacing their account',async()=>{
  const user={_id:'66aa11bb22cc33dd44ee55ff',accountType:'customer',sessionVersion:0,phone:'+919876543210'};const f=fixture([user]);
  const r=await send(f,{purpose:'link-email',channel:'email',contact:emailSignup.contact},user);assert.equal(r.statusCode,200);
  const result=await check(f,r.body.challengeToken,f.code(),user,'link-email');assert.equal(result.statusCode,200);
  assert.equal(f.users.length,1);assert.equal(f.users[0]._id,user._id);assert.equal(f.users[0].phone,user.phone);assert.equal(f.users[0].email,emailSignup.contact);assert.ok(f.users[0].emailVerifiedAt);
  assert.equal((await check(f,r.body.challengeToken,f.code(),user,'link-email')).statusCode,400);
});

test('email linking rejects unauthenticated, wrong-account, reused-contact and existing-email requests',async()=>{
  const user={_id:'customer-one',accountType:'customer',sessionVersion:0};const f=fixture([user]);const request={purpose:'link-email',channel:'email',contact:emailSignup.contact};
  assert.equal((await send(f,request)).statusCode,403);
  const r=await send(f,request,user);assert.equal((await check(f,r.body.challengeToken,f.code(),{_id:'other'},'link-email')).statusCode,400);
  assert.equal((await check(f,r.body.challengeToken,f.code(),user,'login')).statusCode,400);
  const taken=fixture([user,{_id:'another',email:emailSignup.contact}]);assert.equal((await send(taken,request,user)).statusCode,409);
  assert.equal((await send(f,request,{...user,email:'existing@example.com'})).statusCode,403);
});
