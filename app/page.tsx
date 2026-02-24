import dynamic from 'next/dynamic';

const BlurGenerator = dynamic(() => import('@/features/blur-generator'));

export default function Page() {
  return <BlurGenerator />;
}