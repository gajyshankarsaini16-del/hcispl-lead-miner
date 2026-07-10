type GeocodeResult = {
  latitude: number;
  longitude: number;
  city: string | null;
  region: string | null;
  country: string | null;
};

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const key = process.env.POSITIONSTACK_API_KEY;
  if (!key || !address) return null;
  try {
    const res = await fetch(
      `http://api.positionstack.com/v1/forward?access_key=${key}&query=${encodeURIComponent(address)}&limit=1`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const first = data?.data?.[0];
    if (!first) return null;
    return {
      latitude: first.latitude,
      longitude: first.longitude,
      city: first.locality ?? null,
      region: first.region ?? null,
      country: first.country ?? null,
    };
  } catch {
    return null;
  }
}