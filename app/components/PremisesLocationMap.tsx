'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const mapContainerStyle = { width: '100%', height: '100%' };

/** Default map view (eastern Saudi Arabia) when GPS is skipped after user clears coordinates */
const DEFAULT_CENTER = { lat: 26.4, lng: 50.1 };

type Props = {
  latitude: number | null;
  longitude: number | null;
  onChange: (coords: { latitude: number; longitude: number }) => void;
  /** When true, do not auto-request GPS; show default center until the user clicks or drags (after clearing coords). */
  skipAutoGeo?: boolean;
  /** Optional label for accessibility */
  label?: string;
  className?: string;
};

export default function PremisesLocationMap({
  latitude,
  longitude,
  onChange,
  skipAutoGeo = false,
  label = 'Premises map',
  className = '',
}: Props) {
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const geoRequestedRef = useRef(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const applyPosition = useCallback(
    (lat: number, lng: number) => {
      setCenter({ lat, lng });
      onChange({ latitude: lat, longitude: lng });
    },
    [onChange]
  );

  useEffect(() => {
    const hasSaved =
      latitude != null &&
      longitude != null &&
      !Number.isNaN(latitude) &&
      !Number.isNaN(longitude);
    if (hasSaved) {
      setCenter({ lat: latitude, lng: longitude });
      return;
    }

    if (skipAutoGeo) {
      setCenter(DEFAULT_CENTER);
      return;
    }

    if (geoRequestedRef.current) return;
    geoRequestedRef.current = true;

    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported. Use manual coordinates below or open in a supported browser.');
      setCenter(DEFAULT_CENTER);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        applyPosition(position.coords.latitude, position.coords.longitude);
      },
      (err) => {
        setGeoError(`Could not read GPS: ${err.message}. Set coordinates manually below or click the map when it loads.`);
        setCenter(DEFAULT_CENTER);
      }
    );
  }, [latitude, longitude, applyPosition, skipAutoGeo]);

  useEffect(() => {
    if (
      latitude != null &&
      longitude != null &&
      !Number.isNaN(latitude) &&
      !Number.isNaN(longitude)
    ) {
      setCenter({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude]);

  if (!apiKey) {
    return (
      <div className={`rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100 ${className}`}>
        <p className="font-medium">Map unavailable</p>
        <p className="mt-1 text-amber-100/80">
          Set <code className="rounded bg-black/20 px-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in your environment to use the
          same map as asset log location. You can still enter latitude and longitude manually.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {geoError && (
        <div className="mb-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90">
          {geoError}
        </div>
      )}
      <p className="mb-2 text-xs opacity-80" id="premises-map-help">
        Same map behavior as asset log location: drag the marker or click the map to set coordinates (optional).
      </p>
      <div className="h-[min(400px,55vh)] w-full overflow-hidden rounded-lg border border-white/10">
        {center ? (
          <LoadScript googleMapsApiKey={apiKey}>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={16}
              onClick={(e) => {
                if (e.latLng) {
                  applyPosition(e.latLng.lat(), e.latLng.lng());
                }
              }}
              options={{
                mapTypeControl: false,
                streetViewControl: false,
              }}
              aria-label={label}
            >
              <Marker
                position={center}
                draggable
                onDragEnd={(e) => {
                  const lat = e.latLng?.lat();
                  const lng = e.latLng?.lng();
                  if (lat != null && lng != null) applyPosition(lat, lng);
                }}
              />
            </GoogleMap>
          </LoadScript>
        ) : (
          <div className="flex h-full items-center justify-center bg-black/20 text-sm opacity-70">
            Getting location…
          </div>
        )}
      </div>
    </div>
  );
}
