// AdminBE/routes/topic.routes.js
const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topic.controller');

router.get('/public', topicController.getPublicTopics);

router.route('/')
    .get(topicController.getAllTopics)
    .post(topicController.createTopic);

router.route('/update-order')
    .put(topicController.updateTopicOrder);

router.route('/:id')
    .put(topicController.updateTopic)
    .delete(topicController.deleteTopic);

module.exports = router;