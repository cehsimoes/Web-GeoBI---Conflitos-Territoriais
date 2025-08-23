import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as turf from '@turf/turf';
import { Chart } from 'react-google-charts';

interface GeoJsonData {
  type: string;
  features: any[];
}

const estadosBrasileiros = ['AM', 'PA', 'MG'];

function FitBounds({ geojson }: { geojson: GeoJsonData | null }) {
  const map = useMap();

  useEffect(() => {
    if (geojson && geojson.features.length > 0) {
      const latLngs = [];

      geojson.features.forEach((feature) => {
        try {
          const bbox = turf.bbox(feature);
          latLngs.push([bbox[1], bbox[0]]);
          latLngs.push([bbox[3], bbox[2]]);
        } catch {}
      });

      if (latLngs.length > 0) {
        map.fitBounds(latLngs as any, { padding: [50, 50] });
      }
    }
  }, [geojson, map]);

  return null;
}

function getUF(feature: any): string {
  return (
    feature.properties?.sigla_uf ||
    feature.properties?.UF ||
    feature.properties?.estado ||
    ''
  );
}

function calcularAreaKm2(geojson: GeoJsonData | null): number {
  if (!geojson || geojson.features.length === 0) return 0;

  return (
    geojson.features.reduce((soma, feature) => {
      try {
        const area = turf.area(feature);
        return soma + area;
      } catch {
        return soma;
      }
    }, 0) / 1_000_000
  );
}

export default function App() {
  const [imoveis, setImoveis] = useState<GeoJsonData | null>(null);
  const [terras, setTerras] = useState<GeoJsonData | null>(null);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);

  function filtrarPorEstado(geojson: GeoJsonData | null, estados: string[]) {
    if (!geojson) return null;
    if (estados.length === 0) return geojson;

    const filteredFeatures = geojson.features.filter((f) => {
      const uf = getUF(f);
      return estados.includes(uf);
    });

    return {
      ...geojson,
      features: filteredFeatures,
    };
  }

  function calcularIntersecao(
    imoveisGeojson: GeoJsonData | null,
    terrasGeojson: GeoJsonData | null
  ) {
    if (
      !imoveisGeojson ||
      !terrasGeojson ||
      imoveisGeojson.features.length === 0 ||
      terrasGeojson.features.length === 0
    )
      return null;

    const intersecoes = [];

    imoveisGeojson.features.forEach((imovel) => {
      terrasGeojson.features.forEach((terra) => {
        try {
          const intersect = turf.intersect(imovel, terra);
          if (intersect) {
            intersecoes.push(intersect);
          }
        } catch {}
      });
    });

    return {
      type: 'FeatureCollection',
      features: intersecoes,
    };
  }

  const imoveisFiltrados = filtrarPorEstado(imoveis, selectedStates);
  const terrasFiltradas = terras;
  const intersecaoGeojson = calcularIntersecao(imoveisFiltrados, terras);

  const areaImoveisKm2 = calcularAreaKm2(imoveisFiltrados);
  const areaTerrasKm2 = calcularAreaKm2(terras);
  const areaIntersecaoKm2 = calcularAreaKm2(intersecaoGeojson);

  useEffect(() => {
    fetch('data/imoveis_fake_100.geojson')
      .then((res) => res.json())
      .then(setImoveis)
      .catch(() => setImoveis(null));

    fetch('data/terras_indigenas_fake.geojson')
      .then((res) => res.json())
      .then(setTerras)
      .catch(() => setTerras(null));
  }, []);

  function handleCheckboxChange(sigla: string) {
    setSelectedStates((prev) =>
      prev.includes(sigla) ? prev.filter((s) => s !== sigla) : [...prev, sigla]
    );
  }

  const chartDataBar = [
    ['State', 'Properties Number'],
    ...estadosBrasileiros.map((uf) => {
      const count =
        imoveisFiltrados?.features.filter((f) => getUF(f) === uf).length || 0;
      return [uf, count];
    }),
  ];

  const chartDataPie = [
    ['Tipo', 'Área (km²)'],
    ['Imóveis', areaImoveisKm2],
    ['Terras Indígenas', areaTerrasKm2],
    ['Interseção', areaIntersecaoKm2],
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* TÍTULO NO TOPO */}
      <header style={{ backgroundColor: '#1a237e', padding: '1rem', textAlign: 'center' }}>
        <h1 style={{ color: 'white', margin: 0, fontSize: '1.5rem' }}>
          WEB-GEOBI -- TERRITORIALS CONFLICTS
        </h1>
      </header>

      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* PAINEL LATERAL */}
        <aside
          style={{
            width: '320px',
            overflowY: 'auto',
            borderRight: '1px solid #ccc',
            padding: '1rem',
            backgroundColor: '#f9f9f9',
          }}
        >
          <h2>Filter by State</h2>
          <div style={{ maxHeight: 250, overflowY: 'auto', marginBottom: 20 }}>
            {estadosBrasileiros.map((sigla) => (
              <label key={sigla} style={{ display: 'block', marginBottom: 6 }}>
                <input
                  type="checkbox"
                  checked={selectedStates.includes(sigla)}
                  onChange={() => handleCheckboxChange(sigla)}
                />{' '}
                {sigla}
              </label>
            ))}
          </div>

          <h3>Area Summary (km²)</h3>
          {imoveisFiltrados?.features.length === 0 ? (
            <p style={{ color: 'red' }}>No data for selected state(s).</p>
          ) : (
            <>
              <p>
                <strong>Properties:</strong> {areaImoveisKm2.toFixed(2)}
              </p>
              <p>
                <strong>Indigenous Lands:</strong> {areaTerrasKm2.toFixed(2)}
              </p>
              <p>
                <strong>Intersection:</strong> {areaIntersecaoKm2.toFixed(2)}
              </p>
            </>
          )}

          <h3>Chart: Properties per State</h3>
          <Chart
            chartType="BarChart"
            width="100%"
            height="200px"
            data={chartDataBar}
            options={{
              legend: { position: 'none' },
              chartArea: { width: '80%' },
              hAxis: { title: 'Number of Properties' },
              vAxis: { title: 'State' },
            }}
          />

          <h3>Chart: Area by Type</h3>
          <Chart
            chartType="PieChart"
            width="100%"
            height="200px"
            data={chartDataPie}
            options={{
              pieHole: 0.4,
              legend: { position: 'right' },
            }}
          />
        </aside>

        {/* MAPA */}
        <main style={{ flexGrow: 1, position: 'relative' }}>
          <MapContainer
            style={{ height: '100%', width: '100%' }}
            center={[-15.8, -47.9]}
            zoom={4}
            scrollWheelZoom={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap contributors"
            />

            {imoveisFiltrados && imoveisFiltrados.features.length > 0 && (
              <GeoJSON
                data={imoveisFiltrados}
                style={{ color: 'blue', weight: 1, fillOpacity: 0.3 }}
              />
            )}

            {terrasFiltradas && terrasFiltradas.features.length > 0 && (
              <GeoJSON
                data={terrasFiltradas}
                style={{ color: 'green', weight: 1, fillOpacity: 0.3 }}
              />
            )}

            {intersecaoGeojson && intersecaoGeojson.features.length > 0 && (
              <GeoJSON
                data={intersecaoGeojson}
                style={{ color: 'red', weight: 2, fillOpacity: 0.4 }}
              />
            )}

            <FitBounds geojson={imoveisFiltrados} />
          </MapContainer>
        </main>
      </div>
    </div>
  );
}
