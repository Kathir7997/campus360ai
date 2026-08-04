import Hero from './Hero';

/**
 * Landing — public-facing landing page rendered at "/"
 * when the user is not authenticated.
 *
 * Only the Hero section is needed per spec; additional
 * sections (Features, Pricing, About) can be added below.
 */
const Landing = () => {
  return (
    <main>
      <Hero />
      {/* Future sections (Features, Pricing, About) go here */}
    </main>
  );
};

export default Landing;
