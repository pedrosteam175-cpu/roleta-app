'use client';
import dynamic from 'next/dynamic';

const RoletaApp = dynamic(() => import('@/components/RoletaApp'), { ssr: false });

export default function Home() {
  return <RoletaApp />;
}
