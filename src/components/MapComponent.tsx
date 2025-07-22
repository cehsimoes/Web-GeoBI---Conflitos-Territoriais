// Import necessary components from react-leaflet to render the map and GeoJSON layers
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
// Import Leaflet CSS for proper map rendering
import 'leaflet/dist/leaflet.css';
// Import React hooks for managing component state and side effects
import { useEffect, useState } from 'react';

// Define the props expected by the MapComponent
interface Props {
  onAnalysisReady: (analysisData: any[]) => void; // Callback to notify when analysis data is ready (currently unused)
  selectedStates: string[]; // Array of selected state abbreviations (currently unused)
}

// Main functional component that renders a Leaflet map with GeoJSON data
export default function MapComponent({ onAnalysisReady, selectedStates }: Props) {
  // State to store features of rural properties (imóveis)
  const [imoveis, setImoveis] = useState<any[]>([]);
  // State to store features of indigenous lands (terras indígenas)
  const [terrasIndigenas, setTerrasIndigenas] = useState<any[]>([]);

  // Effect to fetch rural properties GeoJSON data from the public folder on initial render
  useEffect(() => {
    fetch('/data/imoveis.geojson')
      .then((res) => res.json())
      .then((data) => setImoveis(data.features || [])); // Store features in state
  }, []);

  // Effect to fetch indigenous lands GeoJSON data from the public folder on initial render
  useEffect(() => {
    fetch('/data/terras_indigenas.geojson')
      .then((res) => res.json())
      .then((data) => setTerrasIndigenas(data.features || [])); // Store features in state
  }, []);

  // Render the map container centered on Brazil with a base tile layer and two GeoJSON layers
  return (
    <MapContainer center={[-14.2, -51.9]} zoom={4} style={{ height: '500px', width: '100%' }}>
      {/* Base map layer from OpenStreetMap */}
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      {/* GeoJSON layer for rural properties in blue */}
      <GeoJSON data={{ type: 'FeatureCollection', features: imoveis }} style={{ color: 'blue' }} />
      {/* GeoJSON layer for indigenous lands in green */}
      <GeoJSON data={{ type: 'FeatureCollection', features: terrasIndigenas }} style={{ color: 'green' }} />
    </MapContainer>
  );
}
