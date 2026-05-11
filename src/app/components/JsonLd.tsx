export default function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: "Elite Medical Concierge",
    image: "https://www.flelitemedical.com/og.png",
    url: "https://www.flelitemedical.com",
    telephone: "+1-407-663-7447",
    email: "elitemedicalconcierge@gmail.com",
    priceRange: "$500-$1500/mo",
    address: {
      "@type": "PostalAddress",
      streetAddress: "1201 South Orlando Ave, Suite 132",
      addressLocality: "Maitland",
      addressRegion: "FL",
      postalCode: "32751",
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 28.6225,
      longitude: -81.3637,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:00",
        closes: "18:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "09:00",
        closes: "13:00",
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5.0",
      reviewCount: "26",
    },
    sameAs: [
      "https://www.facebook.com/people/Elite-Medical-Concierge/61579127272025/",
      "https://www.instagram.com/elite_medical_concierge/",
    ],
    medicalSpecialty: [
      "InternalMedicine",
      "Geriatric",
      "PreventiveMedicine",
    ],
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
