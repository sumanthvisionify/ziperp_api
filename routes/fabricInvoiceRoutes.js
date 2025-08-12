const express = require('express');
const router = express.Router();
const { getFabricInvoiceByInvoiceNumber } = require('../services/fabricInvoiceService');

router.get('/:invoiceNumber', async (req, res) => {
    try {
        const { invoiceNumber } = req.params || '';
        if(invoiceNumber === '') return res.status(404).json({ error: 'Invoice number is not given! Please provide an invoice number.' });
        const fabricInvoice = await getFabricInvoiceByInvoiceNumber(invoiceNumber);
        
        if(!fabricInvoice)
        {
            return res.status(404).json({ error: 'Fabric invoice not found' });
        }
        const fileName = fabricInvoice.fabric_invoice_filename;
        
        // Set the Headers for the response
        res.setHeader('Content-Type', fabricInvoice.fabric_invoice_mime);
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`); //attachment is used to force the download of the file, else use inline to display.
        if(fabricInvoice.fabric_invoice_size_bytes != null)
        {
            res.setHeader('Content-Length', fabricInvoice.fabric_invoice_size_bytes);
        }
        // Send the buffer data
        return res.send(fabricInvoice.fabric_invoice_data);


    } catch (error) {
        return res.status(500).json({ error: 'Failed to get fabric invoice', details: error.message });
    }
});

module.exports = router;
