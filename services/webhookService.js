const supabase = require('../config/supabaseClient');
const customerService = require('./customerService');

// Helper function to format shipping address
function formatShippingAddress(shippingAddress) {
  if (!shippingAddress) return null;
  
  // Create a more structured address format
  const addressParts = [];
  
  // Add name
  if (shippingAddress.first_name || shippingAddress.last_name) {
    addressParts.push(`${shippingAddress.first_name || ''} ${shippingAddress.last_name || ''}`.trim());
  }
  
  // Add company if available
  if (shippingAddress.company) {
    addressParts.push(shippingAddress.company);
  }
  
  // Add address lines
  if (shippingAddress.address1) {
    addressParts.push(shippingAddress.address1);
  }
  if (shippingAddress.address2) {
    addressParts.push(shippingAddress.address2);
  }
  
  // Add city, state, zip, country
  const cityStateZip = [
    shippingAddress.city,
    shippingAddress.province,
    shippingAddress.zip
  ].filter(Boolean).join(', ');
  
  if (cityStateZip) {
    addressParts.push(cityStateZip);
  }
  
  if (shippingAddress.country) {
    addressParts.push(shippingAddress.country);
  }
  
  // Add phone if available
  if (shippingAddress.phone) {
    addressParts.push(`Phone: ${shippingAddress.phone}`);
  }
  
  return addressParts.join('\n');
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
    console.log(`Created new customer: ${newCustomer.name} (ID: ${newCustomer.id})}`);
    //customerService.logActivity(data.id, `Created customer with name : ${newCustomer.name}, email : (${newCustomer.email}) with id ${newCustomer.id}`);
    return newCustomer;
  } catch (error) {
    throw error;
  }
}

// Helper function to find or create product
async function findOrCreateProduct(productData, sku) {
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
    
    // Create stock entry for the new product
    console.log(`Creating stock entry for new product: ${newProduct.name} (Product ID: ${newProduct.id})`);
    const { data: stockEntry, error: stockError } = await supabase
      .from('stock')
      .insert([{
        product_id: newProduct.id,
        item_id: null, // Products don't have item_id
        factory_id: null, // Will be set later when assigned to a factory
        item_type: 'product', // For products (vs 'item' for items)
        available_quantity: 0, // Start with 0 stock
        expected_quantity: 0, // Start with 0 expected
        status: 'in_stock'
      }])
      .select()
      .single();

    if (stockError) {
      console.error('Error creating stock entry:', stockError);
      // Don't throw error here, just log it - the product was created successfully
      console.log('Product created but stock entry failed - this can be fixed manually');
    } else {
      console.log(`Created stock entry for product: ${newProduct.name} (Stock ID: ${stockEntry.id})`);
    }
    
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
      'unfulfilled': 'new',
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
        price: item.price,
        total_discount: item.total_discount,
        properties: item.properties
      });
      
      const productId = await findOrCreateProduct({
        title: item.title
      });

      // Ensure quantity is a number and has a valid value
      const productQuantity = parseInt(item.quantity) || 1;
      console.log(`Converted quantity for ${item.title}: ${item.quantity} -> ${productQuantity}`);

      // Extract product properties from Shopify line item
      const productProperties = item.properties ? item.properties.reduce((acc, prop) => {
        acc[prop.name] = prop.value;
        return acc;
      }, {}) : {};

      // Calculate price per unit (total price / quantity)
      const totalPrice = item.price ? parseFloat(item.price) : 0;
      const pricePerUnit = productQuantity > 0 ? totalPrice / productQuantity : totalPrice;
      console.log(`Price calculation for ${item.title}: Total=${totalPrice}, Quantity=${productQuantity}, Price per unit=${pricePerUnit}`);

      const processedItem = {
        product_id: productId,
        product_quantity: productQuantity,
        product_properties: productProperties,
        price_per_unit: pricePerUnit,
        status: 'pending'
      };
      
      console.log(`Processed line item ${index + 1}:`, processedItem);
      return processedItem;
    }));
    
    console.log('All processed line items:', processedLineItems);

    // Extract total discount and tax from Shopify order
    const totalDiscount = shopifyOrder.total_discounts ? parseFloat(shopifyOrder.total_discounts) : 0;
    const totalTax = shopifyOrder.total_tax ? parseFloat(shopifyOrder.total_tax) : 0;
    
    console.log('Order totals from Shopify:', {
      total_price: shopifyOrder.total_price,
      total_discounts: shopifyOrder.total_discounts,
      total_tax: shopifyOrder.total_tax,
      parsed_discount: totalDiscount,
      parsed_tax: totalTax
    });

    // Create the main order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        order_date: new Date(shopifyOrder.created_at).toISOString().split('T')[0],
        status: isCancelled ? 'cancelled' : (statusMap[shopifyOrder.fulfillment_status] || 'new'),
        total_price: parseFloat(shopifyOrder.total_price) || 0,
        total_discount: totalDiscount,
        total_tax: totalTax,
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
        factory_id: null,
        company_id: null,
        status: isCancelled ? 'cancelled' : (statusMap[shopifyOrder.fulfillment_status] || 'new'),
        is_deleted: isCancelled ? true : false
      }));
      
      console.log('Creating order details:', orderDetailsWithOrderId);
      
      const { data: createdDetails, error: detailsError } = await supabase
        .from('order_details')
        .insert(orderDetailsWithOrderId)
        .select('*');
        
      if (createdDetails) {
        console.log('Created order details in database:', createdDetails);
      console.log('Order created with totals:', {
        order_id: order.id,
        total_price: order.total_price,
        total_discount: order.total_discount,
        total_tax: order.total_tax
      });
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
    if (shopifyOrder.shipping_address || shopifyOrder.shipping_lines) {
      console.log('Processing shipping details from Shopify order');
      console.log('Shipping address from Shopify:', shopifyOrder.shipping_address);
      console.log('Shipping lines from Shopify:', shopifyOrder.shipping_lines);
      console.log('Total shipping price set:', shopifyOrder.total_shipping_price_set);
      console.log('Total tax:', shopifyOrder.total_tax);
      
      // Extract shipping information from Shopify payload
      const shippingInfo = {
        order_id: order.id,
        status: isCancelled ? 'cancelled' : 'not_shipped',
        shipping_address: shopifyOrder.shipping_address ? formatShippingAddress(shopifyOrder.shipping_address) : null,
        shipping_method: null,
        notes: null,
        carrier: null,
        shipping_cost: 0.00,
        tracking_number: null
      };

      // Extract shipping method and carrier from shipping_lines
      if (shopifyOrder.shipping_lines && shopifyOrder.shipping_lines.length > 0) {
        const shippingLine = shopifyOrder.shipping_lines[0]; // Take the first shipping line
        shippingInfo.shipping_method = shippingLine.title || null;
        
        // Try to extract carrier from code or title
        if (shippingLine.code) {
          // Extract carrier from code like "Standard Shipping for Fabric Samples_1"
          const codeParts = shippingLine.code.split(' for ');
          if (codeParts.length > 0) {
            shippingInfo.carrier = codeParts[0] || null;
          }
        }
      }

      // Extract shipping cost from total_shipping_price_set
      if (shopifyOrder.total_shipping_price_set && shopifyOrder.total_shipping_price_set.shop_money) {
        shippingInfo.shipping_cost = parseFloat(shopifyOrder.total_shipping_price_set.shop_money.amount) || 0.00;
        console.log('Extracted shipping cost from total_shipping_price_set:', shippingInfo.shipping_cost);
        console.log('Raw shipping price data:', shopifyOrder.total_shipping_price_set.shop_money);
      } else if (shopifyOrder.total_shipping_price) {
        // Fallback to total_shipping_price if available
        shippingInfo.shipping_cost = parseFloat(shopifyOrder.total_shipping_price) || 0.00;
        console.log('Extracted shipping cost from total_shipping_price:', shippingInfo.shipping_cost);
      } else {
        shippingInfo.shipping_cost = 0.00;
        console.log('No shipping cost found, defaulting to 0.00');
      }

      // Log tax information for reference
      if (shopifyOrder.total_tax) {
        const taxAmount = parseFloat(shopifyOrder.total_tax);
        console.log('Total order tax from Shopify:', taxAmount);
      }
      
      console.log('Extracted shipping info:', {
        method: shippingInfo.shipping_method,
        cost: shippingInfo.shipping_cost,
        carrier: shippingInfo.carrier,
        notes: shippingInfo.notes
      });

      // Add order notes if available
      if (shopifyOrder.note) {
        shippingInfo.notes = shopifyOrder.note;
      }

      console.log('Creating shipping details with:', shippingInfo);

      const { data: shippingDetails, error: shippingError } = await supabase
        .from('shipping_details')
        .insert([shippingInfo])
        .select()
        .single();
        
      if (shippingError) throw shippingError;
      shippingDetailsId = shippingDetails.id;
      console.log('Created shipping details with ID:', shippingDetailsId);
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
      status: isCancelled ? 'cancelled' : 'new'
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
      'unfulfilled': 'new',
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