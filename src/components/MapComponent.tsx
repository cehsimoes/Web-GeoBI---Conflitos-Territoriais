import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';

interface Props {
  onAnalysisReady: (analysisData: any[]) => void;
  selectedStates: string[];
}

export default function MapComponent({ onAnalysisReady, selectedStates }: Props) {
  const [imoveis, setImoveis] = useState<any[]>([]);
  const [terrasIndigenas, setTerrasIndigenas] = useState<any[]>([]);

  useEffect(() => {
    // ✅ Corrigido: caminho relativo ao /public
    fetch('/data/imoveis.geojson')
      .then((res) => res.json())
      .then((data) => setImoveis(data.features || []));
  }, []);

  useEffect(() => {
    // ✅ Corrigido: caminho relativo ao /public
    fetch('/data/terras_indigenas.geojson')
      .then((res) => res.json())
      .then((data) => setTerrasIndigenas(data.features || []));
  }, []);

  return (
    <MapContainer center={[-14.2, -51.9]} zoom={4} style={{ height: '500px', width: '100%' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      <GeoJSON data={{ type: 'FeatureCollection', features: imoveis }} style={{ color: 'blue' }} />
      <GeoJSON data={{ type: 'FeatureCollection', features: terrasIndigenas }} style={{ color: 'green' }} />
    </MapContainer>
  );
}
