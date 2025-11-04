import api from '../services/api';

const handleVoiceCloning = async (audioFile) => {
    try {
        const formData = new FormData();
        formData.append('audio', audioFile);

        const response = await api.post('/clone-voice', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    } catch (error) {
        console.error('Error cloning voice:', error);
        throw error;
    }
};
