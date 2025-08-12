const express = require('express');
const router = express.Router();
const { getShipmentByOrderNumber } = require('../services/shipmentService');

// GET api endpoint to get shipment by order number
router.get('/:orderNumber', async (req, res) => {
    try {
        console.log('Getting shipment by order number: ', req.params);
        const { orderNumber } = req.params;
        //call the function to get shipment data
        const shipmentData = await getShipmentByOrderNumber(orderNumber);
        console.log('Shipment data: ', shipmentData);
        res.status(200).json(shipmentData);
    } 
    catch (error) {
        res.status(500).json({ error: 'Failed to get shipment data', details: error.message });
    }
});

module.exports = router;