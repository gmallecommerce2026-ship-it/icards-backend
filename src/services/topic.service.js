// AdminBE/services/topic.service.js
const Topic = require('../models/topic.model');
const { Page } = require('../models/page.model');

const getAllTopics = () => Topic.find().sort('order');

const createTopic = (topicData) => Topic.create(topicData);

const updateTopic = (id, topicData) => Topic.findByIdAndUpdate(id, topicData, { new: true, runValidators: true });

const deleteTopic = async (id) => {
    // Gỡ topic này ra khỏi tất cả các bài viết đang sử dụng nó
    await Page.updateMany({ topics: id }, { $pull: { topics: id } });
    return Topic.findByIdAndDelete(id);
};

const updateTopicOrder = (topics) => {
    const promises = topics.map((topic, index) => {
        return Topic.findByIdAndUpdate(topic.id, { order: index });
    });
    return Promise.all(promises);
};

module.exports = {
    getAllTopics,
    createTopic,
    updateTopic,
    deleteTopic,
    updateTopicOrder,
};