import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

export const useGeoLocation = () => {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const requestLocation = async () => {
        setLoading(true);
        let { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
            setErrorMsg('Permission to access location was denied');
            Alert.alert('Permission denied', 'Location access is required for attendance.');
            setLoading(false);
            return null;
        }

        try {
            // High accuracy is crucial for 50m radius
            let loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Highest,
            });
            setLocation(loc);
            setLoading(false);
            return loc;
        } catch (e) {
            setErrorMsg('Error fetching location');
            setLoading(false);
            return null;
        }
    };

    return { location, errorMsg, loading, requestLocation };
};
