import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'URL Lens - The Complete URL Analysis Platform';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '40px',
          }}
        >
          <svg
            width="80"
            height="80"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="16" cy="16" r="16" fill="rgba(255,255,255,0.2)" />
            <circle
              cx="13"
              cy="13"
              r="6"
              stroke="white"
              strokeWidth="2.5"
              fill="none"
            />
            <line
              x1="17.5"
              y1="17.5"
              x2="24"
              y2="24"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          <span
            style={{
              fontSize: '64px',
              fontWeight: 800,
              color: 'white',
            }}
          >
            URL Lens
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '36px',
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'center',
            maxWidth: '800px',
          }}
        >
          The Complete URL Analysis Platform
        </div>

        {/* Features */}
        <div
          style={{
            display: 'flex',
            gap: '30px',
            marginTop: '50px',
          }}
        >
          {['Scrapability', 'SEO Analysis', 'Bot Detection', 'Visual Timeline'].map(
            (feature) => (
              <div
                key={feature}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '20px',
                }}
              >
                {feature}
              </div>
            )
          )}
        </div>

        {/* Domain */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            fontSize: '24px',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          galasar.com
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
