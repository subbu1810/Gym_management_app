import axios from 'axios';

const API_URL = 'http://localhost:5000/api/settings';

const getSettings = async () => {
    try {
        const response = await axios.get(API_URL);
        if (response.data.success) {
            return response.data.settings;
        }
        throw new Error('Failed to fetch settings');
    } catch (error) {
        console.error('Settings fetch error:', error);
        throw error;
    }
};

const updateSettings = async (settingsData) => {
    try {
        // Need to send token for admin? Assuming admin uses same token or this is a basic setup
        const response = await axios.put(API_URL, settingsData);
        return response.data;
    } catch (error) {
        console.error('Settings update error:', error);
        throw error;
    }
};

const settingsService = {
    getSettings,
    updateSettings
};

export default settingsService;
