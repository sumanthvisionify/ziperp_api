const supabase = require('../config/supabaseClient');

async function getFabricInvoiceByInvoiceNumber(invoiceNumber) {
    const { data, error } = await supabase
        .from('orders')
        .select(`
            order_number,
            fabric_invoice_number,
            fabric_invoice_mime,
            fabric_invoice_filename,
            fabric_invoice_data,
            fabric_invoice_size_bytes
            `)
        .eq('fabric_invoice_number', invoiceNumber);

    if (error) 
    {
        if(error.code === 'PGRST116')
        {
            const e = new Error(error.message || 'Look Up Error!!!');
            e.status = 500;
            throw e;
        }
        else
        {
            throw error;
        }
    }

    if(!data.fabric_invoice_data) 
    {
        console.log('No fabric invoice data found for invoice number: ' + invoiceNumber);
        return null;
    }

    //  Convert the raw binary data into base64 string data
    const buffer = Buffer.from(data.fabric_invoice_data, 'base64');


    
    return {
        order_number: data.order_number,
        fabric_invoice_number: data.fabric_invoice_number || null,
        fabric_invoice_mime: data.fabric_invoice_mime || null,
        fabric_invoice_filename: data.fabric_invoice_filename || `fabric_invoice_${invoiceNumber}.pdf`,
        fabric_invoice_data: buffer || null,
        fabric_invoice_size_bytes: data.fabric_invoice_size_bytes || null
    };
    
}

module.exports = {
    getFabricInvoiceByInvoiceNumber
};