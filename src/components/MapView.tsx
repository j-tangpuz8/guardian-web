import React, { useEffect, useRef } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { getAddressFromCoordinates } from '../utils/geocoding';

interface MapViewProps {
  currentLocation: {
    lat: number;
    lng: number;
  };
  incidentLocation: {
    lat: string;
    lng: string;
  };
  onClose: () => void;
}

const MapView: React.FC<MapViewProps> = ({ currentLocation, incidentLocation, onClose }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [currentAddress, setCurrentAddress] = React.useState<string>('');
  const [incidentAddress, setIncidentAddress] = React.useState<string>('');

  useEffect(() => {
    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    // Get addresses for both locations
    const getAddresses = async () => {
      const currentAddr = await getAddressFromCoordinates(
        currentLocation.lat.toString(),
        currentLocation.lng.toString()
      );
      const incidentAddr = await getAddressFromCoordinates(
        incidentLocation.lat,
        incidentLocation.lng
      );
      setCurrentAddress(currentAddr);
      setIncidentAddress(incidentAddr);
    };

    getAddresses();

    return () => {
      document.head.removeChild(script);
    };
  }, [currentLocation, incidentLocation]);

  useEffect(() => {
    if (mapRef.current && window.google) {
      const map = new window.google.maps.Map(mapRef.current, {
        center: {
          lat: (currentLocation.lat + parseFloat(incidentLocation.lat)) / 2,
          lng: (currentLocation.lng + parseFloat(incidentLocation.lng)) / 2
        },
        zoom: 12
      });

      // Add current location marker
      new window.google.maps.Marker({
        position: { lat: currentLocation.lat, lng: currentLocation.lng },
        map,
        title: 'Your Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#ffffff'
        }
      });

      // Add incident location marker
      new window.google.maps.Marker({
        position: { 
          lat: parseFloat(incidentLocation.lat), 
          lng: parseFloat(incidentLocation.lng) 
        },
        map,
        title: 'Incident Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#EA4335',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#ffffff'
        }
      });

      // Add directions service
      const directionsService = new window.google.maps.DirectionsService();
      const directionsRenderer = new window.google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#4285F4',
          strokeWeight: 5
        }
      });

      directionsService.route(
        {
          origin: { lat: currentLocation.lat, lng: currentLocation.lng },
          destination: { 
            lat: parseFloat(incidentLocation.lat), 
            lng: parseFloat(incidentLocation.lng) 
          },
          travelMode: window.google.maps.TravelMode.DRIVING
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(result);
          }
        }
      );
    }
  }, [currentLocation, incidentLocation]);

  return (
    <Box sx={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'white',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Box sx={{ 
        padding: 2,
        backgroundColor: '#1B4965',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6">
          Route to Incident
        </Typography>
        <Button 
          onClick={onClose}
          sx={{ 
            color: 'white',
            border: '1px solid white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          Close
        </Button>
      </Box>
      
      <Box sx={{ padding: 2, backgroundColor: '#f5f5f5' }}>
        <Typography>
          <strong>Your Location:</strong> {currentAddress}
        </Typography>
        <Typography>
          <strong>Incident Location:</strong> {incidentAddress}
        </Typography>
      </Box>

      <Box ref={mapRef} sx={{ flex: 1 }} />
    </Box>
  );
};

export default MapView; 