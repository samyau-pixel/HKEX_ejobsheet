const base = 'http://localhost:3001';

async function login(email, password){
  const res = await fetch(base+'/api/auth/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email, password })});
  return res.json();
}

async function api(path, token, opts={}){
  const headers = opts.headers || {};
  if (token) headers['Authorization'] = 'Bearer '+token;
  if (opts.body) headers['Content-Type'] = 'application/json';
  const res = await fetch(base+path, { method: opts.method||'GET', headers, body: opts.body?JSON.stringify(opts.body):undefined });
  const json = await res.json().catch(()=>null);
  return { status: res.status, json };
}

(async ()=>{
  console.log('SMOKE: login operator');
  const op = await login('operator@test.com','Password123!');
  console.log('OP LOGIN', op);
  const opToken = op.data?.token;
  if(!opToken) throw new Error('operator login failed');

  console.log('SMOKE: create template as operator');
  const tplBody = { name: 'Smoke Template '+Date.now(), description: 'smoke', jobs: [{ name: 'Job 1', order:1, procedures: [{ name: 'Step 1', order:1 }] }] };
  const createTpl = await api('/api/templates', opToken, { method: 'POST', body: tplBody });
  console.log('CREATE TPL', createTpl.status, createTpl.json);
  const tplId = createTpl.json?.data?.id;
  if(!tplId) throw new Error('template creation failed');

  console.log('SMOKE: login manager');
  const mg = await login('manager@test.com','Password123!');
  console.log('MG LOGIN', mg);
  const mgToken = mg.data?.token;
  if(!mgToken) throw new Error('manager login failed');

  console.log('SMOKE: approve template');
  const approve = await api('/api/templates/'+tplId+'/approve', mgToken, { method: 'POST' });
  console.log('APPROVE', approve.status, approve.json);

  console.log('SMOKE: operator create execution');
  const execCreate = await api('/api/execution-sheets', opToken, { method: 'POST', body: { templateId: tplId, name: 'Smoke Exec' } });
  console.log('EXEC CREATE', execCreate.status, execCreate.json);
  const execId = execCreate.json?.data?.id;
  if(!execId) throw new Error('execution create failed');

  console.log('SMOKE: get execution detail');
  const detail = await api('/api/execution-sheets/'+execId, opToken);
  console.log('DETAIL', detail.status, detail.json);
  const job = detail.json?.data?.jobs?.[0];
  if(!job) throw new Error('no jobs in execution');

  console.log('SMOKE: check-in');
  const checkin = await api('/api/execution-sheets/'+execId+'/check-in', opToken, { method: 'POST' });
  console.log('CHECKIN', checkin.status, checkin.json);

  console.log('SMOKE: mark job complete');
  const mark = await api('/api/execution-sheets/'+execId+'/jobs/'+job.job_id+'/complete', opToken, { method: 'POST' });
  console.log('MARK', mark.status, mark.json);

  console.log('SMOKE: complete execution');
  const complete = await api('/api/execution-sheets/'+execId+'/complete', opToken, { method: 'POST' });
  console.log('COMPLETE', complete.status, complete.json);

  console.log('SMOKE: done');
})().catch(e=>{ console.error('SMOKE-FAILED', e); process.exit(1); });
