// AdminBE/controllers/topic.controller.js
const topicService = require('../services/topic.service');

exports.getAllTopics = async (req, res, next) => {
    try {
        const topics = await topicService.getAllTopics();
        res.status(200).json({ status: 'success', data: topics });
    } catch (error) {
        next(error);
    }
};

exports.getPublicTopics = async (req, res, next) => {
    try {
        const topics = await topicService.getAllTopics(); // Tái sử dụng service có sẵn
        res.status(200).json({ status: 'success', data: topics });
    } catch (error) {
        next(error);
    }
};

exports.createTopic = async (req, res, next) => {
    try {
        const newTopic = await topicService.createTopic(req.body);
        res.status(201).json({ status: 'success', data: newTopic });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Lỗi: Tên hoặc slug của chủ đề đã tồn tại.' });
        }
        next(error);
    }
};

exports.updateTopic = async (req, res, next) => {
    try {
        const updatedTopic = await topicService.updateTopic(req.params.id, req.body);
        if (!updatedTopic) return res.status(404).json({ message: 'Không tìm thấy chủ đề' });
        res.status(200).json({ status: 'success', data: updatedTopic });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Lỗi: Tên hoặc slug của chủ đề đã tồn tại.' });
        }
        next(error);
    }
};

exports.deleteTopic = async (req, res, next) => {
    try {
        const topic = await topicService.deleteTopic(req.params.id);
        if (!topic) return res.status(404).json({ message: 'Không tìm thấy chủ đề' });
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

exports.updateTopicOrder = async (req, res, next) => {
    try {
        await topicService.updateTopicOrder(req.body.topics);
        res.status(200).json({ status: 'success', message: 'Thứ tự chủ đề được cập nhật thành công.' });
    } catch (error) {
        next(error);
    }
};