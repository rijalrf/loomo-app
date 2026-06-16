import { Suspense } from 'react';
import EditorClient from '../../components/EditorClient';

export const dynamic = 'force-dynamic';

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0B0F19',
        color: '#94A3B8',
        fontFamily: 'sans-serif'
      }}>
        Loading editor...
      </div>
    }>
      <EditorClient />
    </Suspense>
  );
}
