// Google ko website ke baare me saaf jaankari dene wala chhupa hua data (JSON-LD). Screen par kuch nahi dikhta.
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // "<" ko badal dete hain taaki script tag beech me na tute
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
