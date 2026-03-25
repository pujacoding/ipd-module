const express = require('express');
const router = express.Router();
const controller = require('../controllers/patientController');

router.post('/add', controller.addPatient);
router.get('/all', controller.getPatients);
router.put('/:id', controller.updatePatient);
router.post('/update/:id', controller.updatePatient);

module.exports = router;
