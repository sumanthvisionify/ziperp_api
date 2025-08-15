const supabase = require('../config/supabaseClient');

function extractProperties(productProperties) {
  const propertyObject = {
    length: [],
    width: [],
    thickness: [],
    weight: []
  };

  Object.entries(productProperties || {}).forEach(([key, value]) => {
    k = key.toLowerCase();

    if(k.includes('length'))
    {
        propertyObject.length.push(value);
    }
    else if(k.includes('width'))
    {
        propertyObject.width.push(value);
    }
    else if(k.includes('thickness') || k.includes('height'))
    {
        propertyObject.thickness.push(value);
    }
    else if(k.includes('weight'))
    {
        propertyObject.weight.push(value);
    }
  });
  return propertyObject;
}

async function getShipmentByOrderNumber(orderNumber) {
  try {
    const { data, error } = await supabase
    .from('orders')
    .select(`
        order_number,
        order_details(
        order_details_number,
        order_id,
        product_properties
        )
    `)
    .eq('is_deleted', false)
    .eq('order_number', orderNumber)
    .maybeSingle();

    if (error) throw error;
    
    const dimensions = (data?.order_details || []).map((order) =>
    ({
        order_details_number: order.order_details_number,
        ...extractProperties(order.product_properties),
    }));

    console.log(dimensions);
    return {
        orderNumber,
        dimensions
    };
  } 
  catch (error) {
    console.error('Error fetching shipment data: ', error);
    throw error;
  }

}

module.exports = {
    getShipmentByOrderNumber
};