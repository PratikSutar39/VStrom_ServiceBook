'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CircleAlert, X } from 'lucide-react';
import type { Book } from '../lib/model';
export default function ImportDialog({book,onImport,onClose}: {book: Book; onImport: () => Promise<void>; onClose: () => void}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  useEffect(() => {dialog.current?.showModal();return () => dialog.current?.close();}, []);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError('');
    try { await onImport(); onClose(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <dialog ref={dialog} className="modal" aria-label="Import ridebook records" onCancel={e => {e.preventDefault();if(!busy)onClose();}}>
    <div className="modal-head"><div><span className="eyebrow">MOVE YOUR RECORDS</span><h2>Import this ridebook?</h2></div><button className="icon-btn" disabled={busy} aria-label="Close import" onClick={onClose}><X size={20}/></button></div>
    <form className="editor-form" onSubmit={submit}><fieldset disabled={busy}>
      <p className="form-intro">This replaces the records in this account with your selected export. Export your current records first if you want to keep a backup.</p>
      <div className="import-counts"><span><strong>{book.readings.length}</strong>Readings</span><span><strong>{book.services.length}</strong>Services</span><span><strong>{book.trips.length}</strong>Trips</span><span><strong>{book.reviews.length}</strong>Reviews</span></div>
      <p className="field-note">Imported dates and inspection results are preserved. Old readings and checks remain subject to the normal freshness rules.</p>
      <label className="checkbox-label"><input type="checkbox" required/><span>I want to replace this account’s records with this export.</span></label>
      {error && <div className="form-error" role="alert"><CircleAlert size={17}/>{error}</div>}
      <div className="form-actions"><span className="grow"/><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary">{busy ? 'Importing…' : 'Import records'}</button></div>
    </fieldset></form>
  </dialog>;
}
