const express = require('express');
const router = express.Router();
const { getInvitationTemplates, seedTemplates, getTemplateById, fixExistingTemplateShapes } = require('../controllers/invitationTemplate.controller');

router.get('/', getInvitationTemplates);
router.post('/seed', seedTemplates);
router.get('/migrate/fix-shapes', fixExistingTemplateShapes);
router.get('/:id', getTemplateById);
module.exports = router;