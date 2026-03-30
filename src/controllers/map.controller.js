// Backend/controllers/map.controller.js
const axios = require('axios');

/**
 * Cung cấp API key cho client một cách an toàn.
 */
exports.getMapsConfig = (req, res) => {
    const apiKey = process.env.REACT_APP_Maps_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ message: 'Google Maps API Key chưa được cấu hình ở server.' });
    }
    res.status(200).json({ apiKey: apiKey });
};

/**
 * Lấy tọa độ (geocode) từ một địa chỉ text.
 */
exports.geocodeAddress = async (req, res, next) => {
    const { address } = req.query;
    if (!address) {
        return res.status(400).json({ message: 'Vui lòng cung cấp địa chỉ.' });
    }

    try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
                address: address,
                key: process.env.REACT_APP_Maps_API_KEY,
                language: 'vi'
            }
        });

        if (response.data.status === 'OK' && response.data.results.length > 0) {
            const result = response.data.results[0];
            const location = result.geometry.location;
            res.status(200).json({
                status: 'success',
                data: {
                    lat: location.lat,
                    lng: location.lng,
                    address: result.formatted_address
                }
            });
        } else {
            return res.status(404).json({ message: 'Không tìm thấy địa điểm cho địa chỉ này.' });
        }
    } catch (error) {
        next(error);
    }
};