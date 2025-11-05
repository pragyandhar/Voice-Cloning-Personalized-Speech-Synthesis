import api from '../services/api';

const handleVoiceCloning = async (audioFile, text) => {
    try {
        const formData = new FormData();
        formData.append('audio', audioFile);
        formData.append('text', text);

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

export default handleVoiceCloning;