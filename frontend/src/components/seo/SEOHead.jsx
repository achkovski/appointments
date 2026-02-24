const SEOHead = ({
  title = 'TimeSnap.io - Smart Appointment Booking for Every Business',
  description = 'Modern appointment scheduling software for salons, clinics, consultants, and every business in between. Free during beta. 24/7 online booking, automated reminders, and real-time analytics.',
  keywords = 'appointment booking, scheduling software, online booking system, appointment scheduler, business calendar, booking app, client scheduling, salon booking, clinic appointments',
  ogImage = `${window.location.origin}/og-image.png`,
  canonicalUrl = window.location.href,
}) => {
  return (
    <>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph (Facebook, LinkedIn) */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
    </>
  );
};

export default SEOHead;
