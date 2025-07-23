const supabase = require('../config/supabaseClient');

// Helper function to format shipping address
function formatShippingAddress(shippingAddress) {
  if (!shippingAddress) return null;
  
  const parts = [
    shippingAddress.first_name,
    shippingAddress.last_name,
    shippingAddress.company,
    shippingAddress.address1,
    shippingAddress.address2,
    shippingAddress.city,
    shippingAddress.province,
    shippingAddress.country,
    shippingAddress.zip
  ].filter(Boolean); // Remove empty/undefined values
  
  return parts.join(', ');
}

// Helper function to format customer address
function formatCustomerAddress(customer) {
  if (!customer || !customer.default_address) return null;
  
  const address = customer.default_address;
  const parts = [
    address.first_name,
    address.last_name,
    address.company,
    address.address1,
    address.address2,
    address.city,
    address.province,
    address.country,
    address.zip
  ].filter(Boolean);
  
  return parts.join(', ');
}

// Helper function to get or create customer
async function getOrCreateCustomer(customerData) {
  try {
    // First try to find the customer by email
    const email = customerData.email;
    const { data: existingCustomer, error: lookupError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email)
      .eq('is_deleted', false)
      .single();

    if (lookupError && lookupError.code !== 'PGRST116') throw lookupError;

    if (existingCustomer) {
      return existingCustomer;
    }

    // If customer doesn't exist, create a new one
    const { data: newCustomer, error: createError } = await supabase
      .from('customers')
      .insert([{
        name: customerData.name,
        email: email,
        phone: customerData.phone,
        address: customerData.address,
        status: customerData.status || 'active',
        is_deleted: false
      }])
      .select()
      .single();

    if (createError) throw createError;
    return newCustomer;
  } catch (error) {
    throw error;
  }
}

// Helper function to find or create product
async function findOrCreateProduct(productData) {
  try {
    console.log(`Looking for product: ${productData.title}`);
    
    // Try to find product by name first since product id in shopify and in our database are different
    console.log(`Searching for product with exact name: "${productData.title}"`);
    
    const { data: existingProduct, error: lookupError } = await supabase
      .from('products')
      .select('id, name')
      .eq('name', productData.title)
      .eq('is_deleted', false)
      .single();

    console.log('Product lookup result:', { existingProduct, lookupError });
    
    // If not found, try a case-insensitive search
    if (!existingProduct && lookupError && lookupError.code === 'PGRST116') {
      console.log(`Exact match not found, trying case-insensitive search for: "${productData.title}"`);
      
      const { data: caseInsensitiveProducts, error: caseError } = await supabase
        .from('products')
        .select('id, name')
        .ilike('name', productData.title)
        .eq('is_deleted', false);
        
      console.log('Case-insensitive lookup result:', { caseInsensitiveProducts, caseError });
      
      if (caseInsensitiveProducts && caseInsensitiveProducts.length > 0) {
        // Use the first matching product
        const firstMatch = caseInsensitiveProducts[0];
        console.log(`Found existing product (case-insensitive): ${firstMatch.name} (ID: ${firstMatch.id})`);
        console.log(`Total matches found: ${caseInsensitiveProducts.length}`);
        return firstMatch.id;
      }
    }

    if (lookupError && lookupError.code !== 'PGRST116') throw lookupError;

    if (existingProduct) {
      console.log(`Found existing product: ${existingProduct.name} (ID: ${existingProduct.id})`);
      return existingProduct.id;
    }

    // Create new product if not found
    console.log(`Creating new product: ${productData.title}`);
    const { data: newProduct, error: createError } = await supabase
      .from('products')
      .insert([{
        name: productData.title,
        description: `Product imported from Shopify`,
        base_unit: 'piece',
        is_deleted: false,
        //product_quantity: productData.quantity
      }])
      .select()
      .single();

    if (createError) {
      console.error('Error creating product:', createError);
      throw createError;
    }
    
    console.log(`Created new product: ${newProduct.name} (ID: ${newProduct.id})`);
    return newProduct.id;
  } catch (error) {
    console.error('Error in findOrCreateProduct:', error);
    throw error;
  }
}

exports.processShopifyOrder = async (shopifyOrder) => {
  try {
    // Check if order is cancelled/voided - but still process it with cancelled status
    const isCancelled = shopifyOrder.cancelled_at || shopifyOrder.financial_status === 'voided';
    if (isCancelled) {
       
      console.log(`Order ${shopifyOrder.order_number} is cancelled/voided, will be processed with cancelled status`);
    }


    // Transform customer data
    const customerData = {
      name: `${shopifyOrder.customer.first_name} ${shopifyOrder.customer.last_name}`.trim(),
      email: shopifyOrder.customer.email,
      phone: shopifyOrder.customer.phone || shopifyOrder.customer.default_address?.phone,
      address: formatCustomerAddress(shopifyOrder.customer),
      status: 'active'
    };

    // Get or create customer
    const customer = await getOrCreateCustomer(customerData);

    // Map fulfillment status to our status
    const statusMap = {
      'unfulfilled': 'pending',
      'fulfilled': 'completed',
      'partially_fulfilled': 'in_progress',
      'cancelled': 'cancelled'
    };

    // Process line items and find/create products
    console.log('Processing line items:', shopifyOrder.line_items.length);
    
    const processedLineItems = await Promise.all(shopifyOrder.line_items.map(async (item, index) => {
      console.log(`Processing line item ${index + 1}:`, {
        title: item.title,
        quantity: item.quantity,
        quantity_type: typeof item.quantity,
        price: item.price
      });
      
      const productId = await findOrCreateProduct({
        title: item.title
      });

      // Ensure quantity is a number and has a valid value
      const productQuantity = parseInt(item.quantity) || 1;
      console.log(`Converted quantity for ${item.title}: ${item.quantity} -> ${productQuantity}`);

      const processedItem = {
        product_id: productId,
        product_quantity: productQuantity,
        status: 'pending'
      };
      
      console.log(`Processed line item ${index + 1}:`, processedItem);
      return processedItem;
    }));
    
    console.log('All processed line items:', processedLineItems);

    // Create the main order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        order_date: new Date(shopifyOrder.created_at).toISOString().split('T')[0],
        status: isCancelled ? 'cancelled' : (statusMap[shopifyOrder.fulfillment_status] || 'pending'),
        total_price: parseFloat(shopifyOrder.total_price) || 0,
        order_number: parseInt(shopifyOrder.order_number),
        customer_id: customer.id,
        is_deleted: isCancelled ? true : false
      }])
      .select()
      .single();
      
    if (orderError) throw orderError;

    // Create order details
    if (processedLineItems.length > 0) {
      const orderDetailsWithOrderId = processedLineItems.map(detail => ({
        ...detail,
        order_id: order.id,
        factory_id: null, // Will be set later if needed
        company_id: null, // Will be set later if needed
        status: isCancelled ? 'cancelled' : (statusMap[shopifyOrder.fulfillment_status] || 'pending'),
        is_deleted: isCancelled ? true : false
      }));
      
      console.log('Creating order details:', orderDetailsWithOrderId);
      
      const { data: createdDetails, error: detailsError } = await supabase
        .from('order_details')
        .insert(orderDetailsWithOrderId)
        .select('*');
        
      if (createdDetails) {
        console.log('Created order details in database:', createdDetails);
      }
        
      if (detailsError) {
        console.error('Error creating order details:', detailsError);
        throw detailsError;
      }
      
      console.log(`Successfully created ${createdDetails.length} order details`);
    } else {
      console.log('No line items to process');
    }

    // Create shipping details if shipping address exists
    let shippingDetailsId = null;
    if (shopifyOrder.shipping_address) {
      const { data: shippingDetails, error: shippingError } = await supabase
        .from('shipping_details')
        .insert([{
          order_id: order.id,
          status: isCancelled ? 'cancelled' : 'not_shipped',
          shipping_address: formatShippingAddress(shopifyOrder.shipping_address)
        }])
        .select()
        .single();
        
      if (shippingError) throw shippingError;
      shippingDetailsId = shippingDetails.id;
    }

    // Log activity
    const activityMessage = isCancelled 
      ? `Created cancelled order from Shopify webhook #${shopifyOrder.order_number}` 
      : `Created order from Shopify webhook #${shopifyOrder.order_number}`;
    //await logActivity(activityMessage, order.id);

    console.log(`Successfully processed Shopify order #${shopifyOrder.order_number}`);

    return {
      order_id: order.id,
      order_number: shopifyOrder.order_number,
      customer_id: customer.id,
      shipping_details_id: shippingDetailsId,
      status: isCancelled ? 'cancelled' : 'created'
    };

  } catch (error) {
    console.error('Error in processShopifyOrder:', error);
    throw error;
  }
};

exports.updateShopifyOrder = async (shopifyOrder) => {
  try {
    // Find existing order
    const { data: existingOrder, error: findError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('order_number', shopifyOrder.order_number)
      .single();

    if (findError) throw findError;
    if (!existingOrder) {
      throw new Error(`Order ${shopifyOrder.order_number} not found`);
    }

    // Map fulfillment status to our status
    const statusMap = {
      'unfulfilled': 'pending',
      'fulfilled': 'completed',
      'partially_fulfilled': 'in_progress',
      'cancelled': 'cancelled'
    };

    const newStatus = statusMap[shopifyOrder.fulfillment_status] || existingOrder.status;

    // Update order status
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: newStatus,
        total_price: parseFloat(shopifyOrder.total_price) || 0
      })
      .eq('id', existingOrder.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log activity
    //await logActivity(`Updated order status to ${newStatus} from Shopify webhook`, existingOrder.id);

    return {
      order_id: updatedOrder.id,
      order_number: shopifyOrder.order_number,
      status: newStatus
    };

  } catch (error) {
    console.error('Error in updateShopifyOrder:', error);
    throw error;
  }
};

exports.cancelShopifyOrder = async (shopifyOrder) => {
  try {
    // Find existing order
    const { data: existingOrder, error: findError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('order_number', shopifyOrder.order_number)
      .single();

    if (findError) throw findError;
    if (!existingOrder) {
      throw new Error(`Order ${shopifyOrder.order_number} not found`);
    }

    // Update order status to cancelled
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: 'cancelled'
      })
      .eq('id', existingOrder.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log activity
    //await logActivity(`Cancelled order from Shopify webhook - reason: ${shopifyOrder.cancel_reason}`, existingOrder.id);

    return {
      order_id: updatedOrder.id,
      order_number: shopifyOrder.order_number,
      status: 'cancelled',
      cancel_reason: shopifyOrder.cancel_reason
    };

  } catch (error) {
    console.error('Error in cancelShopifyOrder:', error);
    throw error;
  }
}; 