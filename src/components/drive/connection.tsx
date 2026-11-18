'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/client';
export function DriveConnection({configured}:{configured:boolean}){
  const [connected,setConnected]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  useEffect(()=>{if(configured)apiRequest<{connected:boolean}>('/api/integrations/drive').then(data=>setConnected(data.connected)).catch(reason=>setError(reason.message));},[configured]);
  async function disconnect(){setBusy(true);setError('');try{await apiRequest('/api/integrations/drive',{method:'DELETE'});setConnected(false);}catch(reason){setError(reason instanceof Error?reason.message:'Disconnect failed.');}finally{setBusy(false);}}
  return <section className="panel info-panel"><h2>Google Drive authorization</h2><p>{connected?'A Google grant is stored. Sync an individual saved post from your library.':'Connect your own Google account to export saved drafts as text files. Database saves remain separate.'}</p>{error&&<p role="alert" className="error-text">{error}</p>}{configured?<a className="button primary" href="/api/integrations/drive/connect">{connected?'Reconnect Google Drive':'Connect Google Drive'}</a>:<p>Configure Google OAuth, encryption and server token storage first.</p>}{connected&&<button className="text-button" disabled={busy} onClick={disconnect}>Disconnect and revoke grant</button>}<p className="caption-note">First apply migration 004 for private token storage. Consent, refresh and actual file creation require live testing.</p></section>;
}
