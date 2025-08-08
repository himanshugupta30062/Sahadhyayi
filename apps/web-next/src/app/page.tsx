import HomeWrapper from '../components/HomeWrapper';

export const revalidate = 60;

export default function HomePage() {
  return (
    <div suppressHydrationWarning>
      <HomeWrapper />
    </div>
  );
}
